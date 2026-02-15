import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const createColumnRelation = async (req: Request, res: Response) => {
    const { sourceColumnId, targetColumnId } = req.body;
    if (!sourceColumnId || typeof sourceColumnId !== "string") return res.status(400).json({ error: "Source Column Required" });
    if (!targetColumnId || typeof targetColumnId !== "string") return res.status(400).json({ error: "Target Column Required" });

    try {
        const sourceColumn = await prisma.tableColumn.findFirst({
            where: { id: sourceColumnId, schemaTable: { schemaId: req.schema!.id } },
        });
        if (!sourceColumn) return res.status(404).json({ error: "Source Column Not Found" });
        const targetColumn = await prisma.tableColumn.findFirst({
            where: { id: targetColumnId, schemaTable: { schemaId: req.schema!.id } },
        });
        if (!targetColumn) return res.status(404).json({ error: "Target Column Not Found" });

        const { onDelete, onUpdate } = req.body;
        const data = Object.fromEntries(Object.entries({ onDelete, onUpdate }).filter(([_, value]) => value !== undefined));

        const columnRelation = await prisma.columnRelation.create({
            data: { sourceColumnId, targetColumnId, ...data },
        });
        return res.status(201).json(columnRelation);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateColumnRelation = async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "Column Relation ID Required" });
    const { onDelete, onUpdate } = req.body;
    const data = Object.fromEntries(Object.entries({ onDelete, onUpdate }).filter(([_, value]) => value !== undefined));

    try {
        const existing = await prisma.columnRelation.findFirst({
            where: {
                id,
                OR: [
                    { sourceColumn: { schemaTable: { schemaId: req.schema!.id } } },
                    { targetColumn: { schemaTable: { schemaId: req.schema!.id } } },
                ],
            },
        });
        if (!existing) return res.status(404).json({ error: "Column Relation Not Found" });

        const columnRelation = await prisma.columnRelation.update({ where: { id }, data });
        return res.status(200).json(columnRelation);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const deleteColumnRelation = async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "Column Relation ID Required" });

    try {
        const existing = await prisma.columnRelation.findFirst({
            where: {
                id,
                OR: [
                    { sourceColumn: { schemaTable: { schemaId: req.schema!.id } } },
                    { targetColumn: { schemaTable: { schemaId: req.schema!.id } } },
                ],
            },
        });
        if (!existing) return res.status(404).json({ error: "Column Relation Not Found" });

        await prisma.columnRelation.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export { createColumnRelation, updateColumnRelation, deleteColumnRelation };
