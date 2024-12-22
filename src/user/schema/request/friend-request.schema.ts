import {z} from "zod";
import mongoose from "mongoose";
import { EFriendRequestState } from "../db/friend-request.schema";
import {zodObjectId} from "../../utils/validation.utils.ts";

export const friendRequestBodySchema = z.object({
	receiver: z.string().pipe(zodObjectId).transform((val) => new mongoose.Types.ObjectId(val)),
});
export type TFriendRequestBody = z.infer<typeof friendRequestBodySchema>;

export const friendRequestParamSchema = z.object({
	requestId: z.string().pipe(zodObjectId).transform((val) => new mongoose.Types.ObjectId(val)),
});
export type TFriendRequestParam = z.infer<typeof friendRequestParamSchema>;

export const friendRequestStatusBodySchema = z.object({
	accept: z.boolean()
});
export type TFriendRequestStatusBody = z.infer<typeof friendRequestStatusBodySchema>;
