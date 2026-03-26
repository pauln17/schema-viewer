import "dotenv/config";

import { createServer } from "node:http";

import cors from "cors";
import express, { Request, Response } from "express";
import { Server } from "socket.io";

import { rateLimiter } from "./middleware/rateLimiter";
import schemaRouter from "./schema";

const app = express();
const allowedOrigins = process.env.CORS_ORIGIN?.split(",") ?? [];

if (allowedOrigins.length > 0) {
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
}

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
  }
});

app.use(express.json());
app.use(rateLimiter);

app.use("/schemas", schemaRouter);

app.get("/", (_req: Request, res: Response) => {
  res.json({ Server: "200" });
});

io.on("connection", (socket) => {
  socket.join(socket.handshake.auth.token)
  socket.on("schema", (data) => {
    socket.broadcast.to(socket.handshake.auth.token).emit("schema", data);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
