import { z } from "zod";
import mongoose, {Types} from "mongoose";
import {startOfToday} from "date-fns";
import {coerceBoolean, zodObjectId} from "../../utils/validation.utils.ts";

export const idSchema = z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
  message: "Invalid ObjectId",
}).transform((val) => new Types.ObjectId(val));
export const eventDetailParams = z.object({
    id: idSchema
});
export type TEventDetailParams = z.infer<typeof eventDetailParams>;

export const eventSchema = z.object({
    name: z.coerce.string().trim().min(1),
    description: z.coerce.string().nullable().optional(),
    date: z.coerce.date().min(startOfToday()),
    location: z.coerce.string().trim().min(1),
    category: z.coerce.string().pipe(zodObjectId).transform(val => new Types.ObjectId(val)),
    private: z.preprocess(coerceBoolean, z.boolean()),
    image_paths: z.array(z.string()).default([]),
});
export type TEventBody = z.infer<typeof eventSchema>;

export const filterEventsValidator = z.object({
    userId: z.string().optional(),
    location: z.string().optional(), //string
    dateStart: z.coerce.date().optional(), //date
    dateEnd: z.coerce.date().optional(), //date
    rating: z.coerce.number().optional(), // number
    category: z.string().pipe(zodObjectId).transform(val => new Types.ObjectId(val)).optional(), //string
    filter: z.enum(['friends-only', 'public-only', 'all']).default('all'),
    pageSize: z.coerce.number().min(1).default(25), //number
    pageNumber: z.coerce.number().min(1).default(1), //number
});

export type TFilterEventsValidator = z.infer<typeof filterEventsValidator>;

export const checkAttendanceQuery = z.object({
    authorId: idSchema,
    userId: idSchema
});
export type TAttendanceQuery = z.infer<typeof checkAttendanceQuery>;

export const monthOverviewQuery = z.object({
    date: z.coerce.date().optional().default(startOfToday())
});
export type TMonthOverviewQuery = z.infer<typeof monthOverviewQuery>;