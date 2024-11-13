import express, { type Request, type Response } from "express";
import { loginGuard } from "../helper/login-guard";
import { microserviceUrl } from "../helper/microservice.url.ts";

export const loginGuardController = express.Router();

// Protected route: loginGuard is applied here as middleware
loginGuardController.get('/protected-route', loginGuard, async (req: Request, res: Response) => {
    const response = await fetch(microserviceUrl('user', 'hello'));
    const greeting = await response.text();

    res.json({ message: 'You are authenticated!', greeting });
});

// Public route: loginGuard is not applied, so anyone can access this route
loginGuardController.get('/public-route', async (req: Request, res: Response) => {
    res.json({ message: 'This route is public.' });
});
