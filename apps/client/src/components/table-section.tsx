import { useState } from "react";
import { type Socket } from "socket.io-client";

import { useSchemaActions } from "@/hooks/useSchemaActions";
import { normalizeIdentifier } from "@/lib/schema-to-sql";
import type { Schema, Table } from "@/types/schema";

import { CheckList } from "./check-list";
import { ColumnRow } from "./column-row";
import { IndexList } from "./index-list";
import { ReferenceList } from "./reference-list";

export function TableSection({ table, schema, token, socket }: { table: Table; schema: Schema; token: string | undefined, socket: Socket | undefined }) {
  const { addColumn, deleteTable, renameTable } = useSchemaActions(schema, token, socket);
  const [expanded, setExpanded] = useState(false);
  const [editingTableName, setEditingTableName] = useState(false);

  const tableColumns = table.columns ?? [];
  const tableRefs = table.references ?? [];
  const enumNames = schema.definition.enums.map((e) => e.name.toUpperCase());

  const pkColumns = new Set(
    tableColumns.filter((c) => c.primaryKey).map((c) => c.name),
  );
  const fkLocalColumns = new Set(tableRefs.flatMap((r) => r.localColumns));

  return (
    <div
      className={`rounded-lg overflow-hidden border transition-colors ${expanded ? "border-white/[0.1] bg-white/[0.02]" : "border-white/[0.06]"}`}
    >
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
              tableName={table.name}
              schema={schema}
              token={token}
              pkColumns={pkColumns}
              fkLocalColumns={fkLocalColumns}
              enumNames={enumNames}
              socket={socket}
            />
          ))}

          <IndexList table={table} schema={schema} token={token} socket={socket} />

          <ReferenceList table={table} schema={schema} token={token} socket={socket} />

          <CheckList table={table} schema={schema} token={token} socket={socket} />

          <button
            onClick={() => addColumn(table.name)}
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
