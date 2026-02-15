
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const createSchemaCollaboration = async (req: Request, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  const { schemaId, email, role } = req.body;
  if (!schemaId || !email) return res.status(400).json({ error: "Schema ID and Collaborator Email Required" });
  try {
    const schema = await prisma.schema.findUnique({ where: { id: schemaId } });
    if (!schema) return res.status(404).json({ error: "Schema Not Found" });

    // Reminder in Frontend -- Check For Self-Collaboration & Existing User/Collaboration
    const collaborator = await prisma.user.findUnique({
      where: { email },
    });

    if (!collaborator) return res.status(404).json({ error: "Collaborator Not Found" });
    if (collaborator?.id === req.user.id) return res.status(400).json({ error: "Cannot Collaborate With Yourself" });

    const existingCollaboration = await prisma.schemaCollaboration.findUnique({
      where: { schemaId_collaboratorId: { schemaId: schema.id, collaboratorId: collaborator.id } },
    });
    if (existingCollaboration) return res.status(400).json({ error: "Collaboration Already Exists" });

    const schemaCollaboration = await prisma.schemaCollaboration.create({
      data: { schemaId: schema.id, collaboratorId: collaborator.id, role },
    });

    await prisma.schema.update({
      where: { id: schema.id },
      data: { schemaCollaborations: { connect: { id: schemaCollaboration.id } } },
    });

    return res.status(201).json(schemaCollaboration);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateSchemaCollaboration = async (req: Request, res: Response) => {
  const collaboratorId = req.params.id;
  if (!collaboratorId || Array.isArray(collaboratorId)) return res.status(400).json({ error: "Collaborator ID Required" });

  const { role } = req.body;
  try {
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
    const schemaCollaboration = await prisma.schemaCollaboration.delete({ where: { id } });

    return res.status(200).json(schemaCollaboration);
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
