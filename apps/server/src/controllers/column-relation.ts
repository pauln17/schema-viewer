import { Request, Response } from "express";
import { handleError } from "../lib/handleError";
import * as columnRelationService from "../services/column-relation";

const createColumnRelation = async (req: Request, res: Response) => {
  const { sourceColumnId, targetColumnId } = req.body;
  if (!sourceColumnId || typeof sourceColumnId !== "string")
    return res.status(400).json({ error: "Source Column Required" });
  if (!targetColumnId || typeof targetColumnId !== "string")
    return res.status(400).json({ error: "Target Column Required" });
  const { onDelete, onUpdate } = req.body;
  const data = Object.fromEntries(
    Object.entries({ onDelete, onUpdate }).filter(([, value]) => value !== undefined)
  );
  try {
    const columnRelation = await columnRelationService.createColumnRelation(
      req.schema!.id,
      sourceColumnId,
      targetColumnId,
      data
    );
    return res.status(201).json(columnRelation);
  } catch (error) {
    return handleError(error, res);
  }
};

const updateColumnRelation = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Column Relation ID Required" });
  const { onDelete, onUpdate } = req.body;
  const data = Object.fromEntries(
    Object.entries({ onDelete, onUpdate }).filter(([, value]) => value !== undefined)
  );
  try {
    const columnRelation = await columnRelationService.updateColumnRelation(req.schema!.id, id, data);
    return res.status(200).json(columnRelation);
  } catch (error) {
    return handleError(error, res);
  }
};

const deleteColumnRelation = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Column Relation ID Required" });
  try {
    await columnRelationService.deleteColumnRelation(req.schema!.id, id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

export { createColumnRelation, updateColumnRelation, deleteColumnRelation };
