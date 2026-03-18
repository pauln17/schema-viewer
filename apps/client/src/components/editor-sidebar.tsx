import { memo, useEffect, useMemo, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { schemaToSql } from "@/lib/schema-to-sql";
import type { Enum, Schema, Table } from "@/types/schema";
import { EnumSection } from "./enum-section";
import { TableSection } from "./table-section";

function SidebarFooter({ tables, enums }: { tables: Table[]; enums: Enum[] }) {
  const columnCount = tables.reduce((n, t) => n + (t.columns?.length ?? 0), 0);
  return (
    <div className="shrink-0 px-4 py-3 border-t border-white/[0.06] space-y-2">
      <p className="text-[10px] text-neutral-600 text-center">
        {tables.length} Table{tables.length !== 1 ? "s" : ""}
        · {enums.length} Enum{enums.length !== 1 ? "s" : ""}
        {tables.length > 0 && ` · ${columnCount} Columns`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] text-xs text-neutral-300 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 640 640" fill="currentColor">
            <path d="M352 96c0-17.7-14.3-32-32-32s-32 14.3-32 32v210.7l-41.4-41.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8 12.5 45.3 0l96-96c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L352 306.7zM160 384c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64v-32c0-35.3-28.7-64-64-64h-46.9l-56.6 56.6c-31.2 31.2-81.9 31.2-113.1 0L206.9 384zm304 56c13.3 0 24 10.7 24 24s-10.7 24-24 24s-24-10.7-24-24s10.7-24 24-24" />
          </svg>
          Export
        </button>
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] text-xs text-neutral-300 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 640 640" fill="currentColor">
            <path d="M352 173.3V384c0 17.7-14.3 32-32 32s-32-14.3-32-32V173.3l-41.4 41.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l96-96c12.5 12.5 32.8 12.5 45.3 0l96 96c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0zM320 464c44.2 0 80-35.8 80-80h80c35.3 0 64 28.7 64 64v32c0 35.3-28.7 64-64 64H160c-35.3 0-64-28.7-64-64v-32c0-35.3 28.7-64 64-64h80c0 44.2 35.8 80 80 80m144 24c13.3 0 24-10.7 24-24s-10.7-24-24-24s-24-10.7-24-24s10.7-24 24-24" />
          </svg>
          Import
        </button>
      </div>
    </div>
  );
}

interface EditorSidebarProps {
  schema: Schema | null;
  tables: Table[];
  enums: Enum[];
  updateQueryCache: (data: Schema) => void;
}

function EditorSidebar({
  schema,
  tables,
  enums,
  updateQueryCache,
}: EditorSidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"schema" | "sql">("schema");

  const handleTabChange = (tab: "schema" | "sql") => {
    setActiveSidebarTab(tab);
    localStorage.setItem("editor-sidebar-tab", tab);
  };

  useEffect(() => {
    const saved = localStorage.getItem("editor-sidebar-tab");
    if (saved === "sql" || saved === "schema") {
      setActiveSidebarTab(saved);
    }
    setMounted(true);
  }, []);

  const sqlContent = useMemo(
    () =>
      schemaToSql(
        { name: schema?.name ?? "", definition: { enums, tables } } as Schema,
        "postgres"
      ),
    [enums, schema?.name, tables],
  );

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
    updateQueryCache({
      ...schema,
      definition: {
        enums,
        tables: tables.map((t) =>
          t.name === oldName ? { ...t, name: newName } : t,
        ),
      },
    });
  };

  const renameColumn = (tableName: string, oldName: string, newName: string) => {
    if (!schema) return;
    updateQueryCache({
      ...schema,
      definition: {
        enums,
        tables: tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              columns: t.columns.map((c) =>
                c.name === oldName ? { ...c, name: newName } : c,
              ),
            }
            : t,
        ),
      },
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

  if (!mounted) return null;

  return (
    <div className="w-full min-w-0 h-full bg-[#070707] flex flex-col overflow-hidden">
      <div className="shrink-0 flex w-full h-14 items-stretch">
        <button
          onClick={() => handleTabChange("schema")}
          className={`flex-1 min-w-0 px-4 flex items-center justify-center text-[13px] font-medium transition-colors cursor-pointer border-b-2 ${activeSidebarTab === "schema"
            ? "text-white border-blue-500 bg-white/[0.02]"
            : "text-neutral-500 hover:text-neutral-300 border-transparent"
            }`}
        >
          Schema
        </button>
        <button
          onClick={() => handleTabChange("sql")}
          className={`flex-1 min-w-0 px-4 flex items-center justify-center text-[13px] font-medium transition-colors cursor-pointer border-b-2 ${activeSidebarTab === "sql"
            ? "text-white border-blue-500 bg-white/[0.02]"
            : "text-neutral-500 hover:text-neutral-300 border-transparent"
            }`}
        >
          SQL
        </button>
      </div>

      {activeSidebarTab === "schema" ? (
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

          <SidebarFooter tables={tables} enums={enums} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="sql"
              value={sqlContent}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: "on",
                padding: { top: 12, bottom: 12 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
          <SidebarFooter tables={tables} enums={enums} />
        </div>
      )}
    </div>
  );
}

export default memo(EditorSidebar);
