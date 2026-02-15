import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ConstraintType } from "src/generated/prisma/client";

const createTableColumnConstraint = async (req: Request, res: Response) => {
  const { type, expression, columnIds } = req.body;
  if (!columnIds || !Array.isArray(columnIds) || columnIds.length === 0) return res.status(400).json({ error: "Column IDs Required" });
  if (!type || typeof type !== "string") return res.status(400).json({ error: "Type Required" });
  if ((type === "CHECK" || type === "DEFAULT") && (!expression || typeof expression !== "string")) return res.status(400).json({ error: "Expression Required for CHECK/DEFAULT" });

  try {

    // Reject Invalid Column IDs or Not in Authorized Schema
    const colsInSchema = await prisma.tableColumn.findMany({
      where: { id: { in: columnIds }, schemaTable: { schemaId: req.schema!.id } },
    });
    if (colsInSchema.length !== columnIds.length) return res.status(400).json({ error: "Invalid Column IDs" });

    // Reject if Columns Belong to Different Tables
    const uniqueTableIds = new Set(colsInSchema.map((c) => c.schemaTableId));
    if (uniqueTableIds.size > 1) return res.status(400).json({ error: "All Columns Must Belong to the Same Table" });

    const tableColumnConstraint = await prisma.tableColumnConstraint.create({
      data: { type: type as ConstraintType, expression: expression ?? undefined, columnIds },
    });

    return res.status(201).json(tableColumnConstraint);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateTableColumnConstraint = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Constraint ID Required" });

  const { type, expression } = req.body;
  const data = Object.fromEntries(Object.entries({ type, expression }).filter(([_, value]) => value !== undefined));

  try {
    const existing = await prisma.tableColumnConstraint.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Constraint Not Found" });

    // Reject Invalid Column IDs or Not in Authorized Schema
    const colsInSchema = await prisma.tableColumn.findMany({
      where: { id: { in: existing.columnIds }, schemaTable: { schemaId: req.schema!.id } },
    });
    if (colsInSchema.length !== existing.columnIds.length) return res.status(404).json({ error: "Constraint Not Found" });

    // Reject if Columns Belong to Different Tables
    const uniqueTableIds = new Set(colsInSchema.map((c) => c.schemaTableId));
    if (uniqueTableIds.size > 1) return res.status(400).json({ error: "All Columns Must Belong to the Same Table" });

    // Re-Check if Expression is Valid for Type
    const effectiveType = (data.type ?? existing.type) as ConstraintType;
    if ((effectiveType === "CHECK" || effectiveType === "DEFAULT") && (data.expression !== undefined ? !data.expression || typeof data.expression !== "string" : !existing.expression)) {
      return res.status(400).json({ error: "Expression Required for CHECK/DEFAULT" });
    }

    const tableColumnConstraint = await prisma.tableColumnConstraint.update({ where: { id }, data });
    return res.status(200).json(tableColumnConstraint);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteTableColumnConstraint = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Constraint ID Required" });

  try {
    const existing = await prisma.tableColumnConstraint.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Constraint Not Found" });

    const colsInSchema = await prisma.tableColumn.findMany({
      where: { id: { in: existing.columnIds }, schemaTable: { schemaId: req.schema!.id } },
    });
    if (colsInSchema.length !== existing.columnIds.length) return res.status(404).json({ error: "Constraint Not Found" });


    await prisma.tableColumnConstraint.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  createTableColumnConstraint,
  updateTableColumnConstraint,
  deleteTableColumnConstraint,
};
