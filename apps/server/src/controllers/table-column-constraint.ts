import { Request, Response } from "express";
import type { ConstraintType } from "../generated/prisma/client";
import { handleError } from "../lib/handleError";
import * as tableColumnConstraintService from "../services/table-column-constraint";

const createTableColumnConstraint = async (req: Request, res: Response) => {
  const { type, expression, columnIds } = req.body;
  if (!columnIds || !Array.isArray(columnIds) || columnIds.length === 0)
    return res.status(400).json({ error: "Column IDs Required" });
  if (!type || typeof type !== "string") return res.status(400).json({ error: "Type Required" });

  if (
    (type === "CHECK" || type === "DEFAULT") &&
    (!expression || typeof expression !== "string")
  )
    return res.status(400).json({ error: "Expression Required for CHECK/DEFAULT" });
  try {
    const tableColumnConstraint = await tableColumnConstraintService.createTableColumnConstraint(
      req.schema!.id,
      { type: type as ConstraintType, expression, columnIds }
    );
    return res.status(201).json(tableColumnConstraint);
  } catch (error) {
    return handleError(error, res);
  }
};

const updateTableColumnConstraint = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Constraint ID Required" });
  const { type, expression } = req.body;
  const data = Object.fromEntries(
    Object.entries({ type, expression }).filter(([, value]) => value !== undefined)
  );

  try {
    const tableColumnConstraint = await tableColumnConstraintService.updateTableColumnConstraint(
      req.schema!.id,
      id,
      data
    );
    return res.status(200).json(tableColumnConstraint);
  } catch (error) {
    return handleError(error, res);
  }
};

const deleteTableColumnConstraint = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Constraint ID Required" });
  try {
    await tableColumnConstraintService.deleteTableColumnConstraint(req.schema!.id, id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

export {
  createTableColumnConstraint,
  updateTableColumnConstraint,
  deleteTableColumnConstraint,
};
