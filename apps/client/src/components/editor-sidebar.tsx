import { memo, useRef } from "react";
import type { Enum, Schema, Table } from "@/types/schema";
import { EnumSection } from "./enum-section";
import { TableSection } from "./table-section";
import { importSql } from "@/lib/schema-to-sql";

interface EditorSidebarProps {
  schema: Schema;
  tables: Table[];
  enums: Enum[];
  updateQueryCache: (data: Schema) => void;
  token: string | undefined;
}

interface SidebarFooterProps {
  schema: Schema;
  tables: Table[];
  enums: Enum[];
  token: string | undefined;
}

function SidebarFooter({ schema, tables, enums, token }: SidebarFooterProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const columnCount = tables.reduce((n, t) => n + (t.columns?.length ?? 0), 0);
  return (
    <div className="shrink-0 px-4 py-3 border-t border-white/[0.06] space-y-2">
      <p className="text-[10px] text-neutral-600 text-center">
        {[
          `${tables.length} Table${tables.length !== 1 ? "s" : ""}`,
          `${enums.length} Enum${enums.length !== 1 ? "s" : ""}`,
          ...(tables.length > 0 ? [`${columnCount} Columns`] : []),
        ].join(" · ")}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] text-xs text-neutral-300 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
          onClick={() => {
            if (token) {
              const ok = window.confirm("Importing now will overwrite current schema");
              if (!ok) return;
            }

            inputRef.current?.click();
          }}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 640 640" fill="currentColor">
            <path d="M352 173.3V384c0 17.7-14.3 32-32 32s-32-14.3-32-32V173.3l-41.4 41.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l96-96c12.5 12.5 32.8 12.5 45.3 0l96 96c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0zM320 464c44.2 0 80-35.8 80-80h80c35.3 0 64 28.7 64 64v32c0 35.3-28.7 64-64 64H160c-35.3 0-64-28.7-64-64v-32c0-35.3 28.7-64 64-64h80c0 44.2 35.8 80 80 80m144 24c13.3 0 24-10.7 24-24s-10.7-24-24-24s-24-10.7-24-24s10.7-24 24-24" />
          </svg>
          Import
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".sql"
          hidden
          onChange={() => {
            console.log("Export")
          }}
        />
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] text-xs text-neutral-300 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
          onClick={() => {
            if (tables.length === 0 || enums.length === 0) {
              window.alert("Empty Database");
              return;
            }
            importSql(schema, "postgres");
          }}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 640 640" fill="currentColor">
            <path d="M352 96c0-17.7-14.3-32-32-32s-32 14.3-32 32v210.7l-41.4-41.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8 12.5 45.3 0l96-96c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L352 306.7zM160 384c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64v-32c0-35.3-28.7-64-64-64h-46.9l-56.6 56.6c-31.2 31.2-81.9 31.2-113.1 0L206.9 384zm304 56c13.3 0 24 10.7 24 24s-10.7 24-24 24s-24-10.7-24-24s10.7-24 24-24" />
          </svg>
          Export
        </button>
      </div>
    </div>
  );
}

