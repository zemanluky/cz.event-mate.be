import {BaseAppError} from "./base-app.error.ts";
import {StatusCodes} from "http-status-codes";

/** Error used for indicating the server experienced an unknown error. */
export class ServerError extends BaseAppError
{
    constructor(message: string) {
        super(message);

        this._errorCode = `internal_server_error`;
        this._httpCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }
}