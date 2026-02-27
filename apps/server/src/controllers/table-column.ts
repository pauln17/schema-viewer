import { Request, Response } from "express";
import { handleError } from "../lib/handleError";
import { z } from "zod";
import * as tableColumnService from "../services/table-column";

const createColumn = async (req: Request, res: Response) => {
  const columnObject = z.object({
    schemaTableId: z.uuid(),
    name: z.string().min(1).max(15),
    dataType: z.string().min(1).max(15),
    order: z.number().optional(),
  });
  const result = columnObject.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.message });
  const { schemaTableId, name, dataType, order } = result.data;

  try {
    const column = await tableColumnService.createColumn(req.schema!.id, schemaTableId, {
      name,
      dataType,
      order: order ?? 0,
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
  const idRaw = req.params.id;
  const idResult = z.uuid().safeParse(idRaw);
  if (!idResult.success) return res.status(400).json({ error: "Table Column ID Required" });
  const id = idResult.data;

  try {
    await tableColumnService.deleteColumn(req.schema!.id, id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

export { createColumn, updateColumn, deleteColumn };
