import { Request, Response } from "express";
import { handleError } from "../lib/handleError";
import { z } from "zod";
import * as schemaTableService from "../services/schema-table";

const tableObject = z.object({
  name: z.string().min(1).max(15),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

const createSchemaTable = async (req: Request, res: Response) => {
  const result = tableObject.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.message });

  const { name } = result.data;
  try {
    const schemaTable = await schemaTableService.createSchemaTable(req.schema!.id, name);
    return res.status(201).json(schemaTable);
  } catch (error) {
    return handleError(error, res);
  }
};

const updateSchemaTable = async (req: Request, res: Response) => {
  const idResult = z.uuid().safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: "Schema Table ID Required" });
  const id = idResult.data;

  const tableObjectResult = tableObject.refine(
    (data) => data.name !== undefined && data.positionX !== undefined && data.positionY !== undefined,
    { message: "Atleast One of Name, PositionX, PositionY is required" }
  ).transform((data) => Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)));

  const result = tableObjectResult.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.message });

  try {
    const schemaTable = await schemaTableService.updateSchemaTable(req.schema!.id, id, result.data);
    return res.status(200).json(schemaTable);
  } catch (error) {
    return handleError(error, res);
  }
};

const deleteSchemaTable = async (req: Request, res: Response) => {
  const idResult = z.uuid().safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ error: "Schema Table ID Required" });
  const id = idResult.data;

  try {
    await schemaTableService.deleteSchemaTable(req.schema!.id, id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

export { createSchemaTable, updateSchemaTable, deleteSchemaTable };
