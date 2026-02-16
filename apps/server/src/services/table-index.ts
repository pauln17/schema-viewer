import { prisma } from "../lib/prisma";

const createTableIndex = async (schemaId: string, tableColumnId: string) => {
  const column = await prisma.tableColumn.findFirst({
    where: { id: tableColumnId, schemaTable: { schemaId } },
  });
  if (!column) throw { statusCode: 404, error: "Table Column Not Found" };

  return prisma.tableIndex.create({
    data: { tableColumnId },
  });
};

const deleteTableIndex = async (schemaId: string, id: string) => {
  const existing = await prisma.tableIndex.findFirst({
    where: { id, tableColumn: { schemaTable: { schemaId } } },
  });
  if (!existing) throw { statusCode: 404, error: "Table Index Not Found" };

  await prisma.tableIndex.delete({ where: { id } });
};

export { createTableIndex, deleteTableIndex };
