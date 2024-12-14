import mongoose from "mongoose";
import {z} from "zod";

export const zodObjectId = z.custom<string>((value) => mongoose.isValidObjectId(value), { message: 'Invalid ObjectId' });