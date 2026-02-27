import { Request, Response } from "express";
import { handleError } from "../lib/handleError";
import { z } from "zod";
import * as schemaService from "../services/schema";

// Admin/internal use only. Returns all schemas in the system.
const getAllSchemas = async (req: Request, res: Response) => {
  try {
    const schemas = await schemaService.getAllSchemas();
    return res.status(200).json(schemas);
  } catch (error) {
    return handleError(error, res);
  }
};

// Backend infers userId from req.user — never trust client.
const getSchemaById = async (req: Request, res: Response) => {
  const idRaw = req.params.id;
  const idResult = z.uuid().safeParse(idRaw);
  if (!idResult.success) return res.status(400).json({ error: "Schema ID Required" });
  const id = idResult.data;

  try {
    const schema = await schemaService.getSchemaById(id);
    return res.status(200).json(schema);
  } catch (error) {
    return handleError(error, res);
  }
};

// User-facing: schemas the current user can access (owned + shared).
// Backend infers userId from req.user (set by authMiddleware) — never trust client for access filtering.
const getAccessibleSchemas = async (req: Request, res: Response) => {
  try {
    const schemas = await schemaService.getAccessibleSchemas(req.user!.id);
    return res.status(200).json(schemas);
  } catch (error) {
    return handleError(error, res);
  }
};

const createSchema = async (req: Request, res: Response) => {
  const nameResult = z.string().min(1).max(15).safeParse(req.body.name);
  if (!nameResult.success) return res.status(400).json({ error: nameResult.error.message });
  const name = nameResult.data;

  try {
    const schema = await schemaService.createSchema(name, req.user!.id);
    return res.status(201).json(schema);
  } catch (error) {
    return handleError(error, res);
  }
};

const updateSchema = async (req: Request, res: Response) => {
  const idRaw = req.params.id;
  const idResult = z.uuid().safeParse(idRaw);
  if (!idResult.success) return res.status(400).json({ error: "Schema ID Required" });
  const id = idResult.data;

  const nameResult = z.string().min(1).max(15).safeParse(req.body.name);
  if (!nameResult.success) return res.status(400).json({ error: nameResult.error.message });
  const name = nameResult.data;

  try {
    const schema = await schemaService.updateSchema(id, name);
    return res.status(200).json(schema);
  } catch (error) {
    return handleError(error, res);
  }
};

const deleteSchema = async (req: Request, res: Response) => {
  const idRaw = req.params.id;
  const idResult = z.uuid().safeParse(idRaw);
  if (!idResult.success) return res.status(400).json({ error: "Schema ID Required" });
  const id = idResult.data;

  try {
    await schemaService.deleteSchema(id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

export {
  getAllSchemas,
  getAccessibleSchemas,
  getSchemaById,
  createSchema,
  updateSchema,
  deleteSchema,
};
