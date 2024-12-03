import type { IFriendRequest } from "../schema/db/friend-request.schema";
import { FriendRequest, EFriendRequestState } from "../schema/db/friend-request.schema";
import { BadRequestError } from "../error/response/bad-request.error";
import { NotFoundError } from "../error/response/not-found.error";
import { UnauthenticatedError } from "../error/response/unauthenticated.error";
import { User } from "../schema/db/user.schema";

export async function createFriendRequest(senderId: string, receiverId: string): Promise<IFriendRequest> {
  if (senderId === receiverId || !senderId || !receiverId) {
    throw new BadRequestError("Sender and receiver cannot be the same user.", "invalid_request");
  }

  const existingRequest = await FriendRequest.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
  });

  if (existingRequest) {
    throw new BadRequestError("A friend request already exists between these users.", "duplicate_request");
  }

  try {
    const friendRequest = new FriendRequest({
      sender: senderId,
      receiver: receiverId,
      createdAt: new Date(),
      state: EFriendRequestState.Pending,
    });

    const savedFriendRequest = await friendRequest.save();
    return savedFriendRequest.toObject();
  } catch (error) {
    throw new Error("Error creating friend request.");
  }
}

export async function rejectFriendRequest(userId: string, requestId: string): Promise<IFriendRequest> {
	// Find the friend request
	const friendRequest = await FriendRequest.findById(requestId);
  
	if (!friendRequest) {
	  throw new NotFoundError("Friend request not found.", "friend_request_not_found");
	}
  
	// Check if the user is authorized to reject this friend request
	if (friendRequest.receiver.toString() !== userId) {
	  throw new UnauthenticatedError("You are not authorized to reject this friend request.");
	}
  
	// Update the friend request state to "Rejected"
	friendRequest.state = EFriendRequestState.Rejected;
	await friendRequest.save();
  
	return friendRequest.toObject();
  }

export async function acceptFriendRequest(userId: string, requestId: string) {
	// Find the friend request
	const friendRequest = await FriendRequest.findById(requestId);

	if (!friendRequest) {
		throw new NotFoundError("Friend request not found.", "friend_request_not_found");
	}

	// Ensure the user is the receiver of the request
	if (friendRequest.receiver.toString() !== userId) {
		throw new UnauthenticatedError("You are not authorized to accept this friend request.");
	}

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