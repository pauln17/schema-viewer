import { Request, Response } from "express";
import { handleError } from "../lib/handleError";
import * as tableIndexService from "../services/table-index";

const createTableIndex = async (req: Request, res: Response) => {
  const { tableColumnId } = req.body;
  if (!tableColumnId || typeof tableColumnId !== "string")
    return res.status(400).json({ error: "Table Column ID Required" });
  try {
    const tableIndex = await tableIndexService.createTableIndex(req.schema!.id, tableColumnId);
    return res.status(201).json(tableIndex);
  } catch (error) {
    return handleError(error, res);
  }
};

const deleteTableIndex = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Table Index ID Required" });
  try {
    await tableIndexService.deleteTableIndex(req.schema!.id, id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

export { createTableIndex, deleteTableIndex };
