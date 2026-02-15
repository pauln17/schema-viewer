
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const createSchemaCollaboration = async (req: Request, res: Response) => {
  const { email, role } = req.body;
  if (!email || typeof email !== "string") return res.status(400).json({ error: "Collaborator Email Required" });

  try {
    const collaborator = await prisma.user.findUnique({ where: { email } });
    if (!collaborator) return res.status(404).json({ error: "Collaborator Not Found" });
    if (collaborator.id === req.user!.id) return res.status(400).json({ error: "Cannot Collaborate With Self" });

    const existingCollaboration = await prisma.schemaCollaboration.findUnique({
      where: { schemaId_collaboratorId: { schemaId: req.schema!.id, collaboratorId: collaborator.id } },
    });
    if (existingCollaboration) return res.status(400).json({ error: "Collaboration Exists" });

    const schemaCollaboration = await prisma.schemaCollaboration.create({
      data: { schemaId: req.schema!.id, collaboratorId: collaborator.id, role },
    });

    return res.status(201).json(schemaCollaboration);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateSchemaCollaboration = async (req: Request, res: Response) => {
  const collaboratorId = req.params.id;
  if (!collaboratorId || Array.isArray(collaboratorId)) return res.status(400).json({ error: "Schema Collaboration ID Required" });

  const { role } = req.body;
  try {
    const existing = await prisma.schemaCollaboration.findFirst({
      where: { id: collaboratorId, schemaId: req.schema!.id },
    });
    if (!existing) return res.status(404).json({ error: "Schema Collaboration Not Found" });

    const schemaCollaboration = await prisma.schemaCollaboration.update({
      where: { id: collaboratorId },
      data: { role },
    });

    return res.status(200).json(schemaCollaboration);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteSchemaCollaboration = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: "Schema Collaboration ID Required" });

  try {
    const existing = await prisma.schemaCollaboration.findFirst({
      where: { id, schemaId: req.schema!.id },
    });
    if (!existing) return res.status(404).json({ error: "Schema Collaboration Not Found" });

    await prisma.schemaCollaboration.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  createSchemaCollaboration,
  updateSchemaCollaboration,
  deleteSchemaCollaboration,
};
