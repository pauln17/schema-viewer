import { prisma } from "../lib/prisma";
import type { ConstraintType } from "../generated/prisma/client";

const createTableColumnConstraint = async (
  schemaId: string,
  data: { type: ConstraintType; expression?: string; columnIds: string[]; referencedColumnIds: string[]; onDelete?: string; onUpdate?: string }
) => {
  const { type, expression, columnIds, referencedColumnIds, onDelete, onUpdate } = data;

  // Reject Invalid Column IDs or Not in Authorized Schema
  const colsInSchema = await prisma.tableColumn.findMany({
    where: { id: { in: columnIds }, schemaTable: { schemaId } },
  });
  if (colsInSchema.length !== columnIds.length) throw { statusCode: 400, error: "Invalid Column IDs" };

  // Reject if Columns Belong to Different Tables
  const uniqueTableIds = new Set(colsInSchema.map((c) => c.schemaTableId));
  if (uniqueTableIds.size > 1) throw { statusCode: 400, error: "All Columns Must Belong to the Same Table" };

  // FOREIGN_KEY: Validate Referenced Columns Exist in Schema (and Optionally Different Table from Source)
  if (type === "FOREIGN_KEY") {
    const refColsInSchema = await prisma.tableColumn.findMany({
      where: { id: { in: referencedColumnIds }, schemaTable: { schemaId } },
    });
    if (refColsInSchema.length !== referencedColumnIds.length) throw { statusCode: 400, error: "Invalid Referenced Column IDs" };
  }

  return prisma.tableColumnConstraint.create({
    data: {
      type,
      ...(expression != null && expression !== "" && { expression }),
      columnIds,
      referencedColumnIds: type === "FOREIGN_KEY" ? referencedColumnIds : [],
      ...(type === "FOREIGN_KEY" && onDelete != null && { onDelete }),
      ...(type === "FOREIGN_KEY" && onUpdate != null && { onUpdate }),
    },
  });
};

const updateTableColumnConstraint = async (
  schemaId: string,
  id: string,
  data: { type?: ConstraintType; expression?: string }
) => {
  const existing = await prisma.tableColumnConstraint.findUnique({ where: { id } });
  if (!existing) throw { statusCode: 404, error: "Constraint Not Found" };

  // Reject Invalid Column IDs or Not in Authorized Schema
  const colsInSchema = await prisma.tableColumn.findMany({
    where: { id: { in: existing.columnIds }, schemaTable: { schemaId } },
  });
  if (colsInSchema.length !== existing.columnIds.length) throw { statusCode: 404, error: "Constraint Not Found" };

  // Reject if Columns Belong to Different Tables
  const uniqueTableIds = new Set(colsInSchema.map((c) => c.schemaTableId));
  if (uniqueTableIds.size > 1) throw { statusCode: 400, error: "All Columns Must Belong to the Same Table" };

  // Re-Check if Expression is Valid for Type
  const effectiveType = (data.type ?? existing.type);
  if (
    (effectiveType === "CHECK" || effectiveType === "DEFAULT") &&
    (data.expression !== undefined ? !data.expression || typeof data.expression !== "string" : !existing.expression)
  ) {
    throw { statusCode: 400, error: "Expression Required for CHECK/DEFAULT" };
  }

  const updateData: { type?: ConstraintType; expression?: string } = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.expression !== undefined) updateData.expression = data.expression;
  return prisma.tableColumnConstraint.update({ where: { id }, data: updateData });
};

const deleteTableColumnConstraint = async (schemaId: string, id: string) => {
  const existing = await prisma.tableColumnConstraint.findUnique({ where: { id } });
  if (!existing) throw { statusCode: 404, error: "Constraint Not Found" };

  const colsInSchema = await prisma.tableColumn.findMany({
    where: { id: { in: existing.columnIds }, schemaTable: { schemaId } },
  });
  if (colsInSchema.length !== existing.columnIds.length) throw { statusCode: 404, error: "Constraint Not Found" };

  await prisma.tableColumnConstraint.delete({ where: { id } });
};

export {
  createTableColumnConstraint,
  updateTableColumnConstraint,
  deleteTableColumnConstraint,
};
