import {BaseAppError} from "./base-app.error.ts";
import {StatusCodes} from "http-status-codes";

/** Error used for indicating the user is unauthenticated. */
export class UnauthenticatedError extends BaseAppError
{
    constructor(message: string) {
        super(message);

        this._errorCode = `unauthenticated`;
        this._httpCode = StatusCodes.UNAUTHORIZED;
    }
}