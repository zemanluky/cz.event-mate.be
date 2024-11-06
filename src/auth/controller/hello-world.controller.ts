import express, {type Request, type Response} from "express";
import {fooSchema, type TFoo} from "../schema/request/foo.schema.ts";
import {bodyValidator} from "../helper/request.validator.ts";
import {findById, saveFromApi} from "../service/foo.service.ts";

export const helloWorldController = express.Router();

helloWorldController.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

helloWorldController.post('/foo',
    bodyValidator(fooSchema), // this way the body gets validated before being passed to the controller handler
    async (req: Request<{}, {}, TFoo>, res: Response) => {
        const objectId = await saveFromApi(req.body); // type hinting when using generics in the handler params
        const item = await findById(objectId);

        res.send(item);
    }
);