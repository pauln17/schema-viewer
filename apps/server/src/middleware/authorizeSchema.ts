import { prisma } from "../lib/prisma";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

const ROLE_RANK = { VIEWER: 1, EDITOR: 2, OWNER: 3 } as const;
type MinRole = keyof typeof ROLE_RANK;

export const authorizeSchema = (minRole: MinRole) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const schemaIdRaw = req.params.schemaId || req.body.schemaId || req.params.id || req.query.schemaId;
    const schemaIdResult = z.uuid().safeParse(schemaIdRaw);

    if (!schemaIdResult.success) return res.status(400).json({ error: "Schema ID Required" });
    const schemaId = schemaIdResult.data;

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
