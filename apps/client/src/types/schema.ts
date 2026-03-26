export interface Reference {
  localColumns: string[]
  referencedTable: string;
  referencedColumns: string[];
}

export interface TablePosition {
  x: number;
  y: number;
}

export interface SchemaDefinition {
  enums: Enum[];
  tables: Table[];
}

export interface Column {
  name: string;
  type: string;
  primaryKey?: boolean;
  notNull?: boolean;
  unique?: boolean;
  default?: string | number | boolean;
}

export interface Enum {
  name: string;
  options: string[];
}

export interface Index {
  indexedColumns: string[];
  name: string;
}

export interface Table {
  name: string;
  position?: TablePosition;
  columns: Column[];
  indexes: Index[];
  keys: string[];
  checks: string[];
  references: Reference[];
}

export interface Schema {
  name: string;
  definition: SchemaDefinition;
}
