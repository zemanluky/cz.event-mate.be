import express, {type Request, type Response} from "express";
import {microserviceUrl} from "../helper/microservice.url.ts";

export const googleAuthController = express.Router();

googleAuthController.get('/goog', async (req: Request, res: Response) => {
    const response = await fetch(microserviceUrl('user', 'hello'));
    const greeting = await response.text();

    res.send(`Greeting from user microservice: ${greeting}`);
});