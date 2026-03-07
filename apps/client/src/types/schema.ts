export interface Column {
    name: string;
    type: string;
    primaryKey?: boolean;
    notNull?: boolean;
    unique?: boolean;
    default?: string;
    references?: { referencedTable: string; referencedColumn: string };
}

export interface Enum {
    name: string;
    values: string[];
}

export interface Index {
    indexedColumn: string;
    name: string;
}

export interface Table {
    name: string;
    position: { x: number; y: number };
    columns: Column[];
    indexes: Index[];
}

export interface Schema {
    id: string;
    name: string;
    definition: {
        enums: Enum[];
        tables: Table[];
    };
    createdAt: Date;
    updatedAt: Date;
}