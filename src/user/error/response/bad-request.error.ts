import {BaseAppError} from "./base-app.error.ts";
import {StatusCodes} from "http-status-codes";

/** Error used for indicating an entity or item does not exist. */
export class BadRequestError extends BaseAppError
{
    constructor(message: string, errorCode: string) {
        super(message);

        this._errorCode = errorCode;
        this._httpCode = StatusCodes.BAD_REQUEST;
    }
}