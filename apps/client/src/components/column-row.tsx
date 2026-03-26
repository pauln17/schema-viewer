import { useState } from "react";
import { type Socket } from "socket.io-client";

import { useSchemaActions } from "@/hooks/useSchemaActions";
import { normalizeIdentifier } from "@/lib/schema-to-sql";
import type { Column, Schema } from "@/types/schema";

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

type ColumnRowProps = {
  col: Column;
  tableName: string;
  schema: Schema;
  token: string | undefined;
  pkColumns: Set<string>;
  fkLocalColumns: Set<string>;
  enumNames: string[];
  socket: Socket | undefined;
};

export function ColumnRow({
  col,
  tableName,
  schema,
  token,
  pkColumns,
  fkLocalColumns,
  enumNames,
  socket,
}: ColumnRowProps) {
  const { updateColumn, deleteColumn, renameColumn } =
    useSchemaActions(schema, token, socket);

  const [editingColumnName, setEditingColumnName] = useState(false);
  const [editingDefaultValue, setEditingDefaultValue] = useState(false);

  const toggleDefault = () => {
    if (col.default !== undefined || editingDefaultValue) {
      setEditingDefaultValue(false);
      if (col.default !== undefined)
        updateColumn(tableName, col.name, { default: undefined });
    } else {
      setEditingDefaultValue(true);
    }
  };

  return (
    <div className="px-3 py-2.5 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => updateColumn(tableName, col.name, { primaryKey: !col.primaryKey })}
            className={`cursor-pointer shrink-0 transition-colors ${pkColumns.has(col.name) ? "text-amber-400" : "text-neutral-700 hover:text-amber-400/60"}`}
            title={pkColumns.has(col.name) ? "Remove From Primary Key" : "Add To Primary Key"}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 8a4 4 0 0 1 7.465-2H14a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V9H7.465A4 4 0 0 1 0 8Zm4-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
            </svg>
          </button>
          {fkLocalColumns.has(col.name) && (
            <span className="shrink-0 text-blue-400" title="Foreign Key">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </span>
          )}
          {editingColumnName ? (
            <input
              type="text"
              maxLength={20}
              defaultValue={col.name}
              className="w-20 max-w-[100px] h-5 px-1.5 text-[10px] font-mono leading-none bg-white/[0.06] border border-white/[0.08] rounded text-neutral-300 placeholder-neutral-600 outline-none focus:border-blue-500/50 box-border"
              onBlur={(e) => {
                const newName = normalizeIdentifier(e.target.value);
                if (newName && newName !== col.name)
                  renameColumn(tableName, col.name, newName);
                setEditingColumnName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingColumnName(false);
              }}
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingColumnName(true)}
              className="text-xs text-neutral-200 truncate text-left cursor-pointer hover:text-white transition-colors"
            >
              {col.name}
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <select
            value={col.type}
            onChange={(e) =>
              updateColumn(tableName, col.name, { type: e.target.value })
            }
            className="bg-transparent text-[11px] text-neutral-500 font-mono border-none outline-none cursor-pointer hover:text-neutral-300 transition-colors shrink-0 w-[110px] text-right"
          >
            {Object.entries(SQL_TYPE_GROUPS).map(([label, types]) => (
              <optgroup key={label} label={label} className="bg-neutral-800 text-neutral-300">
                {types.map((t) => (
                  <option key={t} value={t} className="bg-neutral-800 text-neutral-300">{t}</option>
                ))}
              </optgroup>
            ))}
            {enumNames.length > 0 && (
              <optgroup label="Enums" className="bg-neutral-800 text-neutral-300">
                {enumNames.map((e) => (
                  <option key={e} value={e} className="bg-neutral-800 text-neutral-300">{e}</option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            type="button"
            onClick={() => deleteColumn(tableName, col.name)}
            className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
            title="Delete Column"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 flex-nowrap w-full min-h-[20px]">
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              updateColumn(tableName, col.name, { notNull: !col.notNull })
            }
            className={`cursor-pointer px-2 py-0.5 rounded text-center text-[10px] font-semibold transition-colors whitespace-nowrap ${!!col.notNull ? CONSTRAINT_STYLES.NN.on : CONSTRAINT_STYLES.NN.off}`}
          >
            NN
          </button>
          <button
            onClick={() =>
              updateColumn(tableName, col.name, { unique: !col.unique })
            }
            className={`cursor-pointer px-2 py-0.5 rounded text-center text-[10px] font-semibold transition-colors whitespace-nowrap ${!!col.unique ? CONSTRAINT_STYLES.UQ.on : CONSTRAINT_STYLES.UQ.off}`}
          >
            UQ
          </button>
          <button
            onClick={toggleDefault}
            className={`cursor-pointer px-2 py-0.5 rounded text-center text-[10px] font-semibold transition-colors whitespace-nowrap ${col.default !== undefined || editingDefaultValue ? CONSTRAINT_STYLES.DEFAULT.on : CONSTRAINT_STYLES.DEFAULT.off}`}
          >
            DEFAULT
          </button>
        </div>

        {(col.default !== undefined || editingDefaultValue) && (
          <div className="flex items-center gap-3 shrink-0 h-5">
            {editingDefaultValue ? (
              <input
                type="text"
                maxLength={20}
                placeholder="value"
                defaultValue={col.default || ""}
                className="w-20 max-w-[100px] h-5 px-1.5 text-[10px] font-mono leading-none bg-white/[0.06] border border-white/[0.08] rounded text-neutral-300 placeholder-neutral-600 outline-none focus:border-emerald-500/50 box-border"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  updateColumn(tableName, col.name, { default: v });
                  setEditingDefaultValue(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") setEditingDefaultValue(false);
                }}
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingDefaultValue(true)}
                className="text-[10px] font-mono text-emerald-400/90 hover:text-emerald-400 cursor-pointer"
              >
                ={" "}
                {col.default != null && String(col.default).trim()
                  ? String(col.default)
                  : "value"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
