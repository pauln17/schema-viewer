import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const createTableIndex = async (req: Request, res: Response) => {
    const columnId = req.params.columnId;
    if (!columnId || typeof columnId !== "string") return res.status(400).json({ error: "Column ID Required" });
    try {
        const column = await prisma.tableColumn.findFirst({ where: { id: columnId, schemaTableId: req.schema!.id } });
        if (!column) return res.status(404).json({ error: "Column Not Found" });

        const tableIndex = await prisma.tableIndex.create({
            data: { tableColumnId: columnId, schemaTableId: column.schemaTableId },
        });
        return res.status(200).json(tableIndex);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const deleteTableIndex = async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "ID Required" });
    try {
        const tableIndex = await prisma.tableIndex.delete({ where: { id } });
        return res.status(200).json(tableIndex);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export { createTableIndex, deleteTableIndex };
