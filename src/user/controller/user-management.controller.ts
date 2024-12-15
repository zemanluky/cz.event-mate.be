import express, {type Response} from "express";
import type {AppRequest} from "../types";
import {
    identityByEmailParamSchema,
    registerUserBodySchema,
    type TAvailabilityQuery,
    type TIdentityByEmailParams,
    type TRegistrationData,
    type TUpdateUserData,
    type TUserIdParam,
    updateUserSchema,
    userIdParamSchema,
    verifyAvailabilityQuerySchema
} from "../schema/request/user.schema.ts";
import {loginGuard} from "../helper/login-guard.ts";
import {bodyValidator, paramValidator, queryValidator} from "../helper/request.validator.ts";
import {
    checkAvailability,
    getIdentityByEmail,
    registerUser,
    removeFriend,
    updateProfile
} from "../service/user-management.service.ts";
import {emptyResponse, successResponse} from "../helper/response.helper.ts";
import {StatusCodes} from "http-status-codes";
import {microserviceGuard} from "../helper/microservice.url.ts";
import * as R from 'remeda';
import {getAllUsers, getUser} from "../service/user.service.ts";
import {Types} from "mongoose";
import {userController} from "./user.controller.ts";

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
        const user = await getUser(new Types.ObjectId(req.user!.id));
        successResponse(res, R.omit(user, ['profile_picture_path']));
    }
);

/**
 * Removes a friend from the current user's friend list.
 */
userManagementController.delete(
    '/friend/:id', loginGuard(), paramValidator(userIdParamSchema),
    async (req: AppRequest<TUserIdParam>, res: Response) => {
        await removeFriend(req.parsedParams!.id, new Types.ObjectId(req.user!.id));
        emptyResponse(res);
    }
)

/**
 * Gets all users.
 */
userManagementController.get(
    '/all', microserviceGuard(),
    async (req: AppRequest, res: Response) => {
        const users = await getAllUsers();
        successResponse(res, users);
    }
);