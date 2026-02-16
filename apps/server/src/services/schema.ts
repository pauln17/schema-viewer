import { prisma } from "../lib/prisma";

// Admin/internal use only. Returns all schemas in the system.
const getAllSchemas = async () => {
  return prisma.schema.findMany();
};

// Backend infers userId from req.user — never trust client.
const getSchemaById = async (id: string) => {
  const schema = await prisma.schema.findUnique({
    where: { id },
    include: {
      schemaTables: true,
      schemaCollaborations: true,
    },
  });
  if (!schema) throw { statusCode: 404, error: "Schema Not Found" };
  return schema;
};

// User-facing: schemas the current user can access (owned + shared).
// Backend infers userId from req.user (set by authMiddleware) — never trust client for access filtering.
const getAccessibleSchemas = async (userId: string) => {
  return prisma.schema.findMany({
    where: {
      OR: [
        { userId },
        { schemaCollaborations: { some: { collaboratorId: userId } } },
      ],
    },
    include: {
      schemaTables: true,
      schemaCollaborations: true,
    },
  });
};

const createSchema = async (name: string, userId: string) => {
  return prisma.schema.create({
    data: { name, userId },
  });
};

const updateSchema = async (id: string, name: string) => {
  return prisma.schema.update({
    where: { id },
    data: { name },
  });
};

const deleteSchema = async (id: string) => {
  const existing = await prisma.schema.findUnique({ where: { id } });
  if (!existing) throw { statusCode: 404, error: "Schema Not Found" };

  await prisma.schema.delete({
    where: { id },
  });
};

export {
  getAllSchemas,
  getAccessibleSchemas,
  getSchemaById,
  createSchema,
  updateSchema,
  deleteSchema,
};
