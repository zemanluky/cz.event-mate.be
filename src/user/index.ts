import express from 'express';
import {errorHandler} from "./helper/error.handler.ts";
import {connectToMongo} from "./helper/mongo.connector.ts";
import {userManagementController} from "./controller/user-management.controller.ts";
import {NotFoundError} from "./error/response/not-found.error.ts";
import cors from "cors";
import { friendRequestController } from './controller/friend-request.controller.ts';
import {userController} from "./controller/user.controller.ts";
import {userRatingController} from "./controller/user-rating.controller.ts";
import {loginGuard} from "./helper/login-guard.ts";

const port = process.env.APP_PORT;
const appName = process.env.APP_NAME || 'unknown';

if (!port)
    throw new Error('Port for the microservice is not set. Please, set the APP_PORT environment variable.');

// initialize connection to MongoDB
await connectToMongo();

// initialize app server
const app = express();

// parse json body
app.use(cors({origin: true, credentials: true}));
app.use(express.json());

// add controllers here...
app.use('/friend-request', friendRequestController); // route /user/friend-request
app.use('/:id/rating', loginGuard(), userRatingController); // route /user/:id/rating
app.use('/', userManagementController); // route /user
app.use('/', userController); // route /user

// global handler for 404
app.use((req, res, next) => {
    next(new NotFoundError('Resource not found.', ''));
});
// global handler for app specified exceptions
app.use(errorHandler);

app.listen(port, () => console.log(`🥳 Microservice ${appName} is now running on port ${port}!`));