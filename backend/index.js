import express from "express";
import dotenv from "dotenv";
import connectdb from "./config/db.js";



import routes from "./routes/user.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use("/api", routes);
await connectdb();

const port = process.env.port || 3000;

app.listen(port, () => {
    console.log(`server is listening to port ${port}`);
})
