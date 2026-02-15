import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ConstraintType } from "src/generated/prisma/client";

const createTableColumnConstraint = async (req: Request, res: Response) => {
  const { columnId, type, expression } = req.body;
  if (!columnId || typeof columnId !== "string") return res.status(400).json({ error: "Column ID Required" });
  if (!type || typeof type !== "string") return res.status(400).json({ error: "Type Required" });
  if (!expression || typeof expression !== "string") return res.status(400).json({ error: "Expression Required" });

  try {
    const column = await prisma.tableColumn.findFirst({ where: { id: columnId, schemaTableId: req.schema!.id } });
    if (!column) return res.status(404).json({ error: "Column Not Found" });

    const tableColumnConstraint = await prisma.tableColumnConstraint.create({
      data: { tableColumnId: columnId, schemaTableId: column.schemaTableId, type: type as ConstraintType, expression },
    });

    await prisma.schemaTable.update({
      where: { id: column.schemaTableId },
      data: { tableColumnConstraints: { connect: { id: tableColumnConstraint.id } } },
    });
    await prisma.tableColumn.update({
      where: { id: columnId },
      data: { tableColumnConstraints: { connect: { id: tableColumnConstraint.id } } },
    });

    return res.status(200).json(tableColumnConstraint);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateTableColumnConstraint = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Constraint ID Required" });

  const { columnId, type, expression } = req.body;
  const data = Object.fromEntries(Object.entries({ columnId, type, expression }).filter(([_, value]) => value !== undefined));

  try {
    const column = await prisma.tableColumn.findFirst({ where: { id: columnId, schemaTableId: req.schema!.id } });
    if (!column) return res.status(404).json({ error: "Column Not Found" });

    const tableColumnConstraint = await prisma.tableColumnConstraint.update({
      where: { id },
      data,
    });
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
    const tableColumnConstraint = await prisma.tableColumnConstraint.delete({ where: { id } });
    return res.status(200).json(tableColumnConstraint);
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
