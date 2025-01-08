import { type Response, type NextFunction } from "express";
import { verifyJwt } from "./jwt.service.ts";
import { InvalidJwt } from "../error/invalid-jwt-token.error";
import { UnauthenticatedError } from "../error/response/unauthenticated.error";
import type {AppRequest} from "../types";

/**
 * Middleware to check if the user is authenticated.
 */
export function loginGuard(required: boolean = true) {
	return (req: AppRequest, res: Response, next: NextFunction) => {
		// the request is already authenticated - used by microservice
		if (req.isMicroserviceRequest === true) return next();

		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			if (required) {
				return next(new UnauthenticatedError('Could not find the authorization header.'));
			}

			return next();
		}

		const token = authHeader.split(' ')[1];

		if (!token)
			return next(new UnauthenticatedError('Could not find the authorization header.'));

		try {
			// Verify the token
			const { userId, role } = verifyJwt(token);

			if (!userId)
				return next(new UnauthenticatedError('User is not authorized.'));

			// Attach the user data to the request for further usage in the route
			req.user = { id: userId, role };
			next();
		} catch (error) {
			if (error instanceof InvalidJwt) {
				return next(new UnauthenticatedError('Invalid or expired token.'));
			}

			throw error;
		}
	};
}
