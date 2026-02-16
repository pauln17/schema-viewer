import { Request, Response } from "express";
import { handleError } from "../lib/handleError";
import * as schemaCollaborationService from "../services/schema-collaboration";

const createSchemaCollaboration = async (req: Request, res: Response) => {
  const { email, role } = req.body;
  if (!email || typeof email !== "string") return res.status(400).json({ error: "Collaborator Email Required" });
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
  const collaboratorId = req.params.id;
  if (!collaboratorId || Array.isArray(collaboratorId))
    return res.status(400).json({ error: "Schema Collaboration ID Required" });
  const { role } = req.body;
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
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: "Schema Collaboration ID Required" });
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
