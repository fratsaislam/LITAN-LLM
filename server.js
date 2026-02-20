const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

const authRouter = require("./routers/authRouter");
const groupRouter = require("./routers/groupRouter");
const exerciseRouter = require("./routers/exerciseRouter");
const convRouter = require("./routers/convRouter");
const statsRouter = require("./routers/statsRouter");


const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://innotrackestin.vercel.app',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        } else {
        callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/groups", groupRouter);
app.use("/api/exercises", exerciseRouter);
app.use("/api/conv", convRouter);
app.use("/api/stats", statsRouter);



const startServer = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("connected successfully to DB");
        app.listen(process.env.PORT, () => {
            console.log(`server started at PORT : ${process.env.PORT}`);
        })
    }catch(err){
        console.log(err);
    }
}

startServer();