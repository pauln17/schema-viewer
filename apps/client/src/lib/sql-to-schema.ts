import { Schema, Table, Column, References } from "@/types/schema";
import { parse, Statement, type DataTypeDef, toSql } from 'pgsql-ast-parser';


const getDataTypeName = (dataType: DataTypeDef): string => {
  if (dataType.kind !== 'array') {
    return `${dataType.name.toString()}${dataType.config ? `(${dataType.config.join(', ')})` : ''}`;
  }
  return `${getDataTypeName(dataType.arrayOf)}[]`;
}

// SQL -> Dialect Specific ASTs -> Schema
const sqlToSchema = (sql: string): Schema => {
  const ast: Statement[] = parse(sql);

  const tables: Table[] = [];
  // const indexes: Index[] = [];
  // const enums: Enum[] = [];

  ast.map((statement) => {
    if (statement.type === 'create table') {
      const table: Table = {
        name: statement.name.name,
        columns: [],
        indexes: [],
        keys: [],
        checks: [],
      };
      const columns: Column[] = [];

      const outlineRefByColumn = new Map<string, References>();
      for (const c of statement.constraints ?? []) {
        if (c.type !== 'foreign key') continue;
        c.localColumns.forEach((local, i) => {
          const foreignCol = c.foreignColumns[i]?.name;
          if (foreignCol) outlineRefByColumn.set(local.name, { referencedTable: c.foreignTable.name, referencedColumn: foreignCol });
        });
      }

      const primaryKeysByColumn: string[] = []
      for (const c of statement.constraints ?? []) {
        if (c.type !== 'primary key') continue;
        primaryKeysByColumn.push(...c.columns.map((c) => c.name));
      }

      statement.columns.forEach((astCol) => {
        if (astCol.kind !== 'column') return;
        const constraints = astCol.constraints

        const primaryKey = (primaryKeysByColumn.includes(astCol.name.name) || constraints?.some((c) => c.type === 'primary key')) ? true : false;
        const defaultConstraint = constraints?.find((c) => c.type === 'default');
        const defaultStr = defaultConstraint ? toSql.expr(defaultConstraint.default) : undefined;

        const inlineRefConstraint = constraints?.find((c) => c.type === 'reference');
        const inlineReference = inlineRefConstraint
          ? { referencedTable: inlineRefConstraint.foreignTable.name, referencedColumn: inlineRefConstraint.foreignColumns[0]?.name }
          : undefined;

        const ref = outlineRefByColumn.get(astCol.name.name) ?? inlineReference;
        const references = ref?.referencedTable && ref?.referencedColumn ? ref : undefined;

        const column: Column = {
          name: astCol.name.name,
          type: getDataTypeName(astCol.dataType),
          primaryKey: primaryKey,
          ...(constraints && {
            unique: constraints.some((c) => c.type === 'unique') ? true : false,
            notNull: constraints.some((c) => c.type === 'not null') ? true : false,
            ...(defaultStr && { default: defaultStr }),
            ...(references && { references }),
          })
        };
        columns.push(column);
      });
      table.keys = primaryKeysByColumn.length > 0 ? primaryKeysByColumn : columns.filter((c) => c.primaryKey).map((c) => c.name);
      table.columns.push(...columns);
      tables.push(table);
    }
  })

  return {
    name: "Example Schema",
    definition: {
      tables: [],
      enums: [],
    },
  };
};

const sqlExample = `
  CREATE TABLE teams (
    org_id INT NOT NULL,
    team_code VARCHAR(50) NOT NULL,
    PRIMARY KEY (org_id, team_code)
  );

  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID,
    org_id INT NOT NULL,
    team_code VARCHAR(50) NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES users(id),
    FOREIGN KEY (org_id, team_code) REFERENCES teams(org_id, team_code)
  );
`;


export { sqlToSchema, sqlExample }