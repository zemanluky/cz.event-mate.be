import express, {type Response} from "express";
import type {AppRequest} from "../types";
import {
    identityByEmailParamSchema,
    registerUserBodySchema, type TAvailabilityQuery, type TIdentityByEmailParams,
    type TRegistrationData,
    type TUpdateUserData,
    updateUserSchema, verifyAvailabilityQuerySchema, type TFriendRequestQuery
} from "../schema/request/user.schema.ts";
import {loginGuard} from "../helper/login-guard.ts";
import {bodyValidator, paramValidator, queryValidator} from "../helper/request.validator.ts";
import {
    checkAvailability,
    getFriendRequestCount,
    getIdentityByEmail,
    registerUser,
    updateProfile
} from "../service/user-management.service.ts";
import {errorResponse, successResponse} from "../helper/response.helper.ts";
import {StatusCodes} from "http-status-codes";
import {microserviceGuard} from "../helper/microservice.url.ts";
import * as R from 'remeda';
import {getUser} from "../service/user.service.ts";
import { getUserRatings } from "../service/user-management.service.ts";
import { userIdParamSchema } from "../schema/request/user.schema.ts";
import { friendRequestQuerySchema } from "../schema/request/user.schema.ts";
import { getFriendRequests } from "../service/user-management.service.ts";
import {BadRequestError} from "../error/response/bad-request.error.ts"
import { NotFoundError } from "../error/response/not-found.error.ts"
import { userSchemaForRating } from "../schema/request/user.schema.ts";
import type { IUserRating } from "../schema/db/rating.schema.ts";
import { addUserRating } from "../service/user-management.service.ts";


export const userManagementController = express.Router();

/**
 * Registers a new user to the system.
 */
userManagementController.post(
    '/registration', bodyValidator(registerUserBodySchema),
    async (req: AppRequest<never,never,TRegistrationData>, res: Response) => {
        const user = await registerUser(req.body);
        successResponse(res, { message: 'OK' }, StatusCodes.CREATED);
    }
);

/**
 * Checks for credentials availability.
 */
userManagementController.get(
    '/registration/availability', queryValidator(verifyAvailabilityQuerySchema),
    async (req: AppRequest<never,TAvailabilityQuery>, res: Response) => {
        const availabilities = await checkAvailability(req.parsedQuery!);
        successResponse(res, { ...availabilities });
    }
);

/**
 * Gets user's identity by their email.
 * Available only to other microservices.
 */
userManagementController.get(
    '/identity/:email', microserviceGuard(), paramValidator(identityByEmailParamSchema),
    async (req: AppRequest<TIdentityByEmailParams>, res: Response) => {
        const id = await getIdentityByEmail(req.parsedParams!.email);
        successResponse(res, {id});
    }
)

/**
 * Updates user's own user profile.
 */
userManagementController.put(
    '/profile', loginGuard(), bodyValidator(updateUserSchema),
    async (req: AppRequest<never,never,TUpdateUserData>, res: Response) => {
        const updatedUser = await updateProfile(req.body!, req.user!.id);
        successResponse(res, R.omit(updatedUser.toObject(), ['friends', 'profile_picture_path']));
    }
)

/**
 * Gets user's own user profile.
 */
userManagementController.get(
    '/profile', loginGuard(),
    async (req: AppRequest, res: Response) => {
        const user = await getUser(req.user!.id);
        successResponse(res, R.omit(user, ['friends', 'profile_picture_path']));
    }
);

/**
 * Gets user by their ID.
 */
userManagementController.get(
    '/user/:id', loginGuard(),
     paramValidator(userIdParamSchema),
    async (req: AppRequest<TIdentityByEmailParams>, res: Response) => {
            const user = await getUser(req.parsedParams!.email); 
            successResponse(res, user);
            if(!getUser){
            const notFoundError = new NotFoundError(
                "Failed to find user",
                "user_fetch_error"
            );
            errorResponse(res, notFoundError.message, notFoundError.httpCode, notFoundError.errorCode);
            }
        }
);

/**
 * Gets user rating by their ID.
 */

userManagementController.get(
    "/user/:id/rating", loginGuard(),
    paramValidator(userIdParamSchema), //validator
    async (req: AppRequest<{ id: string }>, res: Response) => {
            const userId = req.parsedParams!.id;
            const ratings = await getUserRatings(userId);
            successResponse(res, { ratings });
            if(!getUserRatings){
            const notFoundError = new NotFoundError(
                "Failed to find user-raiting",
                "user_raiting_fetch_error"
            );
            errorResponse(res, notFoundError.message, notFoundError.httpCode, notFoundError.errorCode);
        }
    }
);

/**
 * Gets user friend-request
 */

userManagementController.get(
    '/friend-request', loginGuard(),
    queryValidator(friendRequestQuerySchema),
    async (req: AppRequest<never, TFriendRequestQuery>, res: Response) => {
            const { userId } = req.parsedQuery!;
            const friendRequests = await getFriendRequests(userId);
            successResponse(res, friendRequests, StatusCodes.OK);
            if(!getFriendRequests){
            const badRequestError = new BadRequestError(
                "Failed to retrieve friend requests",
                "friend_request_fetch_error"
            );
            errorResponse(res, badRequestError.message, badRequestError.httpCode, badRequestError.errorCode);
            }
        }
);

userManagementController.get(
    '/friend-request/count', loginGuard(),
    async (req: AppRequest, res: Response) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new Error("User ID is missing");
            }
            const count = await getFriendRequestCount(userId);
            if(!getFriendRequestCount){
            const badRequestError = new BadRequestError(
                "Failed to retrieve friend requests",
                "friend_request_fetch_error"
            );
            errorResponse(res, badRequestError.message, badRequestError.httpCode, badRequestError.errorCode);
        }
    }
);

userManagementController.post(
    '/user/:id/rating',
    paramValidator(userIdParamSchema),
    bodyValidator(userSchemaForRating),
    async (req: AppRequest<{ id: string }, never, IUserRating>, res: Response) => {
        const userId = req.parsedParams!.id;
        const ratingData = req.body;

        const rating = await addUserRating(userId, ratingData);
        successResponse(res, { rating }, StatusCodes.CREATED);
    }
);


