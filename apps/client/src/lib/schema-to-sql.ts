import { Schema } from "@/types/schema";

/** Normalize Identifier for PostgreSQL: Lowercase, No Spaces, Only A-Z 0-9 _ - */
export const normalizeIdentifier = (s: string): string =>
    s.toLowerCase().replace(/\s/g, "").replace(/[^a-z0-9_-]/g, "");

// Format Default Expression Values for PostgreSQL
const SQL_DEFAULT_EXPRS = new Set(["current_timestamp", "current_date", "current_time", "localtimestamp", "localtime"]);
const formatDefault = (v: string): string => {
    if (/^-?\d+(\.\d+)?$/.test(v)) return `DEFAULT ${v}`;
    if (/^(true|false)$/i.test(v)) return `DEFAULT ${v.toLowerCase()}`;
    if (/^[a-z_][a-z0-9_]*\s*\(\)$/i.test(v)) return `DEFAULT ${v.replace(/\s/g, "")}`;
    if (SQL_DEFAULT_EXPRS.has(v.toLowerCase())) return `DEFAULT ${v}`;
    return `DEFAULT '${v}'`;
};

// Schema -> Dialect Specific SQLs
const schemaToSql = (schema: Schema, dialect: string): string => {
    switch (dialect) {
        case "postgres":
            return toPostgresSql(schema);
        default:
            throw new Error(`Unsupported Dialect: ${dialect}`);
    }
};

const toPostgresSql = (schema: Schema): string => {
    const tablesSql: string = (schema.definition?.tables ?? []).map((table) => {
        const columns = table.columns.map((c) => {
            const column: string[] = [c.name];
            if (c.type) column.push(c.type);
            if (c.primaryKey && table.keys?.length === 1) column.push("PRIMARY KEY");
            if (c.unique) column.push("UNIQUE");
            if (c.notNull) column.push("NOT NULL");
            if (c.default != null) column.push(formatDefault(String(c.default)));
            if (c.references != null) column.push(`REFERENCES ${c.references.referencedTable}(${c.references.referencedColumn})`);
            return column.join(" ");
        }).join(",\n");

        const primaryKeys = table.keys?.length > 1 ? `\nPRIMARY KEY (${table.keys.join(", ")}),` : '';
        const checks = (table.checks ?? []).map((c) => `CHECK (${c})`).join(",\n");

        const body = `\n${columns}, ${primaryKeys} ${checks.length > 0 ? `\n${checks}` : ''}\n`.replace(/,\s*\n\s*$/, "\n");
        return `CREATE TABLE ${table.name} (${body});`;
    }).join("\n\n");

    const indexesSql: string = (schema.definition?.tables ?? [])
        .map((table) =>
            table.indexes.map((i) => `CREATE INDEX ${i.name} ON ${table.name} (${i.indexedColumn});`).join("\n")
        )
        .filter((block) => block !== "")
        .join("\n\n");

    const enumsSql: string = (schema.definition?.enums ?? []).map((e) => {
        const enumOptions = e.options.map((o) => `'${o}'`).join(", ");
        return `CREATE TYPE ${e.name} AS ENUM (${enumOptions});`;
    }).join("\n");

    const sql = [enumsSql, tablesSql, indexesSql].filter((s) => s.length > 0);
    return sql.join("\n\n");
};

const importSql = (schema: Schema, dialect: string): void => {
    const fileName = `${schema.name.toLowerCase().trim().split(/\s+/).join("-")}-${dialect}.sql`;
    const sql = schemaToSql(schema, dialect);

    const a = document.createElement("a");
    a.href = `data:text/sql;charset=utf-8,${encodeURIComponent(sql)}`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

export { schemaToSql, importSql };