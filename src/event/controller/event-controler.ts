import express, {type Request, type Response} from "express";
import { Event } from "../schema/db/event.schema";
import { queryValidator } from "../helper/request.validator";
import { allEventsValidator, friendsEventsValidator, userEventsValidator } from "../schema/request/event.schema";
import { loginGuard } from "../helper/login-guard";
import { getFetchHeaders, microserviceUrl } from "../helper/microservice.url";
import type { AppRequest } from "../types";

export const eventController = express.Router();

eventController.get('/',
    queryValidator(allEventsValidator),
    async (req, res) => {// all events public events

        const pageSize = Number(req.query.pageSize);
        const pageNumber = Number(req.query.pageNumber);

        const event = Event.find({private: false}).limit(Number(pageSize)).skip(Number(pageSize) * Number(pageNumber)).exec();
        event.then((events) => {
            res.send(events);
        });
});

eventController.get('/friends',
    queryValidator(friendsEventsValidator), loginGuard(), async (req: AppRequest, res: Response) => { // all events created by friends of the user

        const pageSize = Number(req.query.pageSize);
        const pageNumber = Number(req.query.pageNumber);

        const userProfile = await fetch(microserviceUrl('user','profile', {userId: req.user!.id}), {
            headers: getFetchHeaders(),
        }).then((response) => {
            return response.json();
        }) 

        const event = Event.find({"ownerId" : {"$in" : userProfile.data.friends}}).limit(Number(pageSize)).skip(Number(pageSize) * Number(pageNumber)).exec();
        event.then((events) => {
            res.send(events);
        });
});

eventController.get('/user',
    queryValidator(userEventsValidator),
    loginGuard(),
    async (req, res) => {// all events of user

        const userId = req.query.userId;
        const pageSize = Number(req.query.pageSize);
        const pageNumber = Number(req.query.pageNumber);

        const event = Event.find({"ownerId": userId}).limit(Number(pageSize)).skip(Number(pageSize) * Number(pageNumber)).exec();
        event.then((events) => {
            res.send(events);
        });
});