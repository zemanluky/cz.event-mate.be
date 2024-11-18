import * as fs from "node:fs";
import jwt, {JsonWebTokenError, type JwtPayload, NotBeforeError, TokenExpiredError} from "jsonwebtoken";
import {InvalidJwt} from "../error/invalid-jwt-token.error.ts";
import type {EUserRole} from "../schema/db/auth.schema.ts";

const issuer = process.env.JWT_ISSUER || 'event-mate:auth';

/**
 * Gets the JWT private key file for signing JWT tokens.
 */
const getPrivateKey = (): Buffer => {
    const privateKeyPath = process.env.JWT_PRIVATE_KEY || '/app/credentials/jwt/private-key.pem';

    if (!fs.existsSync(privateKeyPath))
        throw new Error(
            'Private key must exist in order to sign new JWT tokens. ' +
            `Please, check that the key at location ${privateKeyPath} exists and has correct privileges set, or change 
            the JWT_PRIVATE_KEY env variable to change the location.`
        );

    return fs.readFileSync(privateKeyPath);
}

/**
 * Gets the JWT public key file for verifying JWT tokens.
 */
const getPublicKey = (): Buffer => {
    const publicKey = process.env.JWT_PUBLIC_KEY || '/app/credentials/jwt/public-key.pem';

    if (!fs.existsSync(publicKey))
        throw new Error(
            'Public key must exist in order to verify incoming JWT tokens. ' +
            `Please, check that the key at location ${publicKey} exists and has correct privileges set, or change 
            the JWT_PUBLIC_KEY env variable to change the location.`
        );

    return fs.readFileSync(publicKey);
}

/**
 * Signs a given JWT token.
 */
export const signJwt = (userId: string, role: string, expireIn: string, jti?: string): string => {
    const keyFile = getPrivateKey();

    return jwt.sign({ uid: userId, role: role }, keyFile, {
        algorithm: "RS256",
        issuer: issuer,
        expiresIn: expireIn,
        ...(jti !== undefined ? {jwtid: jti} : {})
    });
}

/**
 * Verifies a given JWT token.
 * @param jwtString
 * @throws InvalidJwt The given token is invalid - trying to authenticate with invalid token.
 */
export const verifyJwt = (jwtString: string): { userId: string, role: EUserRole, jti?: string} => {
    const keyFile = getPublicKey();

    try {
        const payload = jwt.verify(jwtString, keyFile, {
            algorithms: ['RS256'],
            clockTolerance: 5, // tolerates up to 5 seconds of invalidity via nbf or exp claims
            issuer: [issuer]
        }) as JwtPayload;

        if (payload.uid === undefined || payload.role === undefined)
            throw new InvalidJwt('The provided JWT token is invalid.');

        return { userId: payload.uid, role: payload.role, jti: payload.jti };
    }
    catch (error: any) {
        // we know what the error is, the user is trying to authenticate with invalid jwt
        if (error instanceof TokenExpiredError
            || error instanceof JsonWebTokenError
            || error instanceof NotBeforeError
        ) {
            throw new InvalidJwt('The provided JWT token is either invalid or expired/not active.');
        }

        // unknown error, rethrow
        throw error;
    }
}