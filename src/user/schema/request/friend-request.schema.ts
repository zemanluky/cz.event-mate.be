import {z} from "zod";
import mongoose from "mongoose";
import { EFriendRequestState } from "../db/friend-request.schema";

export const friendRequestValidator = z.object({
	sender: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
	  message: "Invalid sender ObjectId",
	}),
	receiver: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
	  message: "Invalid receiver ObjectId",
	}),
	state: z.enum([EFriendRequestState.Pending, EFriendRequestState.Accepted, EFriendRequestState.Rejected], {
	  message: "State must be 'pending', 'accepted', or 'rejected'",
	}).optional(), // Optional since the default state could be pending
  });