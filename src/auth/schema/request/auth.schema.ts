import {z} from "zod";

export const loginBodySchema = z.object({
    login: z.string(),
    password: z.string(),
});
export type TLoginData = z.infer<typeof loginBodySchema>;