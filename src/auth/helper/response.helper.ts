import type {Response} from "express";
import {StatusCodes} from "http-status-codes";
import type {ZodIssue} from "zod";

type BaseResponse = {
    status: StatusCodes,
    success: boolean
};

type SuccessResponse<TData> = BaseResponse & {
    success: true
    data: TData
};

type ErrorResponse = BaseResponse & {
    success: false,
    error: {
        message: string,
        code: string,
        trace: string|null
    }
};

type ValidationResponse = ErrorResponse & {
    validation: ZodIssue[]
}

export type TResponse<TData = any> = SuccessResponse<TData>|ErrorResponse|ValidationResponse;

/**
 * Sends a success response with data.
 * @param res The response object.
 * @param data The data to send in the response.
 * @param statusCode The HTTP status code to send. Generally, you would want to use status codes from the 200 range.
 */
export const successResponse = <TData extends any>(res: Response, data: TData, statusCode: StatusCodes = StatusCodes.OK): void => {
    const response: SuccessResponse<TData> = {
        status: statusCode,
        success: true,
        data: data
    };

    // send the response as json
    res.status(statusCode).json(response);
}

/**
 * Sends an empty success response. This means, the 204 'No Content' status code will be used.
 * @param res The response object.
 */
export const emptyResponse = (res: Response): void => {
    // send no content response
    res.sendStatus(StatusCodes.NO_CONTENT);
}

/**
 * Sends an error response.
 * @param res The response object.
 * @param message The error message.
 * @param statusCode The HTTP status code to use. By default, the HTTP status code 500 Internal Server Error is used.
 * @param code The code specifying the error to the frontend.
 * @param trace Stack trace of where the error occurred.
 */
export const errorResponse = (
    res: Response, message: string, statusCode: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR,
    code: string, trace: string|null = null
): void => {
    const response: ErrorResponse = {
        status: statusCode,
        success: false,
        error: {message, code, trace}
    };

    // send the response as json
    res.status(statusCode).json(response);
}

/**
 * Sends a validation response.
 * Automatically sets the HTTP status code to 422 Unprocessable entity.
 * @param res The response object.
 * @param validationErrors The validation errors from class-validator.
 */
export const validationResponse = (res: Response, validationErrors: ZodIssue[]): void => {
    const response: ValidationResponse = {
        status: StatusCodes.UNPROCESSABLE_ENTITY,
        success: false,
        error: {
            message: 'The data did not pass validations.',
            code: 'validation_error',
            trace: null
        },
        validation: validationErrors
    }

    // send the response as json
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(response);
}