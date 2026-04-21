import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRouter from "../../server/routes/api.ts"; // Assume this can resolve, or we pack appropriately 

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/", apiRouter); // mapped to /api via redirects

export const handler = serverless(app);
