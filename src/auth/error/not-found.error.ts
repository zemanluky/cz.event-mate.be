import {BaseAppError} from "./base-app.error.ts";
import {StatusCodes} from "http-status-codes";

/** Error used for indicating an entity or item does not exist. */
export class NotFoundError extends BaseAppError
{
    constructor(message: string, entityNotFound: string) {
        super(message);

        this._errorCode = `not_found.${entityNotFound}`;
        this._httpCode = StatusCodes.NOT_FOUND;
    }
}