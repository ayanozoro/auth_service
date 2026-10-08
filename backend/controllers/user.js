import tryCatch from "../middelware/trycatch.js";
import sanitize from "mongo-sanitize";
import { registerSchema, loginSchema, resetPasswordSchema, verifyResetOtpSchema } from "../config/zod.js";
import { User } from "../models/User.js";
import { redisClient } from "../index.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendMail } from "../config/sendMail.js";
import { getVerifyEmailHtml, getOpt } from "../config/html.js";
import {
    genetateToken,
    verifyRefreshToken,
    getAccessToken,
    revokeRefreshToken
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
    if (await redisClient.exists(rateLimitKey)) {
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
    const html = getVerifyEmailHtml({ email, token: verifyToken });

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
    if (await redisClient.exists(rateLimitKey)) {
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

    const isPasswordValid = user.password && await bcrypt.compare(password, user.password);
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
    if (!storedOtp) {
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


export const logoutUser = tryCatch(async (req, res) => {
    const userId = req.user._id ?? req.user.id;

    await revokeRefreshToken(userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    await redisClient.del(`user:${userId}`);

    res.status(200).json({
        message: "Logged out successfully"
    });
});


export const resertPassword = tryCatch(async (req, res) => {
    const sanitized = sanitize(req.body);
    const validation = resetPasswordSchema.safeParse(sanitized);

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
    const { email, password, newPassword } = validation.data;

    const rateLimitKey = `reset-rate-limit:${req.ip}:${email}`;
    if (await redisClient.exists(rateLimitKey)) {
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);


    const resetKey = `reset-password-otp:${email}`;
    await redisClient.set(resetKey, JSON.stringify({
        otp,
        newPassword: hashedPassword
    }), {
        EX: 300
    });
    const subject = "Your Password Reset OTP";
    const html = getOpt({ email, otp });
    await sendMail({ email, subject, html });
    await redisClient.set(rateLimitKey, "1", {
        EX: 100
    });
    res.json({
        message: "Password reset link sent to your email. Please check your inbox.",
        email: email
    })

})


export const verifyResetOtp = tryCatch(async (req, res) => {
    const sanitized = sanitize(req.body);
    const validation = verifyResetOtpSchema.safeParse(sanitized);

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
    const { email, otp } = validation.data;

    const resetKey = `reset-password-otp:${email}`;
    const storedReset = await redisClient.get(resetKey);
    if (!storedReset) {
        return res.status(400).json({
            message: "OTP expired or not found. Please request a new OTP."
        });
    }

    let resetData;
    try {
        resetData = JSON.parse(storedReset);
    } catch {
        return res.status(400).json({
            message: "Invalid or expired OTP"
        });
    }

    const isOtpValid = resetData.otp === otp;
    if (!isOtpValid) {
        return res.status(400).json({
            message: "Invalid or expired OTP"
        });
    }

    await redisClient.del(resetKey);

    const { newPassword } = resetData;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({
            message: "User not found"
        });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
        message: "Password reset successful. You can now login with your new password."
    });
})


export const googleAuth = tryCatch(async (req, res) => {
    const client_id=process.env.client_id;
    const redirect_uri=process.env.callback_url || "http://localhost:4000/api/auth/google/callback";

    if(!client_id){
        return res.status(500).json({
            message: "Google client ID is not configured"
        });
    }

    const state = crypto.randomBytes(16).toString("hex");

    await redisClient.set(`google-auth-state:${state}`, "1", {
        EX: 300
    });

    const params = new URLSearchParams({
        client_id,
        redirect_uri,
        response_type: "code",
        scope: "openid email profile",
        state
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    res.redirect(googleAuthUrl);
})


export const googleAuthCallback = tryCatch(async (req, res) => {
    const frontend_url=process.env.frontend_url || "http://localhost:5173";

    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).json({
            message: "Missing code or state in the callback"
        });
    }

    if (typeof code !== "string" || typeof state !== "string") {
    return res.redirect(`${frontend_url}/login?oauth_error=invalid_request`);
  }
   
   const storedState = await redisClient.get(`google-auth-state:${state}`);
    if (!storedState) {
        return res.redirect(`${frontend_url}/login?oauth_error=invalid_state`);
    }

    await redisClient.del(`google-auth-state:${state}`);

    const client_id=process.env.client_id;
    const client_secret=process.env.client_secret;
    const redirect_uri=process.env.callback_url || "http://localhost:4000/api/auth/google/callback";

    if(!client_id || !client_secret) {
        return res.redirect(`${frontend_url}/login?oauth_error=server_error`);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            code,
            client_id,
            client_secret,
            redirect_uri,
            grant_type: "authorization_code"
        })
    });

    if (!tokenResponse.ok) {
        return res.redirect(`${frontend_url}/login?oauth_error=token_request_failed`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
        return res.redirect(`${frontend_url}/login?oauth_error=invalid_token_response`);
    }

    const identityResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
            "Authorization": `Bearer ${tokenData.access_token}`
        }
    });

    if (!identityResponse.ok) {
        return res.redirect(`${frontend_url}/login?oauth_error=identity_request_failed`);
    }

    const identityData = await identityResponse.json();

    const validIdentity = identityData.email_verified === true &&
        typeof identityData.email === "string" &&
        typeof identityData.sub === "string";

    if (!validIdentity) {
        return res.redirect(`${frontend_url}/login?oauth_error=invalid_identity_response`);
    }

    const email = identityData.email.toLowerCase();
    let user = await User.findOne({$or:[{ googleId: identityData.sub },{ email }]});

    if (!user) {
        user = new User({
            name: identityData.name,
            email,
            googleId: identityData.sub,
            authProvider: "google"
        });
        await user.save();
    }else if(!user.googleId){
        user.googleId = identityData.sub;
        user.authProvider = "google";
        await user.save();
    }

    await genetateToken(user._id, res);

    res.redirect(`${frontend_url}/dashboard`);  
})