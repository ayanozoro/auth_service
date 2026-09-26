import "dotenv/config";
import mongoose from "mongoose";

const connectdb = async () => {
    try {
        await mongoose.connect(process.env.mongo_uri, {
            dbName: "auth_service"
        });

        console.log("db connect");
    } catch (error) {
        console.log("fail to connect", error);
    }
};

export default connectdb;