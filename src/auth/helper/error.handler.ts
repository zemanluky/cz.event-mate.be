import type {NextFunction, Request, Response} from "express";
import {BaseAppError} from "../error/request/base-app.error.ts";
import {errorResponse, validationResponse} from "./response.helper.ts";
import {StatusCodes} from "http-status-codes";
import {ValidationError} from "../error/request/validation.error.ts";

/**
 * Global error handler that may be used as one of the last middlewares after all controllers registrations.
 * This mostly handles transformation of multiple types of errors to a JSON response.
 * @param err The error thrown.
 * @param req The request.
 * @param res The response.
 * @param next Express next handler call.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    switch (err.constructor) {
        case ValidationError:
            // we do not have information about invalid data, so it probably could not even get parsed
            if (err.zodIssues === null) {
                errorResponse(res, 'Unable to parse provided data.', StatusCodes.UNPROCESSABLE_ENTITY, 'failed_parse');
                return;
            }

            // validation issues
            validationResponse(res, err.zodIssues);
            break;
        case BaseAppError: // application error containing http status code and error code
            errorResponse(res, err.message, err.httpCode, err.errorCode, err.stack);
            break;
        case Error: // unknown error, with available stack
            errorResponse(res, err.message, StatusCodes.INTERNAL_SERVER_ERROR, 'internal_server_error', err.stack);
            break;
        case String: // unknown error, without available stack
            errorResponse(res, err, StatusCodes.INTERNAL_SERVER_ERROR, 'internal_server_error');
            break;
        default: // unsupported error type, just say something went wrong
            errorResponse(
                res, "Server is so sick that it does not even know what happened. 🤒",
                StatusCodes.INTERNAL_SERVER_ERROR, 'internal_server_error'
            );
            break;
    }
};