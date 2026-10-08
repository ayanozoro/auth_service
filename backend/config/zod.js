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

export const resetPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
});
export const verifyResetOtpSchema = z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});
