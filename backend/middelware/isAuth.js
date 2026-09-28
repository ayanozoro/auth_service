import jwt from  'jsonwebtoken';
import { redisClient } from "../index.js";
import { User } from "../models/User.js";
import tryCatch from "./trycatch.js";

export const isAuth = async (req, res, next) => {
    try{
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
        return res.status(403).json({
            message: "token is required"
        });
    }
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(403).json({
                message: "token expired or invalid"
            });
        }
        const cachedUser = await redisClient.get(`user:${decoded.id}`);
        if (cachedUser) {
            req.user = JSON.parse(cachedUser);
            return next();
        }

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        await redisClient.setEx(`user:${user._id}`, 60 * 60, JSON.stringify(user)); // Cache user data for 1 hour
        req.user = user;
        next();
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export const myprofile = tryCatch(async (req, res) => {
    const user = req.user;
    res.json({
        message: "User profile fetched successfully",
        user
    })

})