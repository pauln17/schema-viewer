import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "./lib/prisma";
import { generateToken, hashToken } from "./lib/token";
import { requireToken } from "./middleware/requireToken";

const router = Router();

router.get("/", requireToken(), async (req: Request, res: Response) => {
  try {
    const schema = await prisma.schema.findUnique({
      where: { id: req.schema!.id },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
    if (!schema) return res.status(404).json({ error: "Schema Not Found" });
    return res.status(200).json([schema]);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

router.get("/:id", requireToken(), async (req: Request, res: Response) => {
  const idResult = z.uuid().safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: "Schema ID required" });

  try {
    const schema = await prisma.schema.findUnique({
      where: { id: idResult.data },
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
      },
    });
    return res.status(201).json({ schema, token: rawToken });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

router.put("/:id", requireToken(), async (req: Request, res: Response) => {
  const idResult = z.uuid().safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: "Schema ID required" });

  const schemaObject = z
    .object({
      name: z.string().min(1).max(255).optional(),
      definition: z.record(z.string(), z.unknown()).optional(),
    })
    .refine((d) => d.name !== undefined || d.definition !== undefined, {
      message: "At least one of name or definition is required",
    });
  const result = schemaObject.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.message });

  const data = Object.fromEntries(
    Object.entries(result.data).filter(([, v]) => v !== undefined)
  ) as { name?: string; definition?: object };

  try {
    const existing = await prisma.schema.findUnique({ where: { id: idResult.data } });
    if (!existing) return res.status(404).json({ error: "Schema Not Found" });

    const schema = await prisma.schema.update({
      where: { id: idResult.data },
      data,
    });
    return res.status(200).json(schema);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

router.delete("/:id", requireToken(), async (req: Request, res: Response) => {
  const idResult = z.uuid().safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: "Schema ID required" });

  try {
    const existing = await prisma.schema.findUnique({ where: { id: idResult.data } });
    if (!existing) return res.status(404).json({ error: "Schema Not Found" });

    await prisma.schema.delete({ where: { id: idResult.data } });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

export default router;
