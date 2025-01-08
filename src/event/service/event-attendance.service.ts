import {Event, type THydratedEventDocument} from "../schema/db/event.schema.ts";
import {PermissionError} from "../error/response/permission.error.ts";
import {NotFoundError} from "../error/response/not-found.error.ts";
import {Types} from "mongoose";
import {BadRequestError} from "../error/response/bad-request.error.ts";
import {isPast} from "date-fns";
import * as R from "remeda";
import type {TResponse} from "../helper/response.helper.ts";
import {getFetchHeaders, microserviceUrl} from "../helper/microservice.url.ts";
import {ServerError} from "../error/response/server.error.ts";

/**
 * Checks whether the current user is a friend of the event creator.
 * @param event
 * @param userId
 */
async function checkUserIsFriendOfOwner(event: THydratedEventDocument, userId: string): Promise<boolean> {
    const creatorId = event.ownerId.toString();

    // fetch list of friends of the current user
    const friendListResponse: TResponse<Array<string>> = await fetch(microserviceUrl('user', `${creatorId}/friend-list`), {
        headers: getFetchHeaders(),
    }).then((response) => {
        return response.json();
    });

    if (!friendListResponse.success)
        throw new ServerError(`Failed to fetch friend list of the author due to an error on the microservice: ${friendListResponse.error.message}`);

    return friendListResponse.data.includes(userId);
}

/**
 * Adds a user to the attendance list of an event.
 * @param eventId The ID of the event to mark attendance for.
 * @param userId The ID of the user to mark attendance for.
 */
export async function joinEvent(eventId: Types.ObjectId, userId: string): Promise<void> {
    const event = await Event.findById(eventId);

    // check the event exists
    if (!event) throw new NotFoundError(`Could not find event with ID: ${eventId}.`, "event");

    // check if the user is the owner of the event
    if (event.ownerId.equals(userId))
        throw new BadRequestError(
            "The event owner cannot join their own event as they are automatically added.",
            "event_attendance:owner_joining"
        );

    // check if the user is already attending the event
    if (event.attendees.some(attendee => attendee.equals(userId)))
        throw new BadRequestError("User is already attending this event", "event_attendance:already_joined");

    // check if the event is in the past
    if (isPast(event.date))
        throw new BadRequestError("Cannot join an event in the past.", "event_attendance:joining_past_event");

    // when the event is private, we need to verify the current user may join it
    if (event.private && !(await checkUserIsFriendOfOwner(event, userId)))
        throw new PermissionError("You are not authorized to join this event", "event:join_private");

    // add the user to the event's attendance list
    event.attendees.push(new Types.ObjectId(userId));

    // Save the updated event
    event.markModified('attendees');
    await event.save();
}

/**
 * Removes a user from the attendance list of an event.
 * @param eventId
 * @param userId
 */
export async function leaveEvent(eventId: Types.ObjectId, userId: string): Promise<void> {
    const event = await Event.findById(eventId);

    // check the event exists
    if (!event) throw new NotFoundError(`Could not find event with ID: ${eventId}.`, "event");

    // check if the user is the owner of the event
    if (event.ownerId.equals(userId))
        throw new BadRequestError("The event owner cannot leave their own event.", "event_attendance:owner_leaving");

    const attendeeIndex = event.attendees.findIndex(attendee => attendee.equals(userId));

    // check if the user is attending the event
    if (attendeeIndex === -1)
        throw new BadRequestError(
            "Cannot remove the user from the attendance list since they are not attending the event.",
            "event_attendance:leave_not_attending"
        );

    // check if the event is in the past
    if (isPast(event.date))
        throw new BadRequestError("Cannot leave an event that has already taken place.", "event_attendance:leaving_past_event");

    event.attendees = R.splice(event.attendees, attendeeIndex, 1, []);

    // Save the updated event
    event.markModified('attendees');
    await event.save();
}

/**
 * Checks whether a given user has attended any event of a given user.
 * @param author
 * @param user
 */
export async function hasUserAttendedAnyAuthorEvent(author: Types.ObjectId, user: Types.ObjectId): Promise<boolean> {
    const numberOfAttendedEvents = await Event.countDocuments({
        ownerId: author,
        attendees: { $elemMatch: { $eq: user } },
        date: { $lte: new Date() }
    });

    return numberOfAttendedEvents > 0;
}