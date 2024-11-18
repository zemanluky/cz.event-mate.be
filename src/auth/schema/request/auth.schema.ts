import {z} from "zod";

export const loginBodySchema = z.object({
    email: z.string().email(),
    password: z.string()
        .regex(/^(?=(.*[a-z])+)(?=(.*[A-Z])+)(?=(.*[0-9])+)(?=(.*[!"#$%&'()*+,-.\/:;<=>?@[\]^_`{|}~])+).{8,72}$/gm),
});

export const registerBodySchema = loginBodySchema
    .omit({email: true})
    .extend({
        id: z.string()
    });

export type TLoginData = z.infer<typeof loginBodySchema>;
export type TRegisterData = z.infer<typeof registerBodySchema>;