import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRouter from "../../server/routes/api.ts"; 

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Mount on all possible base paths Netlify might present
app.use("/", apiRouter);
app.use("/api", apiRouter);
app.use("/.netlify/functions/api", apiRouter);

export const handler = serverless(app);
