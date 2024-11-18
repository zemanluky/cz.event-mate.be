import express, {type Request, type Response} from "express";
import {fooSchema, type TFoo} from "../schema/request/foo.schema.ts";
import {bodyValidator} from "../helper/request.validator.ts";
import {findById, saveFromApi} from "../service/foo.service.ts";
import {microserviceUrl} from "../helper/microservice.url.ts";

export const googleAuthController = express.Router();

googleAuthController.get('/goog', async (req: Request, res: Response) => {
    const response = await fetch(microserviceUrl('user', 'hello'));
    const greeting = await response.text();

    res.send(`Greeting from user microservice: ${greeting}`);
});