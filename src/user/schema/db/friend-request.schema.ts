import {type HydratedDocument, model, type Model, Schema, Types} from "mongoose";

export enum EFriendRequestState {
    Pending = 'pending',
    Accepted = 'accepted',
    Rejected = 'rejected'
}

export interface IFriendRequest {
    _id: Types.ObjectId;
    // The user who sent the friend request
    sender: Types.ObjectId;
    // The user who received the friend request
    receiver: Types.ObjectId;
    // The date when the friend request was sent
    createdAt: Date;
    // The state of the friend request
    state: EFriendRequestState
}

export type THydratedFriendRequestDocument = HydratedDocument<IFriendRequest>;
export type TUserRatingModel = Model<IFriendRequest, {}, {}, {}, THydratedFriendRequestDocument>;

export const friendRequestSchema = new Schema<IFriendRequest, TUserRatingModel>({
    sender: {type: Schema.Types.ObjectId, required: true, ref: 'User'},
    receiver: {type: Schema.Types.ObjectId, required: true, ref: 'User'},
    createdAt: {type: Date, required: true, default: Date.now},
    state: {type: String, required: true, default: EFriendRequestState.Pending}
});

export const FriendRequest = model<IFriendRequest, TUserRatingModel>('FriendRequest', friendRequestSchema);