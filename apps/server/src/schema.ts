import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "./lib/prisma";
import { generateToken, hashToken } from "./lib/token";
import { requireToken } from "./middleware/requireToken";

const router = Router();

router.get("/", requireToken(), async (req: Request, res: Response) => {
  const schemaId = req.schema!.id;
  const hashedToken = req.token!;

  try {
    const schema = await prisma.schema.findUnique({
      where: { id: schemaId, token: { tokenHash: hashedToken } },
      select: { id: true, name: true, definition: true, createdAt: true, updatedAt: true },
    });
    if (!schema) return res.status(404).json({ error: "Schema Not Found" });
    return res.status(200).json(schema);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const schemaObject = z.object({
    name: z.string().min(1).max(255),
    definition: z.record(z.string(), z.unknown()).optional(),
  });

  const result = schemaObject.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.message });

  const { name, definition } = result.data;
  try {
    const schema = await prisma.schema.create({
      data: {
        name,
        ...(definition !== undefined && { definition: definition as object }),
      },
    });
    const rawToken = generateToken();
    await prisma.schemaToken.create({
      data: {
        schemaId: schema.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },

    });
    return res.status(201).json({ schema, token: rawToken });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

router.put("/", requireToken(), async (req: Request, res: Response) => {
  const schemaId = req.schema!.id;
  const hashedToken = req.token!;

  const schemaObject = z
    .object({
      name: z.string().min(1).max(255).optional(),
      definition: z.record(z.string(), z.unknown()).optional(),
    })
    .partial()
    .refine((d) => !(d.name === undefined && d.definition === undefined), {
      message: "Update Requires Atleast One Field",
    })
    .transform((data) =>
      Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      )
    );

  const result = schemaObject.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.message });

  try {
    const existing = await prisma.schema.findUnique({ where: { id: schemaId, token: { tokenHash: hashedToken } } });
    if (!existing) return res.status(404).json({ error: "Schema Not Found" });

    const schema = await prisma.schema.update({
      where: { id: schemaId, token: { tokenHash: hashedToken } },
      data: result.data,
    });
    return res.status(200).json(schema);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

router.delete("/", requireToken(), async (req: Request, res: Response) => {
  const schemaId = req.schema!.id;
  const hashedToken = req.token!;

  try {
    const existing = await prisma.schema.findUnique({ where: { id: schemaId, token: { tokenHash: hashedToken } } });
    if (!existing) return res.status(404).json({ error: "Schema Not Found" });

    await prisma.schema.delete({ where: { id: schemaId, token: { tokenHash: hashedToken } } });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

export default router;
