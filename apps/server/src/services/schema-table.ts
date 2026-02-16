import { prisma } from "../lib/prisma";

const createSchemaTable = async (schemaId: string, name: string) => {
  return prisma.schemaTable.create({
    data: { name, schemaId },
  });
};

const updateSchemaTable = async (
  schemaId: string,
  id: string,
  data: { name?: string; positionX?: number; positionY?: number }
) => {
  const existing = await prisma.schemaTable.findFirst({
    where: { id, schemaId },
  });
  if (!existing) throw { statusCode: 404, error: "Schema Table Not Found" };

  return prisma.schemaTable.update({
    where: { id, schemaId },
    data,
  });
};

const deleteSchemaTable = async (schemaId: string, id: string) => {
  const existing = await prisma.schemaTable.findFirst({
    where: { id, schemaId },
  });
  if (!existing) throw { statusCode: 404, error: "Schema Table Not Found" };

  await prisma.schemaTable.delete({ where: { id, schemaId } });
};

export { createSchemaTable, updateSchemaTable, deleteSchemaTable };
