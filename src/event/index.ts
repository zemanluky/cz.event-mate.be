import express from 'express';
import {errorHandler} from "./helper/error.handler.ts";
import {connectToMongo} from "./helper/mongo.connector.ts";
import { eventController } from './controller/event.controller.ts';
import {NotFoundError} from "./error/response/not-found.error.ts";
import cors from "cors";
import {categoryController} from "./controller/category.controller.ts";
import {loginGuard} from "./helper/login-guard.ts";
import {seedCategories} from "./helper/category.seeder.ts";

const port = process.env.APP_PORT;
const appName = process.env.APP_NAME || 'unknown';

if (!port)
    throw new Error('Port for the microservice is not set. Please, set the APP_PORT environment variable.');

// initialize connection to MongoDB
await connectToMongo();
await seedCategories();

// initialize app server
const app = express();

// parse json body
app.use(cors({origin: true, credentials: true}));
app.use(express.json());

// add controllers here...
app.use('/category', loginGuard(), categoryController);
app.use('/', eventController);

// global handler for 404
app.use((req, res, next) => {
    next(new NotFoundError('Resource not found.', ''));
});

// global handler for app specified exceptions
app.use(errorHandler);

app.listen(port, () => console.log(`🥳 Microservice ${appName} is now running on port ${port}!`));