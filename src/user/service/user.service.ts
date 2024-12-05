import {type IUser, User} from "../schema/db/user.schema.ts";
import {NotFoundError} from "../error/response/not-found.error.ts";

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
 * Gets all users
 */
export async function getAllUsers(): Promise<IUser[]> {
    return await User.find();
}