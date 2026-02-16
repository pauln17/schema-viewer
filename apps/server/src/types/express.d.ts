import type { User } from "better-auth";
import type { Schema } from "../generated/prisma/client";

// Extend Express Request Object with User and Schema Properties
declare global {
  namespace Express {
    interface Request {
      user?: User;
      schema?: Schema;
    }
  }
}
