import {bodyValidator, paramValidator} from "../helper/request.validator.ts";
import {userIdParamSchema, ratingBody, type TUserIdParam, type TRatingBody} from "../schema/request/user.schema.ts";
import type {AppRequest} from "../types";
import type {IUserRating} from "../schema/db/rating.schema.ts";
import express, {type Response} from "express";
import {successResponse} from "../helper/response.helper.ts";
import {StatusCodes} from "http-status-codes";
import {addUserRating, getUserRatings} from "../service/user-rating.service.ts";
import {Types} from "mongoose";

export const userRatingController = express.Router({ mergeParams: true });

/** Gets user rating by their ID. */
userRatingController.get(
    "/", paramValidator(userIdParamSchema),
    async (req: AppRequest<TUserIdParam>, res: Response) => {
        const userId = req.parsedParams!.id;
        const ratings = await getUserRatings(userId);
        successResponse(res, ratings);
    }
);

/** Adds a new rating to a user. */
userRatingController.post(
    '/', paramValidator(userIdParamSchema), bodyValidator(ratingBody),
    async (req: AppRequest<TUserIdParam,never,TRatingBody>, res: Response) => {
        const userId = req.parsedParams!.id;
        const ratingData = req.body;

        const userDetail = await addUserRating(userId, ratingData, new Types.ObjectId(req.user!.id));
        successResponse(res, userDetail, StatusCodes.CREATED);
    }
);