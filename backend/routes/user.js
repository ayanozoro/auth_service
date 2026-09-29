import express from "express";
import { registerUser , verifyUser, loginUser, verifyOtp, refreshToken, logoutUser } from "../controllers/user.js";
import { isAuth, myprofile } from "../middelware/isAuth.js";

const routes = express.Router();

routes.post("/register", registerUser);
routes.post("/login", loginUser);
routes.post("/verify/:token", verifyUser);
routes.post("/verify-otp", verifyOtp);
routes.get("/myprofile", isAuth, myprofile);
routes.get("/refresh-token", refreshToken);
routes.get("/logout", isAuth, logoutUser);

export default routes;