function EditorSidebar({
  schema,
  tables,
  enums,
  updateQueryCache,
  token,
}: EditorSidebarProps) {
  const updateTables = (updated: Table[]) => {
    if (!schema) return;
    updateQueryCache({
      ...schema,
      definition: { enums, tables: updated },
    });
  };

  const deleteTable = (tableName: string) => {
    updateTables(tables.filter((t) => t.name !== tableName));
  };

  const renameTable = (oldName: string, newName: string) => {
    if (!schema) return;

    const primary = tables.filter((t) => t.name === oldName)
    const other = tables.filter((t) => t.name !== oldName)

    const updatedPrimary = primary.map((t) => t.name === oldName ? {
      ...t,
      name: newName
    } : t)

    const updatedOther = other.map((t) => t.name !== oldName ? {
      ...t,
      columns: t.columns.map((c) => c.references?.referencedTable === oldName ? {
        ...c,
        references: {
          ...c.references,
          referencedTable: newName
        }
      } : c)
    } : t)

    const newTables = [...updatedPrimary, ...updatedOther]

    updateQueryCache({
      ...schema,
      definition: {
        enums,
        tables: newTables
      },
    });
  };

  const renameColumn = (tableName: string, oldName: string, newName: string) => {
    if (!schema) return;

    const primary = tables.filter((t) => t.name === tableName)
    const other = tables.filter((t) => t.name !== tableName)

    const updatedPrimary = primary.map((t) => t.name === tableName ? {
      ...t,
      columns: t.columns.map((c) => c.name === oldName ? { ...c, name: newName } : c)
    } : t)

    const updatedOther = other.map((t) => t.name !== tableName ? {
      ...t,
      columns: t.columns.map((c) => c.references?.referencedColumn === oldName && c.references?.referencedTable === tableName ? {
        ...c,
        references: {
          ...c.references,
          referencedColumn: newName
        }
      } : c)
    } : t)

    const newTables = [...updatedPrimary, ...updatedOther]

    updateQueryCache({
      ...schema,
      definition: {
        enums,
        tables: newTables
      }
    });
  };

  const updateEnums = (updated: Enum[]) => {
    if (!schema) return;
    updateQueryCache({
      ...schema,
      definition: { enums: updated, tables },
    });
  };

  const deleteEnum = (enumName: string) => {
    updateEnums(enums.filter((e) => e.name !== enumName));
  };

  const renameEnum = (oldName: string, newName: string) => {
    if (!schema) return;
    updateQueryCache({
      ...schema,
      definition: {
        enums: enums.map((e) =>
          e.name === oldName ? { ...e, name: newName } : e,
        ),
        tables,
      },
    });
  };

  const renameEnumOption = (enumName: string, oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    if (!schema) return;
    updateQueryCache({
      ...schema,
      definition: {
        enums: enums.map((e) =>
          e.name === enumName
            ? {
              ...e,
              options: (e.options ?? []).map((v) =>
                v === oldName ? trimmed : v,
              ),
            }
            : e,
        ),
        tables,
      },
    });
  };

  const createTable = () => {
    const base = "table";
    let name = base;
    let n = 0;
    while (tables.some((t) => t.name === name)) {
      n += 1;
      name = `${base}_${n}`;
    }
    updateTables([
      ...tables,
      { name, position: { x: 0, y: 0 }, columns: [], indexes: [], keys: [], checks: [] },
    ]);
  };

  const createEnum = () => {
    const base = "enum";
    let name = base;
    let n = 0;
    while (enums.some((e) => e.name === name)) {
      n += 1;
      name = `${base}_${n}`;
    }
    updateEnums([...enums, { name, options: [] }]);
  };

  return (
    <div className="w-full min-w-0 h-full bg-[#070707] flex flex-col overflow-hidden" >
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="shrink-0 w-full min-w-0 px-4 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
            Tables
          </h3>
          <button
            onClick={createTable}
            className="cursor-pointer text-neutral-500 hover:text-blue-400 transition-colors p-1 rounded-md hover:bg-white/[0.06]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-4 pb-4">
          <div className="space-y-2">
            {tables.map((table) => (
              <TableSection
                key={table.name}
                table={table}
                allTables={tables}
                enums={enums}
                updateTables={updateTables}
                deleteTable={deleteTable}
                renameTable={renameTable}
                renameColumn={renameColumn}
              />
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
                Enums
              </h3>
              <button
                onClick={createEnum}
                className="cursor-pointer text-neutral-500 hover:text-emerald-400 transition-colors p-1 rounded-md hover:bg-white/[0.06]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 pb-2">
              {enums.map((enumItem) => (
                <EnumSection
                  key={enumItem.name}
                  enum={enumItem}
                  enums={enums}
                  updateEnums={updateEnums}
                  deleteEnum={deleteEnum}
                  renameEnum={renameEnum}
                  renameEnumOption={renameEnumOption}
                />
              ))}
            </div>
          </div>
        </div>

        <SidebarFooter schema={schema} tables={tables} enums={enums} token={token} />
      </div>
    </div>
  );
}

export default memo(EditorSidebar);
