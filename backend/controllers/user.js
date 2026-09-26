import tryCatch from "../middelware/trycatch.js";
import sanitize from "mongo-sanitize";
import { registerSchema } from "../config/zod.js";

export const registerUser = tryCatch(async (req, res) => {
    const sanitized = sanitize(req.body);
    const validation = registerSchema.safeParse(sanitized);

    if (!validation.success) {
        const zodError = validation.error;
        let allError = [];

        if (zodError?.issues && Array.isArray(zodError.issues)) {
            allError = zodError.issues.map((issue) => ({
                field: issue.path ? issue.path.join(".") : "unknown",
                message: issue.message || "vlidation error",
                code: issue.code,
            }));
        }
        let firstErrorMsg = allError[0]?.message || "validation error";
        return res.status(400).json({
            message: firstErrorMsg,
        })
    }
    const { name, email, password } = validation.data;
    res.send({
        name,
        email,
        password
    })
});   