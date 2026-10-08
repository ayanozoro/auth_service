import jwt from 'jsonwebtoken';
import { redisClient } from "../index.js";
import { generateCSRFToken, revokeCSRFToken } from './csrfMiddelware.js';

export const genetateToken = async (id, res) => {
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    const refereshToken = jwt.sign({ id }, process.env.refresh_token_secret, { expiresIn: '1d' });

    const storeRefereshToken = `refresh:${id}`;
    await redisClient.setEx(storeRefereshToken, 24 * 60 * 60, refereshToken); // EX: 1 day

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refereshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    const csrfToken = await generateCSRFToken(id, res);

    return { accessToken, refereshToken };
}

export const verifyRefreshToken = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.refresh_token_secret);
        const storedRefreshToken = await redisClient.get(`refresh:${decoded.id}`);

        if (storedRefreshToken === refreshToken) {
            return decoded;
        }
        return null;
    } catch (error) {
        console.error(error);
        return null;
    }
}


export const getAccessToken = async (id, res) => {
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
}

export const revokeRefreshToken = async (id) => {
    await redisClient.del(`refresh:${id}`);
    await revokeCSRFToken(id); // Revoke CSRF token when refresh token is revoked
}