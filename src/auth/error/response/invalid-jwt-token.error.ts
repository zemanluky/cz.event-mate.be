import {BaseAppError} from "./base-app.error.ts";
import {StatusCodes} from "http-status-codes";

/** Error used for indicating the provided access JWT toke is invalid. */
export class InvalidJwtTokenError extends BaseAppError
{
    constructor(message: string, tokenErrorCode: string) {
        super(message);

        this._errorCode = `unauthorized.${tokenErrorCode}`;
        this._httpCode = StatusCodes.UNAUTHORIZED;
    }
}