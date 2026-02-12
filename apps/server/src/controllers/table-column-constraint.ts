import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const createTableColumnConstraint = async (req: Request, res: Response) => {};

const updateTableColumnConstraint = async (req: Request, res: Response) => {};

const deleteTableColumnConstraint = async (req: Request, res: Response) => {};

export {
  createTableColumnConstraint,
  updateTableColumnConstraint,
  deleteTableColumnConstraint,
};
