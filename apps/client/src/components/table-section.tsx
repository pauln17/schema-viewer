import { useState } from "react";

import { normalizeIdentifier } from "@/lib/schema-to-sql";
import type { Column, Enum, Table } from "@/types/schema";

import { CheckList } from "./check-list";
import { ColumnRow } from "./column-row";
import { IndexList } from "./index-list";
import { ReferenceList } from "./reference-list";

type TableSectionProps = {
  table: Table;
  allTables: Table[];
  enums: Enum[];
  updateTables: (tables: Table[]) => void;
  deleteTable: (tableName: string) => void;
  renameTable: (oldName: string, newName: string) => void;
  renameColumn: (tableName: string, oldName: string, newName: string) => void;
};

const SQL_TYPE_GROUPS: Record<string, string[]> = {
  Integers: ["INT", "BIGINT", "SMALLINT", "SERIAL", "BIGSERIAL"],
  Text: ["VARCHAR", "TEXT", "CHAR"],
  Numeric: ["DECIMAL", "REAL", "FLOAT"],
  Time: ["DATE", "TIME", "TIMESTAMP", "TIMESTAMPTZ"],
  Other: ["BOOLEAN", "UUID", "JSON", "BYTEA", "INET", "CIDR"],
};

const CONSTRAINT_STYLES: Record<string, { on: string; off: string }> = {
  NN: {
    on: "bg-red-500/20 text-red-400",
    off: "bg-white/[0.04] text-neutral-600 hover:text-red-400/60",
  },
  UQ: {
    on: "bg-cyan-500/20 text-cyan-400",
    off: "bg-white/[0.04] text-neutral-600 hover:text-cyan-400/60",
  },
  DEFAULT: {
    on: "bg-emerald-500/20 text-emerald-400",
    off: "bg-white/[0.04] text-neutral-600 hover:text-emerald-400/60",
  },
};

export function TableSection({
  table,
  allTables,
  enums,
  updateTables,
  deleteTable,
  renameTable,
  renameColumn,
}: TableSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingTableName, setEditingTableName] = useState(false);

  const tableColumns = table.columns ?? [];
  const tableIndexes = table.indexes ?? [];
  const tableChecks = table.checks ?? [];
  const tableRefs = table.references ?? [];
  const enumNames = enums.map((e) => e.name.toUpperCase());

  const pkColumns = new Set(
    tableColumns.filter((c) => c.primaryKey).map((c) => c.name),
  );
  const fkLocalColumns = new Set(tableRefs.flatMap((r) => r.localColumns));
  const fkTargetTables = allTables.filter((t) => t.name !== table.name);

  const updateTable = (updated: Table) =>
    updateTables(allTables.map((t) => (t.name === table.name ? updated : t)));

  const updateColumn = (colName: string, patch: Partial<Column>) => {
    updateTable({
      ...table,
      columns: tableColumns.map((c) =>
        c.name === colName ? { ...c, ...patch } : c,
      ),
    });
  };

  const deleteColumn = (colName: string) => {
    const updatedIndexes = tableIndexes
      .map((i) => ({
        ...i,
        indexedColumns: (i.indexedColumns ?? []).filter((c) => c !== colName),
      }))
      .filter((i) => i.indexedColumns.length > 0);

    const updatedRefs = tableRefs
      .map((r) => ({
        ...r,
        localColumns: r.localColumns.filter((c) => c !== colName),
        referencedColumns: r.referencedColumns.filter((_, i) => r.localColumns[i] !== colName),
      }))
      .filter((r) => r.localColumns.length > 0);

    updateTable({
      ...table,
      columns: tableColumns.filter((c) => c.name !== colName),
      indexes: updatedIndexes,
      references: updatedRefs,
    });
  };

  const togglePk = (colName: string) => {
    const col = tableColumns.find((c) => c.name === colName);
    if (col) updateColumn(colName, { primaryKey: !col.primaryKey });
  };

  const addColumn = () => {
    const base = "column";
    let name = base;
    let n = 0;
    while (tableColumns.some((c) => c.name === name)) {
      n += 1;
      name = `${base}_${n}`;
    }
    updateTable({
      ...table,
      columns: [...tableColumns, { name, type: "TEXT" }],
    });
  };

  return (
    <div
      className={`rounded-lg overflow-hidden border transition-colors ${expanded ? "border-white/[0.1] bg-white/[0.02]" : "border-white/[0.06]"}`}
    >
      {/* Table Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
          )
            return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        className={`cursor-pointer group w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${expanded ? "bg-white/[0.05] border-b border-white/[0.06]" : "hover:bg-white/[0.04]"}`}
      >
        <svg
          className={`w-3 h-3 text-neutral-500 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <svg
          className="w-4 h-4 text-blue-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <div
          className="flex items-center shrink-0 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          {editingTableName ? (
            <input
              type="text"
              maxLength={20}
              defaultValue={table.name}
              className="min-w-[80px] h-5 px-1.5 text-[10px] font-mono leading-none bg-white/[0.06] border border-white/[0.08] rounded text-neutral-300 placeholder-neutral-600 outline-none focus:border-blue-500/50 box-border text-sm"
              onBlur={(e) => {
                const newName = normalizeIdentifier(e.target.value);
                if (newName && newName !== table.name)
                  renameTable(table.name, newName);
                setEditingTableName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingTableName(false);
              }}
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTableName(true);
              }}
              className={`text-left text-sm truncate max-w-[180px] transition-colors cursor-pointer hover:text-white ${expanded ? "text-white font-medium" : "text-neutral-200"}`}
            >
              {table.name}
            </button>
          )}
        </div>
        <div
          className="ml-auto flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-neutral-500 font-mono">
            {tableColumns.length}
          </span>
          <button
            type="button"
            onClick={() => deleteTable(table.name)}
            className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
            title="Delete Table"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12" /></svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div>
          {tableColumns.map((col) => (
            <ColumnRow
              key={col.name}
              col={col}
              pkColumns={pkColumns}
              fkLocalColumns={fkLocalColumns}
              enumNames={enumNames}
              sqlTypeGroups={SQL_TYPE_GROUPS}
              constraintStyles={CONSTRAINT_STYLES}
              togglePk={togglePk}
              updateColumn={updateColumn}
              deleteColumn={deleteColumn}
              renameColumn={(oldName, newName) =>
                renameColumn(table.name, oldName, newName)
              }
            />
          ))}

          <IndexList
            table={table}
            tableColumns={tableColumns}
            tableIndexes={tableIndexes}
            updateTable={updateTable}
          />

          <ReferenceList
            table={table}
            tableColumns={tableColumns}
            allTables={allTables}
            fkTargetTables={fkTargetTables}
            tableRefs={tableRefs}
            updateTable={updateTable}
          />

          <CheckList
            table={table}
            tableChecks={tableChecks}
            updateTable={updateTable}
          />

          <button
            onClick={addColumn}
            className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-2 text-neutral-500 hover:text-blue-400 hover:bg-white/[0.04] transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-xs">Add Column</span>
          </button>
        </div>
      )}
    </div>
  );
}
