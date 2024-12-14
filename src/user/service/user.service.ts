import {type IUser, User} from "../schema/db/user.schema.ts";
import {NotFoundError} from "../error/response/not-found.error.ts";
import {Types} from "mongoose";

/**
 * Gets a user by their ID.
 * @param id
 */
export async function getUser(id: string): Promise<IUser> {
    const user = await User.findById(id);

    if (!user)
        throw new NotFoundError(`Could not find user with ID: ${id}.`, 'user');

    return user.toObject();
}

/**
 * Gets details of multiple users by their IDs.
 * These details include user's name, surname, username, and also the user's average rating.
 * This may be useful to retrieve when displaying a list of events.
 * @param ids
 */
export async function getAuthorsList(ids: Array<Types.ObjectId>): Promise<Array<IUser & { average_rating: number }>> {
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