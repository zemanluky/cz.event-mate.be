import express, { type Response } from "express";
import { queryValidator } from "../helper/request.validator";
import { filterEventsValidator, userEventsValidator, type TFilterEventsValidator, type TUserEventsValidator } from "../schema/request/event.schema";
import { loginGuard } from "../helper/login-guard";
import type { AppRequest } from "../types";
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