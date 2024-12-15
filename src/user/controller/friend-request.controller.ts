import express, {type Response} from "express";
import { loginGuard } from "../helper/login-guard";
import type { AppRequest } from "../types";
import {emptyResponse, successResponse} from "../helper/response.helper.ts";
import {
    acceptFriendRequest, createFriendRequest,
    getFriendRequestCount, getFriendRequests,
    rejectFriendRequest,
    removeFriendRequest
} from "../service/friend-request.service.ts";
import {bodyValidator, paramValidator} from "../helper/request.validator.ts";
import {
    friendRequestBodySchema,
    friendRequestParamSchema, friendRequestStatusBodySchema, type TFriendRequestBody,
    type TFriendRequestParam,
    type TFriendRequestStatusBody
} from "../schema/request/friend-request.schema.ts";
import {Types} from "mongoose";

export const friendRequestController = express.Router();

/**
 * Gets user friend-request
 */
friendRequestController.get(
    '/', loginGuard(),
    async (req: AppRequest, res: Response) => {
        const friendRequests = await getFriendRequests(req.user!.id);
        successResponse(res, friendRequests);
    }
);

/**
 * Gets the number of friend requests.
 */
friendRequestController.get(
    '/count', loginGuard(),
    async (req: AppRequest, res: Response) => {
        const count = await getFriendRequestCount(req.user!.id);
        successResponse(res, { count });
    }
);

/**
 * Creates new friend request.
 */
friendRequestController.post(
    "/", loginGuard(), bodyValidator(friendRequestBodySchema),
    async (req: AppRequest<never,never,TFriendRequestBody>, res: Response) => {
        await createFriendRequest(new Types.ObjectId(req.user!.id), req.body.receiver);
        emptyResponse(res);
    }
);

/**
 * Accepts or rejects a given friend request.
 */
friendRequestController.patch(
    "/:requestId", loginGuard(),
    paramValidator(friendRequestParamSchema), bodyValidator(friendRequestStatusBodySchema),
    async (req: AppRequest<TFriendRequestParam,never,TFriendRequestStatusBody>, res: Response) => {
        if (req.body.accept) {
            await acceptFriendRequest(req.parsedParams!.requestId, new Types.ObjectId(req.user!.id));
            return emptyResponse(res);
        }

        await rejectFriendRequest(req.parsedParams!.requestId, new Types.ObjectId(req.user!.id));
        emptyResponse(res);
    }
);

/**
 * Deletes a given friend request.
 */
friendRequestController.delete(
    "/:requestId", loginGuard(), paramValidator(friendRequestParamSchema),
    async (req: AppRequest<TFriendRequestParam>, res: Response) => {
        await removeFriendRequest(req.parsedParams!.requestId, new Types.ObjectId(req.user!.id))
        emptyResponse(res);
    }
);
