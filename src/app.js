import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthcheckRouter  from "./routes/healthcheck.routes.js";
import publicRouter from './routes/public.routes.js'
import repRouter from './routes/rep.routes.js'
import adminRouter from './routes/admin.routes.js'
import { errorHandler } from "./middlewares/error.middlewares.js";


dotenv.config({
  path: "./.env",
});

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);


// common middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: "32kb" }));
// app.use(express.static("public"));
app.use(cookieParser());

// Routes




app.use("/", healthcheckRouter);
app.use("/api/v1" , publicRouter);
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/rep", repRouter);


app.use("*" , (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

export default app;
