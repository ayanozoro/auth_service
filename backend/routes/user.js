import express from "express";
import { registerUser, verifyUser, loginUser, verifyOtp, refreshToken, logoutUser, resertPassword, verifyResetOtp, googleAuth, googleAuthCallback} from "../controllers/user.js";
import { isAuth, myprofile } from "../middelware/isAuth.js";
import { refreshCSRFToken, verifyCSRFToken } from "../config/csrfMiddelware.js";

const routes = express.Router();

routes.post("/register", registerUser);
routes.post("/login", loginUser);
routes.post("/verify/:token", verifyUser);
routes.post("/verify-otp", verifyOtp);
routes.get("/myprofile", isAuth, myprofile);
routes.get("/refresh-token", refreshToken);
routes.get("/logout", isAuth, verifyCSRFToken, logoutUser);
routes.get("/refresh-csrf", isAuth, refreshCSRFToken);
routes.post("/reset-password", resertPassword);
routes.post("/verify-reset-otp", verifyResetOtp);

routes.get("/auth/google", googleAuth);
routes.get("/auth/google/callback", googleAuthCallback);

export default routes;