import { Request, Response } from "express";
import { handleError } from "../lib/handleError";
import { z } from "zod";
import * as userService from "../services/user";

const lookupUserByEmail = async (req: Request, res: Response) => {
  const emailResult = z.email().safeParse(req.params.email);
  if (!emailResult.success) return res.status(400).json({ error: "Invalid Email" });
  const email = emailResult.data;

  try {
    const user = await userService.lookupUserByEmail(email);
    return res.status(200).json(user);
  } catch (error) {
    return handleError(error, res);
  }
};

export { lookupUserByEmail };
