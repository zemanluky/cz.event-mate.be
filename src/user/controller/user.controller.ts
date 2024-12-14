import express, {type Response} from "express";
import {microserviceGuard} from "../helper/microservice.url.ts";
import type {AppRequest} from "../types";
import {
    authorsListQuerySchema,
    type TAuthorListQuery,
    type TUserFriendListParams, userFriendListParamSchema
} from "../schema/request/user.schema.ts";
import {getAuthorsList, getUserFriends} from "../service/user.service.ts";
import {successResponse} from "../helper/response.helper.ts";
import * as R from 'remeda';
import type {IUser} from "../schema/db/user.schema.ts";
import {exportAuthorProfile, type TAuthor} from "../utils/user.utils.ts";
import {paramValidator, queryValidator} from "../helper/request.validator.ts";

export const userController = express.Router();

export type TAuthorMap = Record<string, TAuthor>;

/** Returns authors map for given author ids. This endpoint is available only to microservices, primarily for event microservice to populate event objects. */
userController.get(
    '/authors', microserviceGuard(), queryValidator(authorsListQuerySchema),
    async (req: AppRequest<never,TAuthorListQuery>, res: Response) => {
        const authors = await getAuthorsList(req.parsedQuery!.authorIds);
        const exportedAuthorMap = R.reduce(authors, (acc: TAuthorMap, user) => {
            acc[user._id.toString()] = exportAuthorProfile(user);
            return acc;
        }, {});

        successResponse(res, exportedAuthorMap);
    }
);

/** Returns friend list for given user id. This endpoint is available only to microservices, primarily for event microservice to find correct events. */
userController.get(
    '/:id/friend-list', microserviceGuard(), paramValidator(userFriendListParamSchema),
    async (req: AppRequest<TUserFriendListParams>, res: Response) => {
        const friendList = await getUserFriends(req.parsedParams!.id);
        successResponse(res, friendList.map(objectId => objectId.toString()));
    }
)