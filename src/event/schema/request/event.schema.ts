import { z } from "zod";
import mongoose from "mongoose";

export const idSchema = z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
  message: "Invalid ObjectId",
});

export const eventSchema = z.object({
  _id: z.instanceof(mongoose.Types.ObjectId).optional(),
  name: z.string().min(1, "Event name is required"),
  description: z.string().optional(),
  date: z.date().optional(),
  location: z.string().min(1, "Location is required"),
  private: z.boolean(),
  ownerId: z.instanceof(mongoose.Types.ObjectId),
});

export type TEvent = z.infer<typeof eventSchema>;
