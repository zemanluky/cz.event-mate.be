import {ServerError} from "../error/response/server.error.ts";

type TMicroserviceName = 'user'|'auth'|'event';

/**
 * Gets a given microservice's base url from the environment.
 * Throws error, if not set.
 * @param microserviceName Name of the microservice.
 * @param path Path without slash at the beginning.
 */
export const microserviceUrl = (microserviceName: TMicroserviceName, path: string): string => {
    const envParamName = `MS_${microserviceName.toUpperCase()}_URL`;
    const url = process.env[envParamName];

    if (!url)
        throw new ServerError(
            `Missing URL environment variable for a microservice. Cannot retrieve '${microserviceName}' from the environment.`
        );

    return url + path;
}