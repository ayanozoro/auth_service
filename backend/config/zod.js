import { email, z } from "zod"

export const registerSchema = z.object({
    name: z.string().min(2, "Name atleast 2 char"),
    email: z.string().email("invalid email"),
    password: z.string().min(8, "Password must has length 8")
})

export const loginSchema = z.object({
    email: z.string().email("invalid email"),
    password: z.string().min(8, "Password must has length 8")
})