import express from "express";
import dotenv from "dotenv";
import connectdb from "./config/db.js";
import { createClient } from "redis";
import cookieParser from "cookie-parser";
import cors from "cors";


import routes from "./routes/user.js";

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use("/api", routes);

await connectdb();
const redis_url = process.env.redis_url;

if (!redis_url) {
    console.log("redis url is not defined");
    process.exit(1);
}
export const redisClient = createClient({
    url: redis_url
});
await redisClient.connect().then(() => {
    console.log("redis connected");
}).catch((err) => {
    console.log("redis connection failed", err);
    process.exit(1);
})

const port = process.env.port || 3000;

app.listen(port, () => {
    console.log(`server is listening to port ${port}`);
})
