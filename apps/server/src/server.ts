import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { rateLimiter } from "./middleware/rateLimiter";
import schemaRouter from "./schema";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(rateLimiter);

app.use("/schemas", schemaRouter);

app.get("/", (_req: Request, res: Response) => {
  res.json({ Server: "200" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
