import mongoose, {type Document, type HydratedDocument, Types} from "mongoose";
import { NotFoundError } from "../error/response/not-found.error";
import { getFetchHeaders, microserviceUrl } from "../helper/microservice.url";
import {Event, type IEvent, type THydratedEventDocument} from "../schema/db/event.schema";
import type {TEventBody, TFilterEventsValidator} from "../schema/request/event.schema";
import type {TResponse} from "../helper/response.helper.ts";
import {ServerError} from "../error/response/server.error.ts";
import {BadRequestError} from "../error/response/bad-request.error.ts";
import {PermissionError} from "../error/response/permission.error.ts";
import {exists} from "./category.service.ts";
import type {ICategory, THydratedCategoryDocument} from "../schema/db/category.schema.ts";
import * as R from "remeda";

/**
 * Gets a filtered and paginated list of events.
 * @param queryFilter
 * @param userId
 */
export async function getFilteredEvents(queryFilter: TFilterEventsValidator, userId: string) {
    const { location, dateStart, dateEnd, rating, category, filter, pageSize, pageNumber, userId: authorId } = queryFilter;

    // fetch list of friends of the current user
    const friendListResponse: TResponse<Array<string>> = await fetch(microserviceUrl('user', `${userId}/friend-list`), {
        headers: getFetchHeaders(),
    }).then((response) => {
        return response.json();
    });

    if (!friendListResponse.success)
        throw new ServerError(`Failed to fetch friend list of current user due to an error on the microservice: ${friendListResponse.error.message}`);

    const baseQuery = Event.find();

    // filter events only accessible to the user
    if (filter === 'friends-only') {
        if (authorId && friendListResponse.data.includes(authorId)) {
            baseQuery.where({ private: true, ownerId: new Types.ObjectId(authorId) });
        }
        else if (!authorId) {
            baseQuery.where({ private: true, ownerId: { $in: friendListResponse.data.map(id => new Types.ObjectId(id)) } });
        }
        // we have an author filter set, but the author is not in the friend list
        else {
            throw new BadRequestError('Cannot filter private events of a user who is not your friend.', 'event.filter:private');
        }
    }
    else if (filter === 'public-only') {
        baseQuery.where({ private: false, ownerId: { $ne: userId } });
    }
    else {
        if (authorId && !friendListResponse.data.includes(authorId)) {
            baseQuery.where({ private: true, ownerId: new Types.ObjectId(authorId) });
        }
        else {
            baseQuery.or([
                { private: false, ownerId: { $ne: userId } },
                { private: true, ownerId: { $in: friendListResponse.data.map(id => new Types.ObjectId(id)) } }
            ]);
        }
    }

    // filter by the location of the event and its category
    if (location) baseQuery.where({ location: new RegExp(`${location}`, 'i') });
    if (category) baseQuery.where({ category });

    // filter by date range of the event
    if (dateStart && dateEnd) {
        baseQuery.where({date: { $gte: dateStart, $lte: dateEnd }});
    }
    else if (dateEnd) {
        baseQuery.where({date: { $lte: dateEnd }});
    }
    else if (dateStart) {
        baseQuery.where({date: { $gte: dateStart }});
    }

    const events = await baseQuery
        .skip(pageSize * (pageNumber - 1))
        .limit(pageSize)
        .exec();

    if (events.length === 0)
        return events;

    const authorIdSet = new Set(events.map((event) => event.ownerId.toString()));
    const authorsResponse: TResponse<Record<string, any>> = await fetch(
        microserviceUrl('user', 'authors', { authorIds: authorIdSet.values().toArray().join(',') }),
        {headers: getFetchHeaders()}
    ).then(res => res.json());

    if (!authorsResponse.success)
        throw new ServerError(`Failed to fetch authors list of retrieved events due to an error on the microservice: ${authorsResponse.error.message}`);

    return await Promise.all(events.map(async (event) => addEventDetail(event)));
}

