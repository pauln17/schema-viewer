export interface Column {
    name: string;
    type: string;
    primaryKey?: boolean;
    notNull?: boolean;
    unique?: boolean;
    default?: string;
    references?: { table: string; column: string };
}

export interface Enum {
    name: string;
    values: string[];
}

export interface Table {
    name: string;
    position: { x: number; y: number };
    columns: Column[];
}

export interface Index {
    table: string;
    columns: string[];
    name: string;
}

export interface Schema {
    id: string;
    name: string;
    definition: {
        tables: Table[];
        enums: Enum[];
        indexes?: Index[];
    };
    createdAt: Date;
    updatedAt: Date;
}