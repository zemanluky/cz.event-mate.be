import {Auth} from "../schema/db/auth.schema.ts";

/**
 * Checks if a given email is available (not used in the database) or not.
 * @param email The email to check.
 * @return True when available, false otherwise.
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
    const exists = await Auth.exists({ email });

    return exists === null;
}