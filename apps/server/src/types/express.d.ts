import type { User } from "better-auth";

// Extend Express Request Object with User and Schema Properties
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
