import { Request, Response } from "express";
import { handleError } from "../lib/handleError";
import { z } from "zod";
import * as tableIndexService from "../services/table-index";

const createTableIndex = async (req: Request, res: Response) => {
  const tableColumnIdResult = z.uuid().safeParse(req.body.tableColumnId);
  if (!tableColumnIdResult.success) return res.status(400).json({ error: "Table Column ID Required" });
  const tableColumnId = tableColumnIdResult.data;

  try {
    const tableIndex = await tableIndexService.createTableIndex(req.schema!.id, tableColumnId);
    return res.status(201).json(tableIndex);
  } catch (error) {
    return handleError(error, res);
  }
};

const deleteTableIndex = async (req: Request, res: Response) => {
  const idRaw = req.params.id;
  const idResult = z.uuid().safeParse(idRaw);
  if (!idResult.success) return res.status(400).json({ error: "Table Index ID Required" });
  const id = idResult.data;

  try {
    await tableIndexService.deleteTableIndex(req.schema!.id, id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

export { createTableIndex, deleteTableIndex };
