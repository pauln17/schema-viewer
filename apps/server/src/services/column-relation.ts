import { prisma } from "../lib/prisma";

const createColumnRelation = async (
  schemaId: string,
  sourceColumnId: string,
  targetColumnId: string,
  data: { onDelete?: string; onUpdate?: string } = {}
) => {
  const sourceColumn = await prisma.tableColumn.findFirst({
    where: { id: sourceColumnId, schemaTable: { schemaId } },
  });
  if (!sourceColumn) throw { statusCode: 404, error: "Source Column Not Found" };
  const targetColumn = await prisma.tableColumn.findFirst({
    where: { id: targetColumnId, schemaTable: { schemaId } },
  });
  if (!targetColumn) throw { statusCode: 404, error: "Target Column Not Found" };

  const filtered = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
  return prisma.columnRelation.create({
    data: { sourceColumnId, targetColumnId, ...filtered },
  });
};

const updateColumnRelation = async (
  schemaId: string,
  id: string,
  data: { onDelete?: string; onUpdate?: string }
) => {
  const existing = await prisma.columnRelation.findFirst({
    where: {
      id,
      OR: [
        { sourceColumn: { schemaTable: { schemaId } } },
        { targetColumn: { schemaTable: { schemaId } } },
      ],
    },
  });
  if (!existing) throw { statusCode: 404, error: "Column Relation Not Found" };

  return prisma.columnRelation.update({ where: { id }, data });
};

const deleteColumnRelation = async (schemaId: string, id: string) => {
  const existing = await prisma.columnRelation.findFirst({
    where: {
      id,
      OR: [
        { sourceColumn: { schemaTable: { schemaId } } },
        { targetColumn: { schemaTable: { schemaId } } },
      ],
    },
  });
  if (!existing) throw { statusCode: 404, error: "Column Relation Not Found" };

  await prisma.columnRelation.delete({ where: { id } });
};

export { createColumnRelation, updateColumnRelation, deleteColumnRelation };
