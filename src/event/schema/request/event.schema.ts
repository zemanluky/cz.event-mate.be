import {z} from "zod";

export const userEventsValidator = z.object({
    userId: z.string(), //id
    pageSize: z.coerce.number(), //number
    pageNumber: z.coerce.number() //number
});

export const filterEventsValidator = z.object({
    location: z.string().optional(), //string
    dateStart: z.coerce.date().optional(), //date
    dateEnd: z.coerce.date().optional(), //date
    rating: z.coerce.number().optional(), // number
    type: z.string().optional(), //string
    friendsOnly: z.coerce.boolean(), //boolean
    publicOnly: z.coerce.boolean(), //boolean
    pageSize: z.coerce.number(), //number
    pageNumber: z.coerce.number() //number
});

export type TUserEventsValidator = z.infer<typeof userEventsValidator>;
export type TFilterEventsValidator = z.infer<typeof filterEventsValidator>;