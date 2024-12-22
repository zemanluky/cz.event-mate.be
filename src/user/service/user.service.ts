import {type IUser, type THydratedUserDocument, User} from "../schema/db/user.schema.ts";
import {NotFoundError} from "../error/response/not-found.error.ts";
import {Types} from "mongoose";
import type {IUserRating, THydratedRatingDocument} from "../schema/db/rating.schema.ts";

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
 * Gets the ratings of a specific user by their ID.
 * @param userId The ID of the user whose ratings will be fetched.
 */
export const getUserRatings = async (userId: Types.ObjectId): Promise<IUserRating[]> => {
    const user: THydratedUserDocument|null = await User.findById(userId).populate("ratings").exec();

    if (!user)
        throw new NotFoundError(`User with ID ${userId} not found.`, "user");

    return user.ratings.map((rating: THydratedRatingDocument) => rating.toObject());
};

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