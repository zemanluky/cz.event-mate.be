import {BaseAppError} from "./base-app.error.ts";
import {StatusCodes} from "http-status-codes";

/** Error used for indicating an entity or item does not exist. */
export class PermissionError extends BaseAppError
{
    constructor(message: string, permissionAction: string) {
        super(message);

        this._errorCode = `forbidden_action.${permissionAction}`;
        this._httpCode = StatusCodes.FORBIDDEN;
    }
}