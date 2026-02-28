import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma";

const TOKEN_BYTES = 32;

export const generateToken = (): string => {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export const hashToken = (token: string): string => {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export const verifyToken = async (token: string): Promise<
  | { ok: true; schemaId: string }
  | { ok: false; status: number; message: string }
> => {
  const tokenHash = hashToken(token);
  const result = await prisma.schemaToken.findUnique({
    where: { tokenHash },
    select: { schemaId: true, expiresAt: true },
  });
  if (!result) return { ok: false, status: 401, message: "Invalid Token" };
  if (result.expiresAt && result.expiresAt < new Date())
    return { ok: false, status: 401, message: "Token Expired" };
  return { ok: true, schemaId: result.schemaId };
}
