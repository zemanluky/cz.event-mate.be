import {type HydratedDocument, type InferRawDocType, model, type Model, Schema, Types} from "mongoose";
import {type IAuthRefreshToken, authRefreshTokenSchema} from "./auth-refresh-token.schema.ts";
import {EUserRole} from "../../types";

export interface IAuth {
    // ID of the user. This ID must be the same as the ObjectID saved by the user microservice!
    _id: Types.ObjectId;
    // The hashed password.
    password: string;
    // Role of the authenticated user.
    role: EUserRole;
    // All refresh tokens issued to the user.
    refresh_tokens: Array<IAuthRefreshToken>;
}

export type THydratedAuthDocument = HydratedDocument<IAuth & { refresh_tokens?: Types.DocumentArray<IAuthRefreshToken> }>;

type TAuthModel = Model<IAuth, {}, {}, {}, THydratedAuthDocument>

const authSchema = new Schema<IAuth, TAuthModel>({
    _id: Types.ObjectId,
    password: { type: String, required: true },
    role: { type: String, required: false, index: true, unique: true, default: EUserRole.User },
    refresh_tokens: { type: [authRefreshTokenSchema], index: true, unique: true, default: [] },
}, { _id: false });

export const Auth = model<IAuth, TAuthModel>('Auth', authSchema);
export type TAuth = InferRawDocType<typeof authSchema>;