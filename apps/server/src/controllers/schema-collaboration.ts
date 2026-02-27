import { Request, Response } from "express";
import { handleError } from "../lib/handleError";
import { z } from "zod";
import { CollaboratorRole } from "../generated/prisma/client";
import * as schemaCollaborationService from "../services/schema-collaboration";


const createSchemaCollaboration = async (req: Request, res: Response) => {
  const collaborationObject = z.object({
    email: z.email({ message: "Invalid Email" }),
    role: z.enum(Object.values(CollaboratorRole)).default(CollaboratorRole.VIEWER),
  });

  const result = collaborationObject.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.message });
  const { email, role } = result.data;

  try {
    const schemaCollaboration = await schemaCollaborationService.createSchemaCollaboration(
      req.schema!.id,
      req.user!.id,
      email,
      role
    );
    return res.status(201).json(schemaCollaboration);
  } catch (error) {
    return handleError(error, res);
  }
};

const updateSchemaCollaboration = async (req: Request, res: Response) => {
  const collaboratorIdRaw = req.params.id;
  const collaboratorIdResult = z.uuid().safeParse(collaboratorIdRaw);
  if (!collaboratorIdResult.success) return res.status(400).json({ error: "Schema Collaboration ID Required" });
  const collaboratorId = collaboratorIdResult.data;

  const result = z.enum(Object.values(CollaboratorRole)).safeParse(req.body.role);
  if (!result.success) return res.status(400).json({ error: result.error.message });
  const role = result.data;

  try {
    const schemaCollaboration = await schemaCollaborationService.updateSchemaCollaboration(
      req.schema!.id,
      collaboratorId,
      { role }
    );
    return res.status(200).json(schemaCollaboration);
  } catch (error) {
    return handleError(error, res);
  }
};

const deleteSchemaCollaboration = async (req: Request, res: Response) => {
  const idRaw = req.params.id;
  const idResult = z.uuid().safeParse(idRaw);
  if (!idResult.success) return res.status(400).json({ error: "Schema Collaboration ID Required" });
  const id = idResult.data;

  try {
    await schemaCollaborationService.deleteSchemaCollaboration(req.schema!.id, id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

export {
  createSchemaCollaboration,
  updateSchemaCollaboration,
  deleteSchemaCollaboration,
};
