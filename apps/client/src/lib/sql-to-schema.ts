import { Schema, Table, Column, References, Index, Enum } from "@/types/schema";
import { parse, Statement, type DataTypeDef, toSql } from 'pgsql-ast-parser';

const getDataTypeName = (dataType: DataTypeDef): string => {
  if (dataType.kind !== 'array') {
    return `${dataType.name.toString()}${dataType.config ? `(${dataType.config.join(', ')})` : ''}`;
  }
  return `${getDataTypeName(dataType.arrayOf)}[]`;
}

const formatSqlExpr = (s: string): string =>
  s
    .replace(/\b([a-z_][a-z0-9_]*)\s+\(\s*\)/gi, (_, id: string) => `${id}()`)
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim();

// SQL -> Dialect Specific ASTs -> Schema
const sqlToSchema = (sql: string): Schema => {
  const ast: Statement[] = parse(sql);

  const schema: Schema = {
    name: '',
    definition: {
      tables: [],
      enums: [],
    }
  }

  const tables: Table[] = [];
  const indexes: Index[] = [];
  const enums: Enum[] = [];

  console.log(ast);
  ast.map((statement) => {
    if (statement.type === 'create schema') {
      schema.name = statement.name.name
    }
    if (statement.type === 'create enum') {
      const enumName = statement.name.name;
      const options = statement.values.map((v) => v.value);
      const newEnum: Enum = {
        name: enumName,
        options: options,
      }
      enums.push(newEnum);
    } else if (statement.type === 'create table') {
      const newTable: Table = {
        name: statement.name.name,
        columns: [],
        indexes: [],
        keys: [],
        checks: [],
      };
      const columns: Column[] = [];

      const primaryKeysByColumn: string[] = []
      for (const c of statement.constraints ?? []) {
        if (c.type !== 'primary key') continue;
        primaryKeysByColumn.push(...c.columns.map((c) => c.name));
      }

      const outlineRefByColumn = new Map<string, References>();
      for (const c of statement.constraints ?? []) {
        if (c.type !== 'foreign key') continue;
        c.localColumns.forEach((local, i) => {
          const foreignCol = c.foreignColumns[i]?.name;
          if (foreignCol) outlineRefByColumn.set(local.name, { referencedTable: c.foreignTable.name, referencedColumn: foreignCol });
        });
      }

      newTable.checks = (statement.constraints ?? [])
        .filter((c) => c.type === "check")
        .map((c) => formatSqlExpr(toSql.expr(c.expr)));

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
      newTable.keys = primaryKeysByColumn.length > 0 ? primaryKeysByColumn : columns.filter((c) => c.primaryKey).map((c) => c.name);
      newTable.columns.push(...columns);
      tables.push(newTable);
    } else if (statement.type === 'create index') {
      const idxName = statement.expressions.map((e) => toSql.expr(e.expression).toString()).join('_');
      const idxColumns = statement.expressions.map((e) => toSql.expr(e.expression).toString());
      const newIndex: Index = {
        name: idxName,
        indexedColumns: idxColumns,
      }
      indexes.push(newIndex);
    }
    schema.definition.tables = tables;
    schema.definition.enums = enums;

  });

  return schema;
};

export { sqlToSchema }