import { prisma } from "../lib/prisma";
import { Request, Response, NextFunction } from "express";

const ROLE_RANK = { VIEWER: 1, EDITOR: 2, OWNER: 3 } as const;
type MinRole = keyof typeof ROLE_RANK;

export const authorizeSchema = (minRole: MinRole) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const schemaId = req.params.schemaId || req.params.id || req.body.schemaId || req.query.schemaId;
    if (!schemaId || typeof schemaId !== "string") return res.status(400).json({ error: "Schema ID Required" });

    try {
      const schema = await prisma.schema.findUnique({ where: { id: schemaId } });
      if (!schema) return res.status(404).json({ error: "Schema Not Found" });

      let userRole: MinRole;
      if (schema.userId === req.user!.id) {
        userRole = "OWNER";
      } else {
        const collaboration = await prisma.schemaCollaboration.findFirst({
          where: { schemaId: schema.id, collaboratorId: req.user!.id },
        });
        if (!collaboration) return res.status(403).json({ error: "Forbidden" });
        userRole = collaboration.role === "EDITOR" ? "EDITOR" : "VIEWER";
      }

      if (ROLE_RANK[userRole] < ROLE_RANK[minRole]) return res.status(403).json({ error: "Forbidden" });

      req.schema = schema;
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
};
