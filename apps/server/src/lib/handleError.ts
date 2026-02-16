import { Response } from "express";

export const handleError = (error: unknown, res: Response) => {
    if (error && typeof error === "object" && "statusCode" in error && "error" in error) {
        return res.status((error as { statusCode: number }).statusCode).json({ error: (error as { error: string }).error });
    }

    return res.status(500).json({ error: "Internal Server Error" });
};