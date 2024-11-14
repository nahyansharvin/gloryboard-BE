import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthcheckRouter  from "./routes/healthcheck.routes.js";
import userRouter from './routes/user.routes.js'

dotenv.config({
  path: "./.env",
});

const app = express();
app.use(
  cors({
    origin: "*",
    // credentials: true,
  })
);


// common middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: "32kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter);

// app.use(errorHandler);

export default app;
