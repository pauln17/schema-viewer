import { Schema } from "@/types/schema";

export const normalizeIdentifier = (s: string): string =>
    s.toLowerCase().replace(/\s/g, "").replace(/[^a-z0-9_-]/g, "");

const SQL_KEYWORDS = new Set(["current_timestamp", "current_date", "current_time", "localtimestamp", "localtime"]);

const stripOuterParens = (s: string): string => {
    let v = s.trim();
    while (v.startsWith("(") && v.endsWith(")")) {
        const inner = v.slice(1, -1).trim();
        let depth = 0, balanced = true;
        for (const ch of inner) {
            if (ch === "(") depth++;
            else if (ch === ")") { depth--; if (depth < 0) { balanced = false; break; } }
        }
        if (!balanced || depth !== 0) break;
        v = inner;
    }
    return v.replace(/\b([a-z_][a-z0-9_]*)\s+\(\s*\)/gi, (_, id: string) => `${id}()`).trim();
};

const formatDefault = (raw: string | number | boolean | undefined): string | null => {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "boolean") return `DEFAULT ${raw}`;
    if (typeof raw === "number") return `DEFAULT ${raw}`;

    const v = stripOuterParens(String(raw));
    if (!v || /^null$/i.test(v)) return null;
    if (/^-?\d+(\.\d+)?$/.test(v)) return `DEFAULT ${v}`;
    if (/^(true|false)$/i.test(v)) return `DEFAULT ${v.toLowerCase()}`;
    if (SQL_KEYWORDS.has(v.toLowerCase())) return `DEFAULT ${v}`;
    if (/^[a-z_][a-z0-9_]*\([\s\S]*\)$/i.test(v)) return `DEFAULT ${v}`;
    if (/^'(?:[^']|'')*'$/.test(v)) return `DEFAULT ${v}`;
    if (v.includes("::")) return `DEFAULT ${v}`;
    return `DEFAULT '${v.replace(/'/g, "''")}'`;
};

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
        const singleFks = new Map<string, { referencedTable: string; referencedColumn: string }>();
        const compositeFks: string[] = [];

        for (const ref of table.references ?? []) {
            if (ref.localColumns.length === 1 && ref.referencedColumns.length === 1) {
                singleFks.set(ref.localColumns[0], {
                    referencedTable: ref.referencedTable,
                    referencedColumn: ref.referencedColumns[0],
                });
            } else {
                compositeFks.push(
                    `FOREIGN KEY (${ref.localColumns.join(", ")}) REFERENCES ${ref.referencedTable}(${ref.referencedColumns.join(", ")})`
                );
            }
        }

        const columns = table.columns.map((c) => {
            const parts: string[] = [c.name];
            if (c.type) parts.push(c.type);
            if (c.primaryKey && table.keys?.length === 1) parts.push("PRIMARY KEY");
            if (c.unique) parts.push("UNIQUE");
            if (c.notNull) parts.push("NOT NULL");
            const def = formatDefault(c.default);
            if (def) parts.push(def);
            const fk = singleFks.get(c.name);
            if (fk) parts.push(`REFERENCES ${fk.referencedTable}(${fk.referencedColumn})`);
            return parts.join(" ");
        }).join(",\n");

        const primaryKeys = table.keys?.length > 1 ? `\nPRIMARY KEY (${table.keys.join(", ")}),` : '';
        const checks = (table.checks ?? []).map((c) => `CHECK (${c})`).join(",\n");
        const fks = compositeFks.join(",\n");

        const constraints = [primaryKeys, checks, fks].filter((s) => s.length > 0).join("\n");
        const body = `\n${columns}, ${constraints.length > 0 ? `\n${constraints}` : ''}\n`.replace(/,\s*\n\s*$/, "\n");
        return `CREATE TABLE ${table.name} (${body});`;
    }).join("\n\n");

    const indexesSql: string = (schema.definition?.tables ?? [])
        .map((table) =>
            table.indexes.map((i) => `CREATE INDEX ${i.name} ON ${table.name} (${i.indexedColumns.join(", ")});`).join("\n")
        )
        .filter((block) => block !== "")
        .join("\n\n");

    const enumsSql: string = (schema.definition?.enums ?? []).map((e) => {
        const enumOptions = (e.options ?? []).map((o) => `'${o}'`).join(", ");
        return `CREATE TYPE ${e.name} AS ENUM (${enumOptions});`;
    }).join("\n");

    const sql = [enumsSql, tablesSql, indexesSql].filter((s) => s.length > 0);
    return sql.join("\n\n");
};

export { schemaToSql };
