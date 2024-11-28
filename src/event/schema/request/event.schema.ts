import {z} from "zod";

export const allEventsValidator = z.object({
    pageSize: z.string(),
    pageNumber: z.string()
});

export const friendsEventsValidator = z.object({
    pageSize: z.string(),
    pageNumber: z.string()
});

export const userEventsValidator = z.object({
    userId: z.string(),
    pageSize: z.string(),
    pageNumber: z.string()
});

export type TAllEventsValidator = z.infer<typeof allEventsValidator>;
export type TFriendsEventsValidator = z.infer<typeof friendsEventsValidator>;