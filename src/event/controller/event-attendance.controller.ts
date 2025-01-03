import express, {type Response} from "express";
import {paramValidator} from "../helper/request.validator.ts";
import {eventDetailParams, type TEventDetailParams} from "../schema/request/event.schema.ts";
import type {AppRequest} from "../types";
import {emptyResponse} from "../helper/response.helper.ts";
import {joinEvent, leaveEvent} from "../service/event-attendance.service.ts";

export const eventAttendanceController = express.Router({ mergeParams: true });

// adds user to the attendance list of an event
eventAttendanceController.post(
    "/", paramValidator(eventDetailParams),
    async (req: AppRequest<TEventDetailParams>, res: Response) => {
        await joinEvent(req.parsedParams!.id, req.user!.id);
        emptyResponse(res);
    }
);

// removes user from the attendance list of an event
eventAttendanceController.delete(
    "/", paramValidator(eventDetailParams),
    async (req: AppRequest<TEventDetailParams>, res: Response) => {
        await leaveEvent(req.parsedParams!.id, req.user!.id);
        emptyResponse(res);
    }
);