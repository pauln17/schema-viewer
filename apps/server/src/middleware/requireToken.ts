import type { Request, Response, NextFunction } from "express";
import { verifyToken, hashToken } from "../lib/token";

const getBearerToken = (req: Request): string | null => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

export const requireToken = (): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: "Authorization Required (Bearer Token)" });
      return;
    }

    // Verify Token & Returns Schema ID if Valid Token
    const verificationResult = await verifyToken(token);
    if (!verificationResult.ok) {
      res.status(verificationResult.status).json({ error: verificationResult.message });
      return;
    }

    req.schema = { id: verificationResult.schemaId };
    req.token = hashToken(token);
    next();
  };
}
