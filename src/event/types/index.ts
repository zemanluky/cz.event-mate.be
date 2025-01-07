import type {Request} from "express";

export enum EUserRole {
    Admin = 'admin',
    User = 'user'
}

export interface AppRequest<
    TParams = undefined,
    TQuery = undefined,
    TBody = undefined,
    TResBody = any,
    TLocals extends Record<string, any> = Record<string, any>
> extends Request<Record<string,string>,TResBody,TBody extends undefined ? {} : TBody,Record<string,string>,TLocals> {
    parsedParams?: TParams,
    parsedQuery?: TQuery,
    isMicroserviceRequest?: boolean,
    user?: {
        id: string,
        role: EUserRole
    } | null
    file: any
}