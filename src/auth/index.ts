import express from 'express';
import {errorHandler} from "./helper/error.handler.ts";
import {connectToMongo} from "./helper/mongo.connector.ts";
import {googleAuthController} from './controller/google-auth.controller.ts';
import {authController} from "./controller/auth.controller.ts";

const port = process.env.APP_PORT;
const appName = process.env.APP_NAME || 'unknown';

if (!port)
    throw new Error('Port for the microservice is not set. Please, set the APP_PORT environment variable.');

// initialize connection to MongoDB
await connectToMongo();

// initialize app server
const app = express();

// parse json body
app.use(express.json());

// add controllers here...
// remember, that this microservice is already prefixed /auth, so we shouldn't add another prefix here
app.use('/google', googleAuthController);
app.use('/', authController);

// global handler for app specified exceptions
app.use(errorHandler);

app.listen(port, () => console.log(`🥳 Microservice ${appName} is now running on port ${port}!`));