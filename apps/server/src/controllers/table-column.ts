import { Request, Response } from "express";
import { handleError } from "../lib/handleError";
import * as tableColumnService from "../services/table-column";

const createColumn = async (req: Request, res: Response) => {
  const { schemaTableId, name, dataType, order } = req.body;
  if (!schemaTableId || typeof schemaTableId !== "string")
    return res.status(400).json({ error: "Schema Table ID Required" });
  try {
    const column = await tableColumnService.createColumn(req.schema!.id, schemaTableId, {
      name,
      dataType,
      order,
    });
    return res.status(201).json(column);
  } catch (error) {
    return handleError(error, res);
  }
};

const updateColumn = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Table Column ID Required" });
  const { name, dataType, order } = req.body;
  const data = Object.fromEntries(
    Object.entries({ name, dataType, order }).filter(([, value]) => value !== undefined)
  );
  try {
    const column = await tableColumnService.updateColumn(req.schema!.id, id, data);
    return res.status(200).json(column);
  } catch (error) {
    return handleError(error, res);
  }
};

const deleteColumn = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Table Column ID Required" });
  try {
    await tableColumnService.deleteColumn(req.schema!.id, id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

export { createColumn, updateColumn, deleteColumn };
