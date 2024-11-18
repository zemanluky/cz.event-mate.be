import {type InferRawDocType, type Model, Schema} from "mongoose";

export interface IAuthRefreshToken {
    // id of the jwt token, used in the jti claim of the token
    jti: string,
    // when the token was issued so that we can revoke the oldest ones automatically when the session limit is reached
    issued_at: Date,
    // until when the token is valid - automatically invalidates the token
    valid_until: Date,
    // when the token was revoked - invalidates the refresh token
    revoked_at: Date|null
}

type TAuthRefreshTokenModel = Model<IAuthRefreshToken>;

export const authRefreshTokenSchema = new Schema<IAuthRefreshToken, TAuthRefreshTokenModel>({
    jti: { type: String, required: true, index: true, unique: true },
    issued_at: { type: Date, required: true },
    valid_until: { type: Date, required: true },
    revoked_at: { type: Date, default: null }
});

export type TAuthRefreshToken = InferRawDocType<typeof authRefreshTokenSchema>;