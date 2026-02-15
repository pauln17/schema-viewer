import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const createTableIndex = async (req: Request, res: Response) => {
    const { tableColumnId } = req.body;
    if (!tableColumnId || typeof tableColumnId !== "string") return res.status(400).json({ error: "Table Column ID Required" });

    try {
        const column = await prisma.tableColumn.findFirst({
            where: { id: tableColumnId, schemaTable: { schemaId: req.schema!.id } },
        });
        if (!column) return res.status(404).json({ error: "Table Column Not Found" });

        const tableIndex = await prisma.tableIndex.create({
            data: { tableColumnId },
        });
        return res.status(201).json(tableIndex);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const deleteTableIndex = async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "Table Index ID Required" });

    try {
        const existing = await prisma.tableIndex.findFirst({
            where: { id, tableColumn: { schemaTable: { schemaId: req.schema!.id } } },
        });
        if (!existing) return res.status(404).json({ error: "Table Index Not Found" });

        await prisma.tableIndex.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export { createTableIndex, deleteTableIndex };
