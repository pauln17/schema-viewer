import { prisma } from "../lib/prisma";
import type { CollaboratorRole } from "../generated/prisma/client";

const createSchemaCollaboration = async (
  schemaId: string,
  userId: string,
  email: string,
  role?: CollaboratorRole
) => {
  const collaborator = await prisma.user.findUnique({ where: { email } });
  if (!collaborator) throw { statusCode: 404, error: "Collaborator Not Found" };
  if (collaborator.id === userId) throw { statusCode: 400, error: "Cannot Collaborate With Self" };

  const existingCollaboration = await prisma.schemaCollaboration.findUnique({
    where: { schemaId_collaboratorId: { schemaId, collaboratorId: collaborator.id } },
  });
  if (existingCollaboration) throw { statusCode: 400, error: "Collaboration Exists" };

  return prisma.schemaCollaboration.create({
    data: { schemaId, collaboratorId: collaborator.id, ...(role !== undefined && { role }) },
  });
};

const updateSchemaCollaboration = async (
  schemaId: string,
  id: string,
  data: { role?: CollaboratorRole }
) => {
  const existing = await prisma.schemaCollaboration.findFirst({
    where: { id, schemaId },
  });
  if (!existing) throw { statusCode: 404, error: "Schema Collaboration Not Found" };

  return prisma.schemaCollaboration.update({
    where: { id },
    data,
  });
};

const deleteSchemaCollaboration = async (schemaId: string, id: string) => {
  const existing = await prisma.schemaCollaboration.findFirst({
    where: { id, schemaId },
  });
  if (!existing) throw { statusCode: 404, error: "Schema Collaboration Not Found" };

  await prisma.schemaCollaboration.delete({ where: { id } });
};

export {
  createSchemaCollaboration,
  updateSchemaCollaboration,
  deleteSchemaCollaboration,
};
