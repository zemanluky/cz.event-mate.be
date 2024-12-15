import type { IFriendRequest } from "../schema/db/friend-request.schema";
import { FriendRequest, EFriendRequestState } from "../schema/db/friend-request.schema";
import { BadRequestError } from "../error/response/bad-request.error";
import { NotFoundError } from "../error/response/not-found.error";
import { User } from "../schema/db/user.schema";
import {PermissionError} from "../error/response/permission.error.ts";
import {Types} from "mongoose";

/**
 * Fetches friend requests for a specific user.
 * @param userId The ID of the user.
 */
export async function getFriendRequests(userId: string) {
	const friendRequests = await FriendRequest
		.find({ receiver: userId, state: 'pending' })
		.populate("sender")
		.sort({ createdAt: -1 })
		.exec();

	return friendRequests.map((request) => request.toObject());
}

/**
 * Gets the count of pending friend requests for a specific user.
 * @param userId - The ID of the user.
 */
export async function getFriendRequestCount(userId: string): Promise<number> {
	return FriendRequest.countDocuments({receiver: userId, state: 'pending'});
}

/**
 * Creates new friend request between two users.
 * @param senderId The ID of the sender.
 * @param receiverId The ID of the receiver.
 */
export async function createFriendRequest(senderId: Types.ObjectId, receiverId: Types.ObjectId): Promise<IFriendRequest> {
	if (senderId === receiverId)
		throw new BadRequestError("Sender and receiver cannot be the same user.", "request_to_self");

	const receiver = await User.findById(receiverId);

	if (!receiver)
		throw new BadRequestError("The receiver does not exist. Please check the receiver.", 'receiver_not_found');

	if (receiver.friends.findIndex(friend => friend.equals(senderId)) !== -1)
		throw new BadRequestError("You already are a friend of the user.", "friend_request:already_friends");

	const existingRequest = await FriendRequest.findOne({
		$or: [
			{ sender: senderId, receiver: receiverId },
			{ sender: receiverId, receiver: senderId }
		],
		state: EFriendRequestState.Pending
	});

  	if (existingRequest)
		  throw new BadRequestError("A friend request already exists between these users.", "friend_request:duplicate_request");

	const friendRequest = new FriendRequest({
		sender: senderId,
		receiver: receiverId,
		createdAt: new Date(),
		state: EFriendRequestState.Pending,
	});

	const savedFriendRequest = await friendRequest.save();
	return savedFriendRequest.toObject();
}

/**
 * Rejects existing friend request.
 * @param userId
 * @param requestId
 */
export async function rejectFriendRequest(requestId: Types.ObjectId, userId: Types.ObjectId): Promise<IFriendRequest> {
	// Find the friend request
	const friendRequest = await FriendRequest.findById(requestId);
  
	// Check if the friend request exists
	if (!friendRequest)
	  throw new NotFoundError("Friend request not found.", "friend_request_not_found");
	
	// Check if the friend request was already accepted or rejected
	if (friendRequest.state !== EFriendRequestState.Pending)
	  throw new BadRequestError("Friend request has already been accepted or rejected.", "request_already_handled");

	// Ensure the user is the receiver of the request
	if (!friendRequest.receiver.equals(userId))
		throw new PermissionError("You are not authorized to accept this friend request.", "friend_request:reject");
  
	// Update the friend request state to "Rejected"
	friendRequest.state = EFriendRequestState.Rejected;
	await friendRequest.save();
  
	return friendRequest.toObject();
}

/**
 * Accepts existing friend request.
 * @param userId
 * @param requestId
 */
export async function acceptFriendRequest(requestId: Types.ObjectId, userId: Types.ObjectId) {
	// Find the friend request
	const friendRequest = await FriendRequest.findById(requestId);

	// Ensure the friend request exists
	if (!friendRequest)
		throw new NotFoundError("Friend request not found.", "friend_request_not_found");

	// Ensure the friend request is still pending
	if (friendRequest.state !== EFriendRequestState.Pending)
		throw new BadRequestError("Friend request has already been accepted or rejected.", "request_already_handled");

	// Ensure the user is the receiver of the request
	if (!friendRequest.receiver.equals(userId))
		throw new PermissionError("You are not authorized to accept this friend request.", "friend_request:accept");

	// Update the friend request state to "Accepted"
	friendRequest.state = EFriendRequestState.Accepted;
	await friendRequest.save();

	// Add each user to the other's `friends` array
	const senderId = friendRequest.sender.toString();

	// Update the friends array for both users
	await User.updateOne(
		{ _id: userId },
		{ $addToSet: { friends: senderId } }
	);

	await User.updateOne(
		{ _id: senderId },
		{ $addToSet: { friends: userId } }
	);

	return friendRequest.toObject();
}

/**
 * Removes pending friend request.
 * @param userId Currently logged-in user's ID.
 * @param requestId ID of the request to remove.
 */
export async function removeFriendRequest(requestId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
	const friendRequest = await FriendRequest.findById(requestId);

	if (!friendRequest)
		throw new NotFoundError(`The friend request with ID "${requestId}" to delete was not found.`, 'friend_request');

	if (!friendRequest.sender.equals(userId)) {
		throw new PermissionError("You are not authorized to remove this friend request.", "friend_request:delete");
	}

	if (friendRequest.state !== EFriendRequestState.Pending)
		throw new BadRequestError("Friend request has already been accepted or rejected, therefore it may not be deleted.", "request_already_handled");

	await friendRequest.deleteOne();
}
