import {z} from "zod";

// see more at https://zod.dev/
export const fooSchema = z.object({
    name: z.string(),
    email: z.optional(z.string()),
    number: z.number().min(0).max(10),
});

// creates a type for the schema, which enables type-hinting on the request object
export type TFoo = z.infer<typeof fooSchema>;