import express, { type Request, type Response } from "express";
import { BadRequestError } from "../error/response/bad-request.error";
import { Event, type IEvent } from "../schema/db/event.schema";
import { loginGuard } from "../helper/login-guard";
import { bodyValidator } from "../helper/request.validator";
import type { AppRequest } from "../types";
import {
    checkAttendanceQuery,
    eventSchema,
    type TAttendanceQuery,
    type TEventBody
} from "../schema/request/event.schema";
import { queryValidator } from "../helper/request.validator";
import { filterEventsValidator, type TFilterEventsValidator } from "../schema/request/event.schema";
import {createEvent, getEvent, getFilteredEvents, updateEvent,} from "../service/event.service.ts"
import { successResponse } from "../helper/response.helper.ts";
import {microserviceGuard} from "../helper/microservice.url.ts";
import {hasUserAttendedAnyAuthorEvent} from "../service/event-attendance.service.ts";

export const eventController = express.Router();

/** Checks whether a given user has attended any event. */
eventController.get(
    '/check-attendance', microserviceGuard(), queryValidator(checkAttendanceQuery),
    async (req: AppRequest<never,TAttendanceQuery>, res: Response) => {
        const hasAttended = await hasUserAttendedAnyAuthorEvent(req.parsedQuery!.authorId, req.parsedQuery!.userId);
        successResponse(res, { hasAttended });
    }
)

eventController.get('/',
    loginGuard(), queryValidator(filterEventsValidator),
    async (req: AppRequest<never,never,TFilterEventsValidator>, res: Response) => {
        const events = await getFilteredEvents(req.parsedQuery!, req.user!.id);
        successResponse(res, events);
    });

// Get a specific event by ID
eventController.get("/:id",
    loginGuard(),
    async (req: Request, res: Response) => {
        const event = await getEvent(req.params.id);
        successResponse(res, event);
    }
);

// Create a new event
eventController.post(
    "/", loginGuard(), bodyValidator(eventSchema),
    async (req: AppRequest<never,never,TEventBody>, res: Response) => {
        const newEvent = await createEvent(req.body, req.user!.id);
        successResponse(res, newEvent);
    }
);

// Update an existing event
eventController.put(
    "/:id", loginGuard(), bodyValidator(eventSchema),
    async (req: AppRequest<never,never,TEventBody>, res: Response) => {
        const updatedEvent = await updateEvent(req.params.id, req.body, req.user!.id);
        successResponse(res, updatedEvent);
    }
);