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

  const { name, positionX, positionY, tableColumns, tableIndexes, tableColumnConstraints } = req.body;
  const data = Object.fromEntries(Object.entries({ name, positionX, positionY, tableColumns, tableIndexes, tableColumnConstraints }).filter(([_, value]) => value !== undefined));

  try {
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
    const schemaTable = await prisma.schemaTable.delete({ where: { id, schemaId } });
    return res.status(200).json(schemaTable);
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