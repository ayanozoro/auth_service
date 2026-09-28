import tryCatch from "../middelware/trycatch.js";
import sanitize from "mongo-sanitize";
import { registerSchema, loginSchema } from "../config/zod.js";
import {User} from "../models/User.js";
import { redisClient } from "../index.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {sendMail} from "../config/sendMail.js";
import { getVerifyEmailHtml, getOpt } from "../config/html.js";
import {
    genetateToken,
    verifyRefreshToken,
    getAccessToken
} from "../config/generateToken.js";

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

    const rateLimitKey = `register:${req.ip}:${email}`;
    if(await redisClient.exists(rateLimitKey)) {
        return res.status(429).json({
            message: "Too many requests. Please try again later."
        });
    }

    const userExit = await User.findOne({ email });
    if (userExit) {
        return res.status(400).json({
            message: "User already exists"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verifyToken = crypto.randomBytes(32).toString("hex");

    const verifyKey = `verify:${verifyToken}`;

    const Data = JSON.stringify({
        name,
        email,
        password: hashedPassword
    });

    await redisClient.set(verifyKey, Data, {
        EX: 300 
    });

    const subject = "Verify your email";
    const html = getVerifyEmailHtml({ email, token:verifyToken });

    await sendMail({ email, subject, html });

    await redisClient.set(rateLimitKey, "1", {
        EX: 300
    });

    res.json({
        message: "User registered successfully. Please check your email to verify your account."
    })
    
});   


export const verifyUser = tryCatch(async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({
            message: "Token is required"
        });
    }

    const verifyKey = `verify:${token}`;
    const userData = await redisClient.get(verifyKey);
    if (!userData) {
        return res.status(400).json({
            message: "Invalid or expired token"
        });
    }

    await redisClient.del(verifyKey);

    const { name, email, password } = JSON.parse(userData);

    const userExit = await User.findOne({ email });
    if (userExit) {
        return res.status(400).json({
            message: "User already exists"
        });
    }

    const user = new User({
        name,
        email,
        password
    });
    await user.save();

    res.json({
        message: "User verified and registered successfully",
        user: {
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
})

export const loginUser = tryCatch(async (req, res) => {
    const sanitized = sanitize(req.body);
    const validation = loginSchema.safeParse(sanitized);

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
    const { email, password } = validation.data;

    const rateLimitKey = `login-rate-limit:${req.ip}:${email}`;
    if(await redisClient.exists(rateLimitKey)) {
        return res.status(429).json({
            message: "Too many requests. Please try again later."
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${email}`;
    await redisClient.set(otpKey, JSON.stringify(otp), {
        EX: 300
    });

    const subject = "Your OTP code";
    const html = getOpt({ email, otp });
    await sendMail({ email, subject, html });
    await redisClient.set(rateLimitKey, "1", {
        EX: 100
    });

    res.json({
        message: "OTP sent to your email. Please check your inbox.",
        email: email
    })
});

export const verifyOtp = tryCatch(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            message: "Email and OTP are required"
        });
    }

    const otpKey = `otp:${email}`;
    const storedOtp = await redisClient.get(otpKey);
    if(!storedOtp) {
        return res.status(400).json({
            message: "OTP expired or not found. Please request a new OTP."
        });
    }
    
    const isOtpValid = storedOtp && storedOtp === JSON.stringify(otp);
    if (!isOtpValid) {
        return res.status(400).json({
            message: "Invalid or expired OTP"
        });
    }

    await redisClient.del(otpKey);

    let user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({
            message: "User not found"
        });
    }

    const tokens = await genetateToken(user._id, res);

    res.status(200).json({
        message: `Welcome back, ${user.name}!`,
        user    
    });
})

export const refreshToken = tryCatch(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    console.log("refreshToken", refreshToken);
    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token is required"
        });
    }

    const decoded = await verifyRefreshToken(refreshToken);   

    if (!decoded) {
        return res.status(403).json({
            message: "Invalid or expired refresh token"
        });
    }

    getAccessToken(decoded.id, res);

    res.status(200).json({
        message: "Access token refreshed successfully"
    });
})