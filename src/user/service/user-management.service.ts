import type { TAvailabilityQuery, TRegistrationData, TUpdateUserData } from "../schema/request/user.schema.ts";
import { type THydratedUserDocument, User, type IUser } from "../schema/db/user.schema.ts";
import { getFetchHeaders, microserviceUrl } from "../helper/microservice.url.ts";
import type { TResponse } from "../helper/response.helper.ts";
import { ServerError } from "../error/response/server.error.ts";
import { BadRequestError } from "../error/response/bad-request.error.ts";
import { NotFoundError } from "../error/response/not-found.error.ts";
import type { IUserRating } from "../schema/db/rating.schema.ts";

type TAvailabilityPair = {
    email?: boolean;
    username?: boolean;
};

/**
 * Gets the ratings of a specific user by their ID.
 * @param userId The ID of the user whose ratings will be fetched.
 */
export const getUserRatings = async (userId: string): Promise<IUserRating[]> => {
    try {
        const user = await User.findById(userId).populate("ratings").exec();

        if (!user) {
            throw new NotFoundError(`User with ID ${userId} not found.`, "user");
        }

        return user.ratings || [];
    } catch (error) {
        throw new ServerError("Error fetching user ratings.");
    }
};

/**
 * Gets a user by ID.
 * @param id
 */
export async function getUser(id: string): Promise<IUser> {
    const user = await User.findById(id);

    if (!user) {
        throw new NotFoundError(`Could not find user with ID: ${id}.`, "user");
    }

    return user.toObject();
}

/**
 * Gets the identity of a user by their email.
 * @param email
 */
export async function getIdentityByEmail(email: string): Promise<string> {
    const user = await User.findOne({ email }).exec();

    if (!user) {
        throw new NotFoundError("User not found.", "user");
    }

    return user._id.toString();
}

/**
 * Checks the availability of the given username and/or email.
 * @param availability
 */
export async function checkAvailability(availability: TAvailabilityQuery): Promise<TAvailabilityPair> {
    const availabilities: TAvailabilityPair = {};

    if (availability.email) {
        const exists = await User.exists({ email: availability.email });
        availabilities.email = exists === null;
    }

    if (availability.username) {
        const exists = await User.exists({ username: availability.username });
        availabilities.username = exists === null;
    }

    return availabilities;
}

/**
 * Registers a new user to the system.
 * @param data
 */
export async function registerUser(data: TRegistrationData): Promise<THydratedUserDocument> {
    const availability = await checkAvailability({ email: data.email, username: data.username });

    if (!availability.email || !availability.username) {
        throw new BadRequestError("The email or username is already in use.", "credentials_in_use");
    }

    const { password, ...rest } = data;
    const user = new User(rest);

    const document: THydratedUserDocument = await user.save();

    const response: TResponse = await fetch(
        microserviceUrl("auth", "/registration"),
        {
            method: "POST",
            headers: getFetchHeaders(),
            body: JSON.stringify({ password, id: document._id.toString() }),
        }
    ).then((res) => res.json());

    if (response.success) {
        return document;
    } else {
        await user.deleteOne();
        throw new ServerError(
            `Failed to register the user due to an error in the auth microservice: "${response.error.message}".`
        );
    }
}

/**
 * @param data
 * @param id
 */
export async function updateProfile(data: TUpdateUserData, id: string): Promise<THydratedUserDocument> {
    const user = await User.findById(id);

    if (!user) {
        throw new NotFoundError("The user to update was not found.", "user");
    }

    if (user.username !== data.username) {
        const exists = await User.exists({ username: data.username, _id: { $ne: id } });

        if (exists !== null) {
            throw new BadRequestError("The username is already in use.", "credentials_in_use");
        }

        user.username = data.username;
    }

    user.bio = data.bio || null;
    user.name = data.name;
    user.surname = data.surname;

    return await user.save();
}
