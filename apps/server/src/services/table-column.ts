import { prisma } from "../lib/prisma";
import type { DataType } from "../generated/prisma/client";

const createColumn = async (
  schemaId: string,
  schemaTableId: string,
  data: { name: string; dataType: string; order: number }
) => {


  const schemaTable = await prisma.schemaTable.findFirst({
    where: { id: schemaTableId, schemaId: schemaId },
  });
  if (!schemaTable) throw { statusCode: 404, error: "Schema Table Not Found" };

  return prisma.tableColumn.create({
    data: { ...data, schemaTableId },
  });
};

const updateColumn = async (
  schemaId: string,
  id: string,
  data: { name?: string; dataType?: DataType; order?: number }
) => {
  const existing = await prisma.tableColumn.findFirst({
    where: { id, schemaTable: { schemaId } },
  });
  if (!existing) throw { statusCode: 404, error: "Table Column Not Found" };

  return prisma.tableColumn.update({ where: { id }, data });
};

const deleteColumn = async (schemaId: string, id: string) => {
  const existing = await prisma.tableColumn.findFirst({
    where: { id, schemaTable: { schemaId } },
  });
  if (!existing) throw { statusCode: 404, error: "Table Column Not Found" };

  await prisma.tableColumn.delete({ where: { id } });
};

export { createColumn, updateColumn, deleteColumn };