/**
 * Adds category detail to an event object.
 * @param event
 */
async function addEventCategory(event: THydratedEventDocument) {
    return event.populate<{ category: THydratedCategoryDocument }>('category');
}

/**
 * Gets the user details of the author and attendees of a given event.
 * @param event
 */
async function addUserDetails(event: THydratedEventDocument): Promise<{ author: Object, attendees: Array<Object> }> {
    const attendeeIds = event.attendees.map(a => a.toString());
    const usersToFetch = R.unique([event.ownerId.toString(), ...attendeeIds]);

    const authorsResponse: TResponse<Record<string, any>> = await fetch(
        microserviceUrl('user', 'authors', { authorIds: usersToFetch.join(',') }),
        {headers: getFetchHeaders()}
    ).then(res => res.json());

    if (!authorsResponse.success)
        throw new ServerError(`Failed to fetch authors list of retrieved events due to an error on the microservice: ${authorsResponse.error.message}`);

    if (!(event.ownerId.toString() in authorsResponse.data))
        throw new ServerError('Invalid event object.');

    return {
        author: authorsResponse.data[event.ownerId.toString()],
        attendees: Object.values(authorsResponse.data).map((user: any) => R.omit(user, ['ratings', 'average_rating']))
    };
}

type TEVentDetail = Omit<IEvent, 'ownerId'|'attendees'|'category'> & { author: any, attendees: Array<Object>, category: ICategory };

/**
 * Adds exported author and category detail to a given event object.
 * @param event
 */
async function addEventDetail(event: THydratedEventDocument): Promise<TEVentDetail> {
    const eventWithCategory = await addEventCategory(event);
    const { author, attendees } = await addUserDetails(event);

    const eventObject = R.omit(event.toObject(), ['category', 'ownerId']);

    return {
        category: eventWithCategory.category.toObject(),
        ...eventObject,
        attendees,
        author
    }
}

/**
 * Gets detail of a single event.
 * @param id
 */
export async function getEvent(id: string): Promise<TEVentDetail> {
    const event = await Event.findById(id);

    if (!event) throw new NotFoundError(`Could not find event with ID: ${id}.`, "event");

    return addEventDetail(event);
}

/**
 * Creates new event with given data.
 * @param event
 * @param userId
 */
export async function createEvent(event: TEventBody, userId: string): Promise<TEVentDetail> {
    // first we have to check the category actually exists
    if (!(await exists(event.category)))
        throw new BadRequestError(
            `Category with id '${event.category}' does not exist and therefore an event with such category may not be created.`,
            'event:invalid_category'
        );

    const creatorObjectId = new Types.ObjectId(userId);

    // create new event
    const newEvent = new Event({
        ...event,
        category: event.category,
        description: event.description ?? null, // set description to null if it is not provided
        attendees: [creatorObjectId],
        ownerId: creatorObjectId
    });

    return addEventDetail(await newEvent.save());
}

/**
 * Updates existing event with new data.
 * @param id
 * @param updates
 * @param userId
 */
export async function updateEvent(id: string, updates: TEventBody, userId: string): Promise<TEVentDetail> {
    const event = await Event.findById(id);

    // checking if the event exists
    if (!event)
        throw new NotFoundError(`Could not find event with ID: ${id}.`, "event");

    // checking if the current user may edit the event
    if (!event.ownerId.equals(userId))
        throw new PermissionError('You are not authorized to update this event.', 'event:write');

    // optionally check if the category is updated to an existing category
    if (!event.category.equals(updates.category) && !(await exists(updates.category)))
        throw new BadRequestError(
            `Category with id '${event.category}' does not exist and therefore an event with such category may not be updated.`,
            'event:invalid_category'
        );

    // finally update the event
    const updatedEvent = await Event.findByIdAndUpdate(
        id, {...updates, description: updates.description ?? null}, {new: true}
    );

    return addEventDetail(updatedEvent!);
}