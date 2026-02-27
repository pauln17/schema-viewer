import { Request, Response } from "express";
import { ConstraintType } from "../generated/prisma/client";
import { handleError } from "../lib/handleError";
import { z } from "zod";
import * as tableColumnConstraintService from "../services/table-column-constraint";

const createTableColumnConstraint = async (req: Request, res: Response) => {
  const constraintObject = z.object({
    type: z.enum(Object.values(ConstraintType)),
    expression: z.string().optional(),
    columnIds: z.array(z.uuid()),
    referencedColumnIds: z.array(z.uuid()).optional(),
    onDelete: z.string().optional(),
    onUpdate: z.string().optional(),
  }).superRefine(
    (data, ctx) => {
      if (data.type === "FOREIGN_KEY") {
        if (!data.referencedColumnIds || data.referencedColumnIds.length === 0)
          ctx.addIssue({
            code: "custom", message: "Referenced Column IDs Required for FOREIGN_KEY"
          });
        if (data.referencedColumnIds?.length !== data.columnIds.length)
          ctx.addIssue({
            code: "custom", message: "Referenced Column IDs Length Must Match Column IDs for FOREIGN_KEY"
          });
      }
      if ((data.type === "CHECK" || data.type === "DEFAULT") && (!data.expression))
        ctx.addIssue({
          code: "custom", message: "Expression Required for CHECK/DEFAULT"
        });
    });

  const result = constraintObject.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.message });
  const { type, expression, columnIds, referencedColumnIds, onDelete, onUpdate } = result.data;

  const data = {
    type,
    columnIds,
    referencedColumnIds: referencedColumnIds ?? [],
    ...(expression !== undefined && expression !== "" && { expression }),
    ...(onDelete !== undefined && { onDelete }),
    ...(onUpdate !== undefined && { onUpdate }),
  };

  try {
    const tableColumnConstraint = await tableColumnConstraintService.createTableColumnConstraint(
      req.schema!.id,
      data
    );
    return res.status(201).json(tableColumnConstraint);
  } catch (error) {
    return handleError(error, res);
  }
};

const updateTableColumnConstraint = async (req: Request, res: Response) => {
  const idRaw = req.params.id;
  const idResult = z.uuid().safeParse(idRaw);
  if (!idResult.success) return res.status(400).json({ error: "Constraint ID Required" });
  const id = idResult.data;

  const constraintObject = z.object({
    type: z.enum(Object.values(ConstraintType)).optional(),
    expression: z.string().optional(),
  }).transform((data) => Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)));
  const result = constraintObject.safeParse(req.body);

  if (!result.success) return res.status(400).json({ error: result.error.message });


  try {
    const tableColumnConstraint = await tableColumnConstraintService.updateTableColumnConstraint(
      req.schema!.id,
      id,
      result.data
    );
    return res.status(200).json(tableColumnConstraint);
  } catch (error) {
    return handleError(error, res);
  }
};

const deleteTableColumnConstraint = async (req: Request, res: Response) => {
  const idRaw = req.params.id;
  const idResult = z.uuid().safeParse(idRaw);
  if (!idResult.success) return res.status(400).json({ error: "Constraint ID Required" });
  const id = idResult.data;

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
