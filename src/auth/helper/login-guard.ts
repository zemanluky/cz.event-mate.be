import { type Request, type Response, type NextFunction } from "express";
import { verifyJwt } from "../helper/jwt.service";
import { InvalidJwt } from "../error/invalid-jwt-token.error";
import { UnauthenticatedError } from "../error/response/unauthenticated.error";

export type TAuthReq<P = {}, ResBody = {}, ReqBody = {}, ReqQuery = {}, Locals extends Record<string, any> = {}>
	= Request<P, ResBody, ReqBody, ReqQuery, Locals> & { userId?: string | null };

/**
 * Middleware to check if the user is authenticated.
 */
export const loginGuard = (req: TAuthReq, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return next(new UnauthenticatedError('Could not find the authorization header.'));
	}

	const token = authHeader.split(' ')[1];

	if (!token)
		return next(new UnauthenticatedError('Could not find the authorization header.'));

	try {
		// Verify the token
		const { userId, jti } = verifyJwt(token);

		if (!userId)
			return next(new UnauthenticatedError('User is not authorized.'));
		
			// Attach the user data to the request for further usage in the route
		req.userId = userId;
		next(); // Token is valid, proceed to the next middleware or route handler
	} catch (error) {
		if (error instanceof InvalidJwt) {
			return res.status(401).json({ message: 'Invalid or expired token' });
		}
		return res.status(500).json({ message: 'Internal Server Error' });
	}
};