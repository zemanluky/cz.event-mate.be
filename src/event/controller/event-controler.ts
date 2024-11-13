import express, {type Request, type Response} from "express";
import { BadRequestError } from "../error/response/bad-request.error";
import { Event } from "../schema/db/event.schema";

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