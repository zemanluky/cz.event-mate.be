import {BaseAppError} from "./base-app.error.ts";
import {StatusCodes} from "http-status-codes";

/** Custom application error with custom HTTP status and code. */
export class AppError extends BaseAppError {
    constructor(message: string, errorCode: string = 'internal_server_error',
                httpCode: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR
    ) {
        super(message);

        this._errorCode = errorCode;
        this._httpCode = httpCode;
    }

    /**
     * Sets the error code identifying the exact type of the error.
     * @param errorCode
     */
    public set errorCode(errorCode: string)
    {
        this._errorCode = errorCode;
    }

    /**
     * Sets the HTTP status code of the error.
     * @param httpCode
     */
    public set httpCode(httpCode: StatusCodes)
    {
        this._httpCode = httpCode;
    }
}