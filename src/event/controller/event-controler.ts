import express, { type Request, type Response } from "express";
import { BadRequestError } from "../error/response/bad-request.error";
import { Event } from "../schema/db/event.schema";
import { loginGuard } from "../helper/login-guard";
import { getEvent, createEvent, updateEvent } from "../service/event-service";
import { bodyValidator, paramValidator } from "../helper/request.validator";
import type { AppRequest } from "../types";
import { eventSchema, idSchema } from "../schema/request/event.schema";

export const eventController = express.Router();

eventController.get("/", async (req, res) => {
  // all events showable to the user
  if (!req.query.userId || !req.query.pageSize || !req.query.pageNumber) {
    throw new BadRequestError(
      "Missing query parameters",
      "userId, pageSize, pageNumber"
    );
  }

  const userId = req.query.userId;
  const pageSize = req.query.pageSize;
  const pageNumber = req.query.pageNumber;

  const event = Event.find()
    .limit(Number(pageSize))
    .skip(Number(pageSize) * Number(pageNumber))
    .exec();
  //TODO filter out private non-friend events
  event.then((events) => {
    res.send(events);
  });
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
  try {
    const event = await getEvent(eventId);
    res.status(200).send(event);
  } catch (error) {
    res.status(500).json({ message: "An unexpected error occurred." });
  }
});

// Create a new event
eventController.post("/", loginGuard(), bodyValidator(eventSchema), async (req: Request, res: Response) => {
  const event = req.body;
  try {
    const newEvent = await createEvent(event);
    res.status(201).send(newEvent);
  } catch (error) {
    res.status(500).json({ message: "An unexpected error occurred." });
  }
});

// Update an existing event
eventController.put("/:id", loginGuard(), bodyValidator(eventSchema), async (req: Request, res: Response) => {
  const eventId = req.params.id;
  const updates = req.body;
  try {
    const updatedEvent = await updateEvent(eventId, updates);
    res.status(200).send(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: "An unexpected error occurred." });
  }
});
