import { Request, Response } from "express";
import { prisma } from "src/lib/prisma";

const lookupUserByEmail = async (req: Request, res: Response) => {
    const email = req.params.email;
    if (!email || typeof email !== "string") return res.status(400).json({ error: "Email Required" });
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export { lookupUserByEmail };
