import {z} from "zod";

export const verifyEmailAvailabilityQuerySchema = z.object({
    email: z.string().email()
});

export type TEmailAvailabilityQuery = z.infer<typeof verifyEmailAvailabilityQuerySchema>;