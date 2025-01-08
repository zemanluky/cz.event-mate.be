import {type IUser, type THydratedUserDocument, User} from "../schema/db/user.schema.ts";
import {NotFoundError} from "../error/response/not-found.error.ts";
import {Types} from "mongoose";
import type {TUserFilterQuery} from "../schema/request/user.schema.ts";

type TUserDetail = IUser & { average_rating: number };

/**
 * Lists users based on the given filter.
 * @param filter
 */
export async function listUsers(filter: TUserFilterQuery): Promise<Array<IUser>> {
    const baseQuery = User.find();

    if (filter.search) {
        baseQuery.or([
            { name: new RegExp(`${filter.search}`, 'i') },
            { surname: new RegExp(`${filter.search}`, 'i') },
            { username: new RegExp(`${filter.search}`, 'i') }
        ]);
    }

    return (await baseQuery.exec()).map(user => user.toObject());
}

/**
 * Gets a user by their ID.
 * @param id
 */
export async function getUser(id: Types.ObjectId): Promise<IUser> {
    const user = await User.findById(id);

    if (!user) throw new NotFoundError(`Could not find user with ID: ${id}.`, 'user');

    return user.toObject();
}

/**
 * Gets details of multiple users by their IDs.
 * These details include user's name, surname, username, and also the user's average rating.
 * This may be useful to retrieve when displaying a list of events.
 * @param ids
 */
export async function getAuthorsList(ids: Array<Types.ObjectId>): Promise<Array<TUserDetail>> {
    return User.aggregate([
        { $match: {_id: {$in: ids}} },
        { $addFields: {average_rating: {$avg: "$ratings.starRating"}}}
    ]);
}

/**
 * Gets a list of friends for a given user.
 * @param id
 */
export async function getUserFriends(id: Types.ObjectId): Promise<Array<Types.ObjectId>> {
    const user = await User.findById(id);

    if (!user)
        throw new NotFoundError(`Could not find user with ID: ${id}.`, 'user');

    return user.friends;
}

/**
 * Gets all users
 */
export async function getAllUsers(): Promise<IUser[]> {
    return await User.find();
}