import {StatusCodes} from "http-status-codes";

export abstract class BaseAppError extends Error
{
    /** The HTTP code of the error. */
    protected _httpCode: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR;

    /** The identifier of the error. */
    protected _errorCode: string = 'internal_server_error';

    protected constructor(message?: string) {
        super(message);
    }

    /**
     * Gets the error code.
     */
    public get errorCode(): string
    {
        return this._errorCode;
    }

    /**
     * Gets the http status code.
     */
    public get httpCode(): StatusCodes
    {
        return this._httpCode;
    }
}