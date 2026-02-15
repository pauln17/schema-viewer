import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Admin/internal use only. Returns all schemas in the system.
const getAllSchemas = async (req: Request, res: Response) => {
  try {
    const schemas = await prisma.schema.findMany()
    return res.status(200).json(schemas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Backend infers userId from req.user — never trust client.
const getSchemaById = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: "Schema ID Required" });

  try {
    const schema = await prisma.schema.findUnique({
      where: { id },
      include: {
        schemaTables: true,
        schemaCollaborations: true,
      },
    });
    return res.status(200).json(schema);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// User-facing: schemas the current user can access (owned + shared).
// Backend infers userId from req.user (set by authMiddleware) — never trust client for access filtering.
const getAccessibleSchemas = async (req: Request, res: Response) => {
  try {
    const schemas = await prisma.schema.findMany({
      where: {
        OR: [
          { userId: req.user!.id },
          { schemaCollaborations: { some: { collaboratorId: req.user!.id } } },
        ]
      },
      include: {
        schemaTables: true,
        schemaCollaborations: true,
      },
    });
    return res.status(200).json(schemas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createSchema = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name Required" });

  try {
    const schema = await prisma.schema.create({
      data: { name, userId: req.user!.id },
    });
    return res.status(201).json(schema);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateSchema = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: "Schema ID Required" });
  const { name, isPublished, schemaTables, schemaCollaborations } = req.body;
  const data = Object.fromEntries(Object.entries({ name, isPublished, schemaTables, schemaCollaborations }).filter(([_, value]) => value !== undefined));

  try {
    const schema = await prisma.schema.update({
      where: { id },
      data,
    });
    return res.status(200).json(schema);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteSchema = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: "Schema ID Required" });

  try {
    const schema = await prisma.schema.delete({
      where: { id },
    });

    return res.status(200).json(schema);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  getAllSchemas,
  getAccessibleSchemas,
  getSchemaById,
  createSchema,
  updateSchema,
  deleteSchema,
};
