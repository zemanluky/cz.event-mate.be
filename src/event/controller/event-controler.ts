import express, {type Request, type Response} from "express";
import { BadRequestError } from "../error/response/bad-request.error";
import { Event } from "../schema/db/event.schema";
import { NotFoundError } from "../error/response/not-found.error";
import { ServerError } from "../error/response/server.error";

export const eventController = express.Router();

eventController.get('/',
    async (req, res) => {// all events showable to the user
        if(!req.query.userId || !req.query.pageSize || !req.query.pageNumber){
            throw new BadRequestError('Missing query parameters', 'userId, pageSize, pageNumber');
        }

        const userId = req.query.userId;
        const pageSize = req.query.pageSize;
        const pageNumber = req.query.pageNumber;

        const event = Event.find().limit(Number(pageSize)).skip(Number(pageSize) * Number(pageNumber)).exec();
        //TODO filter out private non-friend events
        event.then((events) => {
            res.send(events);
        });
});

eventController.get('/friends', (req: Request, res: Response) => { // all events created by friends of the user
    res.send('This endpoint will return all events which are created by friends of the user.'); 
});

// Get a specific event by ID
eventController.get('/:id', async (req: Request, res: Response) => {
    const eventId = req.params.id;

    if (!eventId) {
        throw new BadRequestError('Missing path parameter', 'id');
    }
    try {
        const event = await Event.findById(eventId).exec();

        if (!event) {
            throw new NotFoundError(`Event with id ${eventId} doesnt exist`, "event._id");
        }

        res.send(event);
    } catch (error) {
		throw new ServerError("Server error, GET /event/:id");
    }
});

// Create a new event
eventController.post('/', async (req: Request, res: Response) => {
    const { name, description, date, location, private: isPrivate, ownerId } = req.body;

    if (!name || !date || !location || !ownerId) {
        throw new BadRequestError(
            'Missing required fields',
            'name, date, location, ownerId, isPrivate'
        );
    }
    try {
        const newEvent = new Event({
            name,
            description: description || '',
            date: new Date(date),
            location,
            private: isPrivate !== undefined ? isPrivate : false,
            ownerId,
        });
        const savedEvent = await newEvent.save();

        res.status(201).send(savedEvent);
    } catch (error) {
		throw new ServerError("Server error, POST /event/");
    }
});

// Update an existing event
eventController.put('/:id', async (req: Request, res: Response) => {
    const eventId = req.params.id;

    if (!eventId) {
        throw new BadRequestError('Missing path parameter', 'id');
    }
    const updates = req.body;

    try {
        const updatedEvent = await Event.findByIdAndUpdate(eventId, updates, { new: true, runValidators: true }).exec();

        if (!updatedEvent) {
			throw new NotFoundError(`Event with id ${eventId} doesnt exist`, "event._id");
        }

        res.status(201).send(updatedEvent);
    } catch (error) {
		throw new ServerError("Server error, PUT /event/:id");
    }
});