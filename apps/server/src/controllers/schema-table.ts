import { Request, Response } from "express";
import { handleError } from "../lib/handleError";
import * as schemaTableService from "../services/schema-table";

const createSchemaTable = async (req: Request, res: Response) => {
  const schemaId = req.schema!.id;
  if (!schemaId || Array.isArray(schemaId)) return res.status(400).json({ error: "Schema ID Required" });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name Required" });
  try {
    const schemaTable = await schemaTableService.createSchemaTable(schemaId, name);
    return res.status(201).json(schemaTable);
  } catch (error) {
    return handleError(error, res);
  }
};

const updateSchemaTable = async (req: Request, res: Response) => {
  const schemaId = req.schema!.id;
  if (!schemaId || Array.isArray(schemaId)) return res.status(400).json({ error: "Schema ID Required" });
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: "Schema Table ID Required" });
  const { name, positionX, positionY } = req.body;
  const data = Object.fromEntries(
    Object.entries({ name, positionX, positionY }).filter(([, value]) => value !== undefined)
  );
  if (Object.keys(data).length === 0) return res.status(400).json({ error: "No Fields to Update" });
  try {
    const schemaTable = await schemaTableService.updateSchemaTable(schemaId, id, data);
    return res.status(200).json(schemaTable);
  } catch (error) {
    return handleError(error, res);
  }
};

const deleteSchemaTable = async (req: Request, res: Response) => {
  const schemaId = req.schema!.id;
  if (!schemaId || Array.isArray(schemaId)) return res.status(400).json({ error: "Schema ID Required" });
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: "Schema Table ID Required" });
  try {
    await schemaTableService.deleteSchemaTable(schemaId, id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

export { createSchemaTable, updateSchemaTable, deleteSchemaTable };
