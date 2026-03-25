import type { Edge, Node } from "@xyflow/react";

import type { Table } from "@/types/schema";

const getLocalFkColumns = (table: Table): string[] => {
    const names: string[] = [];
    for (const ref of table.references ?? []) {
        names.push(...ref.localColumns);
    }
    return [...new Set(names)];
};

const getReferencedColumns = (tableName: string, tables: Table[]): string[] => {
    const names: string[] = [];
    for (const t of tables) {
        if (t.name === tableName) continue;
        for (const ref of t.references ?? []) {
            if (ref.referencedTable === tableName) {
                names.push(...ref.referencedColumns);
            }
        }
    }
    return [...new Set(names)];
};

export const buildNodes = (tables: Table[]): Node[] => {
    return tables.map((t) => ({
        id: t.name,
        type: "table",
        position: t.position ?? { x: 0, y: 0 },
        data: {
            table: t,
            referencedColumns: getReferencedColumns(t.name, tables),
            localFkColumns: getLocalFkColumns(t),
        },
    }));
};

export const buildEdges = (tables: Table[]): Edge[] => {
    const edges: Edge[] = [];

    const tablesByNames = Object.fromEntries(tables.map((t) => [t.name, t]));
    const tablesByPos = Object.fromEntries(
        tables.map((t) => [t.name, t.position ?? { x: 0, y: 0 }])
    );

    for (const table of tables) {
        for (const ref of table.references ?? []) {
            const tgtTable = tablesByNames[ref.referencedTable];
            if (!tgtTable) continue;

            const srcPos = tablesByPos[table.name];
            const tgtPos = tablesByPos[tgtTable.name];
            const targetIsRight = tgtPos.x > srcPos.x;

            for (let i = 0; i < ref.localColumns.length; i++) {
                const localCol = ref.localColumns[i];
                const foreignCol = ref.referencedColumns[i];
                if (!foreignCol) continue;

                const targetHasColumn = tgtTable.columns.some((c) => c.name === foreignCol);
                if (!targetHasColumn) continue;

                const sourceHandle = targetIsRight
                    ? `${table.name}-${localCol}-source-right`
                    : `${table.name}-${localCol}-source-left`;
                const targetHandle = targetIsRight
                    ? `${tgtTable.name}-${foreignCol}-target-left`
                    : `${tgtTable.name}-${foreignCol}-target-right`;

                edges.push({
                    id: `${table.name}-${tgtTable.name}-${localCol}-${foreignCol}`,
                    source: table.name,
                    target: tgtTable.name,
                    sourceHandle,
                    targetHandle,
                    type: "smoothstep",
                    animated: true,
                    style: { stroke: "#FFFFFF" },
                });
            }
        }
    }
    return edges;
};