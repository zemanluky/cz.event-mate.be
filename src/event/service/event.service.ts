import mongoose from "mongoose";
import { NotFoundError } from "../error/response/not-found.error";
import { getFetchHeaders, microserviceUrl } from "../helper/microservice.url";
import { Event } from "../schema/db/event.schema";
import type { TFilterEventsValidator, TUserEventsValidator } from "../schema/request/event.schema";

export async function getFilteredEvents(data: TFilterEventsValidator, userId: string) {
    const location = data.location;

    const dateStart = data.dateStart;
    const dateEnd = data.dateEnd;

    const requiredRating = Number(data.rating);

    const type = data.type;

    const friendsOnly = data.friendsOnly;

    const publicOnly = data.publicOnly;

    const pageSize = Number(data.pageSize);
    const pageNumber = Number(data.pageNumber);

    let query = {};

    let userRatingsObj ={};

    if (location) {
        query = { ...query, location: location };
    }

    if (dateStart) {
        query = { ...query, date: { $gte: new Date(dateStart) } };
    }

    if (dateEnd) {
        query = { ...query, date: { $lte: new Date(dateEnd) } };
    }

    if (requiredRating) {
        const allUsers = await fetch(microserviceUrl('user', 'all'), {
            headers: getFetchHeaders(),
        }).then((response) => {
            return response.json();
        })

        userRatingsObj = allUsers.data.reduce((acc: any, user: any) => {
            acc[user._id] = user.ratings.reduce((acc: number, rating: any) => acc + rating.starRating, 0) / user.ratings.length;
            return acc;
        }, {});

        query = { ...query, userRating: { $gte: requiredRating } };
    }

    if (type) {
        query = { ...query, category: type };
    }

    if (friendsOnly) {
        const userProfile = await fetch(microserviceUrl('user', 'profile', { userId: userId }), {
            headers: getFetchHeaders(),
        }).then((response) => {
            return response.json();
        })

        query = { ...query, "ownerId": { "$in": userProfile.data.friends.map((id: string) => new mongoose.Types.ObjectId(id)) } };
    }

    if (publicOnly) {
        query = { ...query, private: false };
    }

    const events = Event.aggregate([
        {
            $addFields: {
                userRating: {
                    "$function": {
                        body: function (userRatingsObj: any, ownerId: any) {

                            return userRatingsObj[String(ownerId.str)];
                        },
                        args: [userRatingsObj, "$ownerId"],
                        lang: "js"
                    }
                }
            }
        },
        {
            $match: query
        },
    ]).limit(Number(pageSize)).skip(Number(pageSize) * Number(pageNumber)).exec();

    if (!events) throw new NotFoundError('No events found', 'event');

    return events;
}

export async function getUsersEvents(data: TUserEventsValidator) {
    const userId = data.userId;
    const pageSize = Number(data.pageSize);
    const pageNumber = Number(data.pageNumber);

    const events = Event.find({ "ownerId": userId }).limit(Number(pageSize)).skip(Number(pageSize) * Number(pageNumber)).exec();

    if (!events) throw new NotFoundError('No events found', 'event');

    return events;
}