import type {Request} from "express";
import type {EUserRole} from "../schema/db/auth.schema.ts";

export interface AppRequest<
    TParams = undefined,
    TQuery = undefined,
    TBody = undefined,
    TResBody = any,
    TLocals extends Record<string, any> = Record<string, any>
> extends Request<Record<string,string>,TResBody,TBody extends undefined ? {} : TBody,Record<string,string>,TLocals> {
    parsedParams?: TParams,
    parsedQuery?: TQuery,
    user?: {
        id: string,
        role: EUserRole
    } | null
}