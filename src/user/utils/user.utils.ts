import type {IUser, THydratedUserDocument} from "../schema/db/user.schema.ts";
import * as R from "remeda";

export type TAuthor = Omit<IUser, 'bio'|'email'|'friends'|'profile_picture_path'> & { average_rating: number };

/**
 * Exports basic data of a given user with average rating.
 * @param user
 */
export function exportAuthorProfile(user: IUser & { average_rating: number }): TAuthor {
    return R.omit(user, ['bio', 'email', 'friends', 'profile_picture_path']);
}