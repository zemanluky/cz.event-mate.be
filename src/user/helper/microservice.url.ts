import {ServerError} from "../error/response/server.error.ts";
import type {Request, Response, NextFunction} from "express";
import {UnauthenticatedError} from "../error/response/unauthenticated.error.ts";
import type {AppRequest} from "../types";

type TMicroserviceName = 'user'|'auth'|'event';

/**
 * Gets the JWT private key file for signing JWT tokens.
 */
function getMicroserviceSecret(): string {
    const microserviceSecret = process.env.MICROSERVICE_SECRET;

    if (!microserviceSecret)
        throw new Error(
            'The microservice secret must be set before trying to communicate between microservices. ' +
            `Please, check that the the MICROSERVICE_SECRET env variable is set correctly.`
        );

    return microserviceSecret;
}

/**
 * Gets a given microservice's base url from the environment.
 * Throws error, if not set.
 * @param microserviceName Name of the microservice.
 * @param path Path without slash at the beginning.
 * @param params URL parameters.
 */
export const microserviceUrl = (
    microserviceName: TMicroserviceName, path: string, params?: ConstructorParameters<typeof URLSearchParams>[0]
): string => {
    const envParamName = `MS_${microserviceName.toUpperCase()}_URL`;
    const url = process.env[envParamName];

    if (!url)
        throw new ServerError(
            `Missing URL environment variable for a microservice. Cannot retrieve '${microserviceName}' from the environment.`
        );

    const urlWithPath = url + path;

    if (!params) return urlWithPath;

    const urlSearchParams = new URLSearchParams(params);
    return urlWithPath + '?' + urlSearchParams.toString();
}

/**
 * Gets headers with prepared authorization token for other microservices.
 * @param headers Additional headers you may want to send along.
 */
export function getFetchHeaders(headers: RequestInit['headers'] = {}): RequestInit['headers'] {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers,
        Authorization: `Apikey ${getMicroserviceSecret()}`
    };
}

/**
 * Extracts secret value from auth header.
 * @param headerValue
 * @return null when the token could not be extracted, the string secret otherwise.
 */
function extractSecret(headerValue: string): string|null {
    const parts = headerValue.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Apikey')
        return null;

    return parts[1];
}

/**
 * Middleware for checking if the request is coming from another microservice.
 * @param required
 */
export function microserviceGuard(required: boolean = true) {
    return (req: AppRequest, res: Response, next: NextFunction) => {
        const header = req.headers.authorization;

        // the authorization header is not present even though we require the user to be authenticated
        if (header === undefined)
            return required
                ? next(new UnauthenticatedError('Could not find the authorization header.'))
                : next()
            ;

        const secret = extractSecret(header);

        // we could not extract the token successfully, but it may also mean that the type of authorization is different
        if (!secret)
            return required
                ? next(new UnauthenticatedError('Could not find the authorization header.'))
                : next()
            ;

        // the secret is invalid
        if (secret !== getMicroserviceSecret())
            return next(new UnauthenticatedError('Invalid authorization header.'));

        req.isMicroserviceRequest = true;
        next();
    }
}