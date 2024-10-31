import express, {type Request, type Response} from "express";

export const helloWorldController = express.Router();

helloWorldController.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});