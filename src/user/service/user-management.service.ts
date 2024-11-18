import type {TAvailabilityQuery, TRegistrationData, TUpdateUserData} from "../schema/request/user.schema.ts";
import {type THydratedUserDocument, User} from "../schema/db/user.schema.ts";
import {getFetchHeaders, microserviceUrl} from "../helper/microservice.url.ts";
import type {TResponse} from "../helper/response.helper.ts";
import {ServerError} from "../error/response/server.error.ts";
import {BadRequestError} from "../error/response/bad-request.error.ts";
import {NotFoundError} from "../error/response/not-found.error.ts";

type TAvailabilityPair = {
    email?: boolean;
    username?: boolean;
}

/**
 * Gets the identity of a user by their email.
 * @param email
 */
export async function getIdentityByEmail(email: string): Promise<string> {
    const user = await User.findOne({email}).exec();

    // user with given identity does not exist
    if (!user) throw new NotFoundError('User not found.', 'user');

    return user._id.toString();
}

/**
 * Checks the availability of the given username and/or email.
 * @param availability
 */
export async function checkAvailability(availability: TAvailabilityQuery): Promise<TAvailabilityPair> {
    const availabilities: TAvailabilityPair = {};

    // check for availability of the email by checking if document exists
    if (availability.email) {
        const exists = await User.exists({email: availability.email});
        availabilities.email = exists === null;
    }

    // check for availability of the username by checking if a document exists
    if (availability.username) {
        const exists = await User.exists({username: availability.username});
        availabilities.username = exists === null;
    }

    return availabilities;
}

/**
 * Registers a new user to the system.
 * It also sends data to the auth microservice to create the new auth profile.
 * @param data
 */
export async function registerUser(data: TRegistrationData): Promise<THydratedUserDocument> {
    // let's verify first if the credentials are unused
    const availability = await checkAvailability({email: data.email, username: data.username});

    if (!availability.email || !availability.username)
        throw new BadRequestError('The email or username is already in use.', 'credentials_in_use');

    const {password, ...rest} = data;
    const user = new User(rest);

    // it is important to put the session as the option
    const document: THydratedUserDocument = await user.save();

    // save the authentication profile to auth microservice
    const response: TResponse = await fetch(
        microserviceUrl('auth', '/registration'),
        {
            method: 'POST',
            headers: getFetchHeaders(),
            body: JSON.stringify({password, id: document._id.toString()})
        }
    ).then(res => res.json());

    if (response.success) {
        return document;
    }
    else {
        // the auth microservice failed to register the user, so we need to delete the user from the database,
        // so they may try to register again
        // NOTE: I would love to use transactions here, but single node MongoDB does not support them
        await user.deleteOne();

        throw new ServerError(
            `Failed to register the user due to an error in the auth microservice: "${response.error.message}".`
        );
    }
}

/**
 * Updates data of a given user.
 * @param data Data to use for the update.
 * @param id ID of the user.
 */
export async function updateProfile(data: TUpdateUserData, id: string): Promise<THydratedUserDocument> {
    const user = await User.findById(id);

    if (!user)
        throw new NotFoundError('The user to update was not found.', 'user');

    // we are updating the username, and we have to check it has changed
    if (user.username !== data.username) {
        const exists = await User.exists({username: data.username, _id: {$ne: id}});

        if (exists !== null)
            throw new BadRequestError('The username is already in use.', 'credentials_in_use');

        user.username = data.username;
    }

    // update the user's data
    user.bio = data.bio || null;
    user.name = data.name;
    user.surname = data.surname;

    // save the new data
    return await user.save();
}