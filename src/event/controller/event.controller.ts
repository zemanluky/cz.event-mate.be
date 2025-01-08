import express, {type Request, type Response} from "express";
import {Event} from "../schema/db/event.schema";
import {loginGuard} from "../helper/login-guard";
import {bodyValidator, queryValidator} from "../helper/request.validator";
import type {AppRequest} from "../types";
import {
    checkAttendanceQuery,
    eventSchema,
    filterEventsValidator,
    monthOverviewQuery,
    type TAttendanceQuery,
    type TEventBody,
    type TFilterEventsValidator,
    type TMonthOverviewQuery
} from "../schema/request/event.schema";
import {
    createEvent,
    getEvent,
    getFilteredEvents,
    getUsersMonthOverview,
    updateEvent,
} from "../service/event.service.ts"
import {successResponse} from "../helper/response.helper.ts";
import {microserviceGuard} from "../helper/microservice.url.ts";
import {hasUserAttendedAnyAuthorEvent} from "../service/event-attendance.service.ts";
import multer from "multer";
import {StatusCodes} from "http-status-codes";

export const eventController = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Specify the destination directory
    },
    filename: function (any, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Generate a unique suffix
      const newFilename = 'event-image-' + uniqueSuffix + file.originalname; // Specify the filename
      cb(null, newFilename); // Set the new filename
    }
  });

const upload = multer({ storage: storage });

/** Checks whether a given user has attended any event. */
eventController.get(
    '/check-attendance', microserviceGuard(), queryValidator(checkAttendanceQuery),
    async (req: AppRequest<never,TAttendanceQuery>, res: Response) => {
        const hasAttended = await hasUserAttendedAnyAuthorEvent(req.parsedQuery!.authorId, req.parsedQuery!.userId);
        successResponse(res, { hasAttended });
    }
);

eventController.get(
    '/month-overview', loginGuard(), queryValidator(monthOverviewQuery),
    async (req: AppRequest<never,TMonthOverviewQuery>, res: Response) => {
        const monthOverview = await getUsersMonthOverview(req.user!.id, req.parsedQuery!.date);
        successResponse(res, monthOverview);
    }
);

eventController.get('/',
    loginGuard(false), queryValidator(filterEventsValidator),
    async (req: AppRequest<never,never,TFilterEventsValidator>, res: Response) => {
        const events = await getFilteredEvents(req.parsedQuery!, req.user?.id);
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
    "/", loginGuard(), upload.array('image', 10), bodyValidator(eventSchema),
    async (req: AppRequest<never,never,TEventBody>, res: Response) => {
        const newEvent = await createEvent(
            req.body, req.user!.id,
            (req.files as Array<Express.Multer.File>).map((file) => '/event/files/' + file.filename)
        );
        successResponse(res, newEvent, StatusCodes.CREATED);
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

// Delete an event
eventController.delete(
	"/:id", loginGuard(),
	async (req: Request, res: Response) => {
		await Event.deleteOne({ _id: req.params.id });
		successResponse(res, { message: "Event deleted successfully" });
	}
);
