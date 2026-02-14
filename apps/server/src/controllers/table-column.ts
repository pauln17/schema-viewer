import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const createColumn = async (req: Request, res: Response) => {
    const schemaTableId = req.body.schemaTableId;
    if (!schemaTableId || typeof schemaTableId !== "string") return res.status(400).json({ error: "Schema Table ID Required" });

    const { name, dataType, order } = req.body;

    if (!name) return res.status(400).json({ error: "Name Required" });
    if (!dataType) return res.status(400).json({ error: "Data Type Required" });
    if (order === undefined || order === null) return res.status(400).json({ error: "Order Required" });

    try {
        const table = await prisma.schemaTable.findFirst({ where: { id: schemaTableId, schemaId: req.schema!.id } });
        if (!table) return res.status(404).json({ error: "Schema Table Not Found" });

        const column = await prisma.tableColumn.create({
            data: { name, dataType, order: Number(order), schemaTableId } as { name: string; dataType: string; order: number; schemaTableId: string },
        });

        await prisma.schemaTable.update({
            where: { id: schemaTableId },
            data: { tableColumns: { connect: { id: column.id } } },
        });

        return res.status(201).json(column);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateColumn = async (req: Request, res: Response) => { };

const deleteColumn = async (req: Request, res: Response) => { };

export { createColumn, updateColumn, deleteColumn };
