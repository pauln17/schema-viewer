import { prisma } from "../lib/prisma";

const lookupUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export { lookupUserByEmail };
