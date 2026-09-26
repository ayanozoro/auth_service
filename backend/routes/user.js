import express from "express";
import { registerUser , verifyUser, loginUser } from "../controllers/user.js";

const routes = express.Router();

routes.post("/register", registerUser);
routes.post("/login", loginUser);
routes.post("/verify/:token", verifyUser);

export default routes;