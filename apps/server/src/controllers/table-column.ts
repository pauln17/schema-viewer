import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const createColumn = async (req: Request, res: Response) => {
    const { schemaTableId, name, dataType, order } = req.body;
    if (!schemaTableId || typeof schemaTableId !== "string") return res.status(400).json({ error: "Schema Table ID Required" });

    try {
        const schemaTable = await prisma.schemaTable.findFirst({
            where: { id: schemaTableId, schemaId: req.schema!.id },
        });
        if (!schemaTable) return res.status(404).json({ error: "Schema Table Not Found" });

        const column = await prisma.tableColumn.create({
            data: { name, dataType, order, schemaTableId },
        });
        return res.status(201).json(column);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateColumn = async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "Column ID Required" });
    const { name, dataType, order } = req.body;
    const data = Object.fromEntries(Object.entries({ name, dataType, order }).filter(([_, value]) => value !== undefined));

    try {
        const existing = await prisma.tableColumn.findFirst({
            where: { id, schemaTable: { schemaId: req.schema!.id } },
        });
        if (!existing) return res.status(404).json({ error: "Column Not Found" });

        const column = await prisma.tableColumn.update({ where: { id }, data });
        return res.status(200).json(column);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const deleteColumn = async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "Column ID Required" });

    try {
        const existing = await prisma.tableColumn.findFirst({
            where: { id, schemaTable: { schemaId: req.schema!.id } },
        });
        if (!existing) return res.status(404).json({ error: "Column Not Found" });

        await prisma.tableColumn.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export { createColumn, updateColumn, deleteColumn };
