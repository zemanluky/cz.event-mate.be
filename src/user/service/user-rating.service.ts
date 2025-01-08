import {Types} from "mongoose";
import type {IUserRating, THydratedRatingDocument} from "../schema/db/rating.schema.ts";
import {type IUser, type THydratedUserDocument, User} from "../schema/db/user.schema.ts";
import {NotFoundError} from "../error/response/not-found.error.ts";
import type {TRatingBody} from "../schema/request/user.schema.ts";
import {BadRequestError} from "../error/response/bad-request.error.ts";
import type {TResponse} from "../helper/response.helper.ts";
import {getFetchHeaders, microserviceUrl} from "../helper/microservice.url.ts";
import { ServerError } from "../error/response/server.error.ts";

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
 * Adds a rating for a user.
 * @param userId The ID of the user to be rated.
 * @param ratingData The information about the rating.
 * @param authorId The author of the review.
 */
export async function addUserRating(userId: Types.ObjectId, ratingData: TRatingBody, authorId: Types.ObjectId): Promise<IUser> {
    // check if the user is trying to rate themselves
    if (authorId.equals(userId))
        throw new BadRequestError("You cannot rate yourself.", "rating:self_rating");

    const { comment, starRating } = ratingData;

    const userToBeRated = await User.findById(userId);

    // the user being rated does not exist
    if (!userToBeRated)
        throw new NotFoundError(`Cannot rate the user with ID '${userId.toString()}' since they do not exist.`, "user");

    // check if the user has already rated the user
    if (userToBeRated.ratings.some((rating: IUserRating) => rating.author.equals(authorId)))
        throw new BadRequestError("You have already rated this user. Cannot create a new rating.", "rating:already_rated");

    // check if the user has already attended any event of the rated user
    const hasAttendedAnyEventResponse: TResponse<{ hasAttended: boolean }> = await fetch(
        microserviceUrl('event', '/check-attendance', { authorId: userId.toString(), userId: authorId.toString() }),
        {headers: getFetchHeaders()}
    ).then(res => res.json());

    if (!hasAttendedAnyEventResponse.success)
        throw new ServerError(
            `Failed to fetch whether the current user has attended any of the author's events due to an error on
             the event microservice: ${hasAttendedAnyEventResponse.error.message}`
        );

    if (!hasAttendedAnyEventResponse.data.hasAttended)
        throw new BadRequestError("You must attend at least one event of the user before rating them.", "rating:no_attendance");

    userToBeRated.ratings.push({
        author: authorId,
        comment, starRating
    });
    userToBeRated.markModified('ratings');

    return (await userToBeRated.save()).toObject();
}

