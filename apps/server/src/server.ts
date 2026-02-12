// DotENV
import "dotenv/config";

// General
import express, { Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from "cors";
import { authMiddleware } from "./middleware/auth";

// Route Imports
import userRoutes from "./routes/user";
import schemaRoutes from "./routes/schema";
import schemaCollaborationRoutes from "./routes/schema-collaboration";
import schemaTableRoutes from "./routes/schema-table";
import tableColumnRoutes from "./routes/table-column";
import tableIndexRoutes from "./routes/table-index";
import tableColumnConstraintRoutes from "./routes/table-column-constraint";
import columnRelationRoutes from "./routes/column-relation";

const app = express();

// Middleware - CORS: Only allow requests from the frontend
const allowedOrigins = [
  "http://localhost:3000", // Next.js frontend (default port)
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Uses (toNodeHandler) to adapt auth (Better-Auth router instance) in a way Express understands. TLDR: Handles Better-Auth Requests from Frontend
// Note: express.json() should NOT be applied before the auth handler
app.all("/api/auth/{*any}", toNodeHandler(auth));

// Apply express.json() to every route, which parses the request body into a JSON object
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use("/users", userRoutes);
app.use("/schemas", schemaRoutes);
app.use("/schema-collaborations", schemaCollaborationRoutes);
app.use("/schema-tables", schemaTableRoutes);
app.use("/table-columns", tableColumnRoutes);
app.use("/table-indexes", tableIndexRoutes);
app.use("/table-column-constraints", tableColumnConstraintRoutes);
app.use("/column-relations", columnRelationRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({ Server: "200" });
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
