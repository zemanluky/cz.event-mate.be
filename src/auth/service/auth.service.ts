import type {TLoginData} from "../schema/request/auth.schema.ts";
import {type THydratedAuthDocument, Auth} from "../schema/db/auth.schema.ts";
import {signJwt, verifyJwt} from "../helper/jwt.service.ts";
import {UnauthenticatedError} from "../error/response/unauthenticated.error.ts";
import ms from "ms";
import {addMilliseconds, isAfter} from "date-fns";
import * as R from 'remeda';
import {InvalidJwt} from "../error/invalid-jwt-token.error.ts";

// token lifetime configuration
const accessTokenLifetime = process.env.JWT_ACCESS_LIFETIME || '15m';
const refreshTokenLifetime = process.env.JWT_REFRESH_LIFETIME || '28d';

// max active token config
const maxActiveTokens = process.env.JWT_MAX_ACTIVE_TOKEN !== undefined ? Number(process.env.JWT_MAX_ACTIVE_TOKEN) : 5;

type TTokenPair = { access: string, refresh: string };

/**
 * Creates new access token for the given user.
 * @param auth
 */
function createAccessToken(auth: THydratedAuthDocument): string {
    return signJwt(auth._id.toString(), accessTokenLifetime, auth.role);
}

/**
 * Creates new refresh token. It generates JT
 * @param auth
 * @param jti
 */
async function createRefreshToken(auth: THydratedAuthDocument, jti?: string): Promise<string> {
    const newJti = crypto.randomUUID();
    const token = signJwt(auth._id.toString(), auth.role, refreshTokenLifetime, newJti);

    // we are creating new token, and we need to invalidate the oldest sessions
    if (!jti) {
        auth.refresh_tokens.push({
            jti: newJti,
            revoked_at: null,
            issued_at: new Date(),
            valid_until: addMilliseconds(new Date(), ms(refreshTokenLifetime))
        });

        // get ids of tokens older than `n` of active tokens
        const oldestRefreshTokensIds = R.pipe(
            auth.refresh_tokens,
            R.filter((rt => rt.revoked_at === null)),
            R.dropFirstBy(maxActiveTokens, [R.prop('issued_at'), 'desc']),
            R.map(rt => rt._id)
        );

        // mark the oldest token as invalidated
        await Auth.updateOne({ _id: auth._id, 'refresh_tokens._id': { $in: oldestRefreshTokensIds } }, {
            $set: {
                'refresh_tokens.$[].revoked_at': new Date()
            }
        });

        // save changes
        await auth.save();
    }
    // we are updating existing active token entry
    else {
        await Auth.updateOne({ _id: auth._id, 'refresh_tokens.jti': jti }, {
            $set: {
                "refresh_tokens.$.jti": newJti,
                "refresh_tokens.$.issued_at": new Date(),
                "refresh_tokens.$.valid_until": addMilliseconds(new Date(), ms(refreshTokenLifetime)),
                "refresh_tokens.$.revoked_at": null
            }
        }).exec();
    }

    return token;
}

/**
 * Logs in a given user based on their email and password.
 * It may also accept user's username instead of their email.
 * It generates a JWT access and refresh token.
 */
export async function login(request: TLoginData): Promise<TTokenPair> {
    const auth = await Auth
        .findOne()
        .or([{ email: request.login }, { username: request.login }])
        .exec()
    ;

    // check if the user even exists...
    if (!auth)
        throw new UnauthenticatedError('Please check your login credentials.');

    // verify passwords
    const isPasswordMatch = await Bun.password.verify(request.password, auth.password);

    if (!isPasswordMatch)
        throw new UnauthenticatedError('Please check your login credentials.');

    return { access: createAccessToken(auth), refresh: await createRefreshToken(auth) };
};

/**
 * Generates a new access token for a given user based on their refresh token
 * This token is first verified for its validity, compared to the collection of active tokens on the user's own data in
 * the database, and upon verifying successfully, a new token pair is returned.
 * @param refreshToken The refresh token.
 */
export async function refresh(refreshToken: string): Promise<TTokenPair> {
    const result = verifyJwt(refreshToken);

    // the refresh token does not have its ID set, someone is probably trying to use the access token instead...
    if (!result.jti)
        throw new UnauthenticatedError('The refresh token is not valid. Please, login again.');

    // let's verify the user actually exists
    const auth = await Auth.findById(result.userId).exec();

    if (!auth)
        throw new UnauthenticatedError('The user authenticated via the token was not found in the system.');

    // verify that the token with the given jti exists and that it is still valid (not revoked)
    const token = auth.refresh_tokens.find(rt => rt.jti === result.jti);

    if (!token || token.revoked_at !== null || isAfter(new Date(), token.valid_until))
        throw new UnauthenticatedError('The authentication session has expired. Please, log in again.');

    return { access: createAccessToken(auth), refresh: await createRefreshToken(auth, result.jti) };
}

/**
 * Invalidates the refresh token, when valid.
 * When invalid, it just ignores it.
 */
export async function logout(refreshToken: string): Promise<void> {
    // catch errors as we don't care if the token ends up invalid
    try {
        const {jti, userId} = verifyJwt(refreshToken);

        if (!jti) return;

        // set the revoked parameter of the token
        await Auth.updateOne({ _id: userId, 'refresh_tokens.jti': jti }, {
            $set: { 'refresh_tokens.$.revoked_at': new Date() }
        }).exec();
    }
    catch (error: any) {
        if (error instanceof InvalidJwt) return;

        // when we don't know the error, we definitely want to throw that so that it gets logged
        throw error;
    }
}