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
    '/user/:id', paramValidator(identityByEmailParamSchema),  //id validation
    async (req: AppRequest<TIdentityByEmailParams>, res: Response) => {
        const user = await getUser(req.parsedParams!.email);  //user callback function
        successResponse(res, user);
    }
);

/**
 * Gets user rating by their ID.
 */

userManagementController.get(
    "/user/:id/rating",
    paramValidator(userIdParamSchema), //validator
    async (req: AppRequest<{ id: string }>, res: Response) => {
        try {
            const userId = req.parsedParams!.id;
            const ratings = await getUserRatings(userId);
            successResponse(res, { ratings });
        } catch (error) {
            console.error(error);
            errorResponse(res, "Failed to retrieve user ratings", StatusCodes.INTERNAL_SERVER_ERROR, "user_rating_fetch_error");
        }
    }
);

/**
 * Gets user friend-request
 */

userManagementController.get(
    '/friend-request',
    queryValidator(friendRequestQuerySchema),
    async (req: AppRequest<never, TFriendRequestQuery>, res: Response) => {
        try {
            const { userId } = req.parsedQuery!;
            const friendRequests = await getFriendRequests(userId);
            successResponse(res, friendRequests, StatusCodes.OK);
        } catch (error) {
            console.error(error);
            const badRequestError = new BadRequestError(
                "Failed to retrieve friend requests",
                "friend_request_fetch_error"
            );
            errorResponse(res, badRequestError.message, badRequestError.httpCode, badRequestError.errorCode);
        }
    }
);
