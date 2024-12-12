import express, { type Request, type Response } from "express";
import { BadRequestError } from "../error/response/bad-request.error";
import { Event, type IEvent } from "../schema/db/event.schema";
import { loginGuard } from "../helper/login-guard";
import { getEvent, createEvent, updateEvent } from "../service/event-service";
import { bodyValidator, paramValidator } from "../helper/request.validator";
import type { AppRequest } from "../types";
import { eventSchema, idSchema } from "../schema/request/event.schema";
import mongoose from "mongoose";
import { queryValidator } from "../helper/request.validator";
import { filterEventsValidator, userEventsValidator, type TFilterEventsValidator, type TUserEventsValidator } from "../schema/request/event.schema";
import { getFilteredEvents, getUsersEvents, } from "../service/event.service.ts"
import { successResponse } from "../helper/response.helper.ts";


export const eventController = express.Router();

eventController.get('/',
    queryValidator(filterEventsValidator),
    loginGuard(),
    async (req: AppRequest<never, never, TFilterEventsValidator>, res: Response) => {

        const events = await getFilteredEvents(req.parsedQuery!, req.user!.id);

        successResponse(res, events);
    });

eventController.get('/user',
    queryValidator(userEventsValidator),
    loginGuard(),
    async (req: AppRequest<never, never, TUserEventsValidator>, res: Response) => {

        const events = await getUsersEvents(req.parsedQuery!);
        successResponse(res, events);
    });

eventController.get("/friends", (req: Request, res: Response) => {
  // all events created by friends of the user
  res.send(
    "This endpoint will return all events which are created by friends of the user."
  );
});

// Get a specific event by ID
eventController.get("/:id", loginGuard(), async (req: Request, res: Response) => {
	const eventId = req.params.id;

    const event = await getEvent(eventId);
    res.status(200).send(event);
});

// Create a new event
eventController.post("/", loginGuard(), bodyValidator(eventSchema), async (req: AppRequest, res: Response) => {
	const event = req.body as IEvent;
	const userId = req.user!.id;
	event.ownerId = new mongoose.Types.ObjectId(userId);

    const newEvent = await createEvent(event);
    res.status(201).send(newEvent);
});

// Update an existing event
eventController.put("/:id", loginGuard(), bodyValidator(eventSchema), async (req: Request, res: Response) => {
	const eventId = req.params.id;
	const updates = req.body;

	const updatedEvent = await updateEvent(eventId, updates);
	res.status(200).send(updatedEvent);
});

// Not oficially part of the API, just for testing purposes
eventController.get("/list-all", async (req: Request, res: Response) => {
	const events = await Event.find();

	res.status(200).send(events);
});