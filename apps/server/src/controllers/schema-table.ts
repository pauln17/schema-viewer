import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const createSchemaTable = async (req: Request, res: Response) => {
  const schemaId = req.schema.id;
  if (!schemaId || Array.isArray(schemaId)) return res.status(400).json({ error: "Schema ID Required" });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name Required" });
  try {
    const schemaTable = await prisma.schemaTable.create({
      data: { name, schemaId },
    });

    return res.status(201).json(schemaTable);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateSchemaTable = async (req: Request, res: Response) => {
  const schemaId = req.schema.id;
  if (!schemaId || Array.isArray(schemaId)) return res.status(400).json({ error: "Schema ID Required" });

  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: "Schema Table ID Required" });

  const { name, positionX, positionY } = req.body;
  const data = Object.fromEntries(Object.entries({ name, positionX, positionY }).filter(([_, value]) => value !== undefined));
  if (Object.keys(data).length === 0) return res.status(400).json({ error: "No Fields to Update" });

  try {
    const existing = await prisma.schemaTable.findFirst({
      where: { id, schemaId },
    });
    if (!existing) return res.status(404).json({ error: "Schema Table Not Found" });

    const schemaTable = await prisma.schemaTable.update({
      where: { id, schemaId },
      data,
    });
    return res.status(200).json(schemaTable);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteSchemaTable = async (req: Request, res: Response) => {
  const schemaId = req.schema.id;
  if (!schemaId || Array.isArray(schemaId)) return res.status(400).json({ error: "Schema ID Required" });

  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: "Schema Table ID Required" });

  try {
    const existing = await prisma.schemaTable.findFirst({
      where: { id, schemaId },
    });
    if (!existing) return res.status(404).json({ error: "Schema Table Not Found" });

    await prisma.schemaTable.delete({ where: { id, schemaId } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  createSchemaTable,
  updateSchemaTable,
  deleteSchemaTable,
};