import crypto from "crypto";
import { redisClient } from "../index.js";

export const generateCSRFToken = async (userId, res) => {
    const csrfToken = crypto.randomBytes(32).toString("hex");
    const csrfKey = `csrf:${userId}`;
    await redisClient.set(csrfKey, csrfToken, {
        EX: 300
    });

    res.cookie("csrfToken", csrfToken, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: 300000
    });

    return csrfToken;
};

export const verifyCSRFToken = async (req, res, next) => {
    try {
        const userId = req.user?._id || req.user?.id;
        if (!userId && req.cookies?.refreshToken) {
            const decoded = await verifyRefreshToken(req.cookies.refreshToken);
            userId = decoded?.id;
        }
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }


        const clientCsrfToken = req.headers["x-csrf-token"] || req.headers["csrf-token"] || req.headers["csrftoken"];
        if (!clientCsrfToken) {
            return res.status(403).json({
                message: "CSRF token is missing"
            });
        }

        const csrfKey = `csrf:${userId}`;
        const serverCsrfToken = await redisClient.get(csrfKey);

        if (!serverCsrfToken || serverCsrfToken !== clientCsrfToken) {
            return res.status(403).json({
                message: "Invalid CSRF token"
            });
        }
        next();
    } catch (err) {
        console.error("Error verifying CSRF token:", err);
        return res.status(500).json({
            message: "CSRF token verification failed"
        });
    }
};

export const revokeCSRFToken = async (userId) => {
    const csrfKey = `csrf:${userId}`;
    await redisClient.del(csrfKey);
};

export const refreshCSRFToken = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        await revokeCSRFToken(userId);
        const csrfToken = await generateCSRFToken(userId, res);
        return res.status(200).json({
            message: "CSRF token refreshed successfully",
            csrfToken
        });
    } catch (err) {
        console.error("Error refreshing CSRF token:", err);
        return res.status(500).json({ message: "Failed to refresh CSRF token" });
    }
};
