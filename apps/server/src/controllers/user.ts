import { Request, Response } from "express";
import { handleError } from "../lib/handleError";
import * as userService from "../services/user";

const lookupUserByEmail = async (req: Request, res: Response) => {
  const email = req.params.email;
  if (!email || typeof email !== "string") return res.status(400).json({ error: "Email Required" });
  try {
    const user = await userService.lookupUserByEmail(email);
    return res.status(200).json(user);
  } catch (error) {
    return handleError(error, res);
  }
};

export { lookupUserByEmail };
