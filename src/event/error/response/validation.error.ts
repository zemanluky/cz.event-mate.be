import {BaseAppError} from "./base-app.error.ts";
import {StatusCodes} from "http-status-codes";
import type {ZodIssue} from "zod";

/** Error used for indicating the response body, params, or query is invalid. */
export class ValidationError extends BaseAppError
{
    private readonly _zodIssues: ZodIssue[]|null;

    constructor(zodIssues: ZodIssue[]|null = null, invalidPart: 'body'|'query'|'params' = 'body') {
        super('Invalid data provided.');

        this._zodIssues = zodIssues;
        this._errorCode = `invalid_${invalidPart}`;
        this._httpCode = StatusCodes.UNPROCESSABLE_ENTITY;
    }

    /**
     * Gets information about invalid properties in the given object.
     */
    public get zodIssues()
    {
        return this._zodIssues;
    }
}