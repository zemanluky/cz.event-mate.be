import express, {type Response} from "express";
import { loginGuard } from "../helper/login-guard";
import type { AppRequest } from "../types";
import { rejectFriendRequest } from "../service/friend-request";
import { acceptFriendRequest } from "../service/friend-request";

export const friendRequestController = express.Router();

// Reject a friend request
friendRequestController.delete("/:requestId", loginGuard(),
  async (req: AppRequest, res: Response) => {
    const userId = req.user!.id;
    const requestId = req.params.requestId;

	const result = await rejectFriendRequest(userId, requestId);
	res.status(200).json({ message: result });
  }
);

// Accept a friend request
friendRequestController.patch("/:requestId/status", loginGuard(),
  async (req: AppRequest, res: Response) => {
    const userId = req.user!.id; // Logged-in user
    const requestId = req.params.requestId;

	const result = await acceptFriendRequest(userId, requestId);
	res.status(200).json({ message: "Friend request accepted successfully", result });
  }
);
