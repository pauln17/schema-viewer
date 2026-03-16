import { useState } from "react";
import type { Column, Table, Enum, Index } from "@/types/schema";

interface TableSectionProps {
  table: Table;
  allTables: Table[];
  enums: Enum[];
  updateTable: (updated: Table) => void;
  deleteTable: (tableName: string) => void;
  renameTable: (oldName: string, newName: string) => void;
  renameColumn: (
    tableName: string,
    oldName: string,
    newName: string,
  ) => void;
}

interface TypeDropdownProps {
  value: string;
  onChange: (t: string) => void;
  enumNames: string[];
}

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

function TypeDropdown({ value, onChange, enumNames }: TypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const display = enumNames.includes(value.toUpperCase())
    ? value.toUpperCase()
    : value;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative text-left appearance-none bg-transparent text-[11px] text-neutral-500 font-mono border-none outline-none cursor-pointer hover:text-neutral-300 py-0.5 pr-6 pl-0"
        style={{ width: `${display.length + 3}ch` }}
      >
        {display}
        <svg
          className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-600 pointer-events-none"
          fill="none"
          viewBox="0 0 12 12"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-0.5 z-50 min-w-[8.5rem] max-h-48 overflow-y-auto rounded border border-white/10 bg-neutral-900 py-1 shadow-lg">
          {Object.entries(SQL_TYPE_GROUPS).map(([label, types]) => (
            <div key={label}>
              <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-500 uppercase">
                {label}
              </div>
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    onChange(t);
                    setOpen(false);
                  }}
                  className={`block w-full text-left px-2.5 py-1 text-[11px] font-mono ${t.toUpperCase() === value.toUpperCase()
                    ? "bg-blue-600/30 text-blue-300"
                    : "text-neutral-300 hover:bg-white/5"
                    } cursor-pointer`}
                >
                  {t}
                </button>
              ))}
            </div>
          ))}
          {enumNames.length > 0 && (
            <>
              <div className="px-2.5 py-1 mt-1 border-t border-white/10 text-[10px] font-semibold text-emerald-400/80 uppercase">
                Enums
              </div>
              {enumNames.map((e: string) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    onChange(e);
                    setOpen(false);
                  }}
                  className={`block w-full text-left px-2.5 py-1 text-[11px] font-mono ${e.toUpperCase() === value.toUpperCase()
                    ? "bg-blue-600/30 text-blue-300"
                    : "text-neutral-300 hover:bg-white/5"
                    } cursor-pointer`}
                >
                  {e}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ConstraintToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const style = CONSTRAINT_STYLES[label];
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer px-2 py-0.5 rounded text-center text-[10px] font-semibold transition-colors whitespace-nowrap ${active ? style.on : style.off}`}
    >
      {label}
    </button>
  );
}

export function TableSection({
  table,
  allTables,
  enums,
  updateTable,
  deleteTable,
  renameTable,
  renameColumn,
}: TableSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingDefaultColumn, setEditingDefaultColumn] = useState<
    string | null
  >(null);
  const [editingTableName, setEditingTableName] = useState(false);
  const [editingColumnName, setEditingColumnName] = useState<string | null>(
    null,
  );

  const tableColumns = table.columns ?? [];
  const tableIndexes = table.indexes ?? [];

  const pkColumns = new Set(
    tableColumns.filter((c) => c.primaryKey).map((c) => c.name),
  );
  const enumNames = enums.map((e) => e.name.toUpperCase());

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

  const updateColumn = (colName: string, patch: Partial<Column>) => {
    updateTable({
      ...table,
      columns: tableColumns.map((c) =>
        c.name === colName ? { ...c, ...patch } : c,
      ),
    });
  };

  const togglePk = (colName: string) => {
    const col = tableColumns.find((c) => c.name === colName);
    if (col) updateColumn(colName, { primaryKey: !col.primaryKey });
  };

  const fkTargetTables = allTables.filter((t) => t.name !== table.name);
  const toggleFk = (colName: string) => {
    const col = tableColumns.find((c) => c.name === colName);
    if (!col) return;
    if (col.references) {
      updateColumn(colName, { references: undefined });
    } else {
      if (fkTargetTables.length === 0) return;
      const target = fkTargetTables[0];
      const targetCol =
        target.columns.find((c) => c.primaryKey) ?? target.columns[0];
      updateColumn(colName, {
        references: {
          referencedTable: target.name,
          referencedColumn: targetCol.name,
        },
      });
    }
  };

  const changeFkTable = (colName: string, newTable: string) => {
    const target = allTables.find((t) => t.name === newTable);
    if (!target) return;
    const targetCol =
      target.columns.find((c) => c.primaryKey) ?? target.columns[0];
    updateColumn(colName, {
      references: {
        referencedTable: newTable,
        referencedColumn: targetCol.name,
      },
    });
  };

  const changeFkColumn = (colName: string, newCol: string) => {
    const col = tableColumns.find((c) => c.name === colName);
    if (!col?.references) return;
    updateColumn(colName, {
      references: {
        referencedTable: col.references.referencedTable,
        referencedColumn: newCol,
      },
    });
  };

  const toggleConstraint = (colName: string, field: "notNull" | "unique") => {
    const col = tableColumns.find((c) => c.name === colName);
    if (col) updateColumn(colName, { [field]: !col[field] });
  };

  const toggleDefault = (colName: string) => {
    const col = tableColumns.find((c) => c.name === colName);
    if (!col) return;

    if (col.default !== undefined || editingDefaultColumn === colName) {
      setEditingDefaultColumn(null);
      if (col.default !== undefined)
        updateColumn(colName, { default: undefined });
    } else {
      setEditingDefaultColumn(colName);
    }
  };

  const changeDefault = (colName: string, value: string) => {
    updateColumn(colName, { default: value });
  };

  const changeType = (colName: string, type: string) => {
    updateColumn(colName, { type });
  };

  const indexedColumns = new Set(tableIndexes.map((i) => i.indexedColumn));
  const addIndex = () => {
    const firstNonIndexedCol = tableColumns.find(
      (c) => !indexedColumns.has(c.name),
    )!.name;
    const name = `idx_${table.name}_${firstNonIndexedCol}`;
    const newIndex: Index = { indexedColumn: firstNonIndexedCol, name };
    updateTable({ ...table, indexes: [...tableIndexes, newIndex] });
  };

  const updateIndex = (idxName: string, patch: Partial<Index>) => {
    const updated = tableIndexes.map((i) =>
      i.name === idxName ? { ...i, ...patch } : i,
    );
    updateTable({ ...table, indexes: updated });
  };

  const deleteIndex = (idxName: string) => {
    updateTable({
      ...table,
      indexes: tableIndexes.filter((i) => i.name !== idxName),
    });
  };

  const deleteColumn = (colName: string) => {
    updateTable({
      ...table,
      columns: tableColumns.filter((c) => c.name !== colName),
      indexes: tableIndexes.filter((i) => i.indexedColumn !== colName),
    });
  };

  return (
    <div
      className={`rounded-lg overflow-hidden border transition-colors ${expanded ? "border-white/[0.1] bg-white/[0.02]" : "border-white/[0.06]"}`}
    >
      {/* Table Header*/}
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
              maxLength={15}
              defaultValue={table.name}
              className="min-w-[80px] h-5 px-1.5 text-[10px] font-mono leading-none bg-white/[0.06] border border-white/[0.08] rounded text-neutral-300 placeholder-neutral-600 outline-none focus:border-blue-500/50 box-border text-sm"
              onBlur={(e) => {
                const newName = e.target.value.trim();
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
            className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
            title="Delete Table"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12" /></svg>
          </button>
        </div>
      </div>

      {/* Columns*/}
      {expanded && (
        <div>
          {tableColumns.map((col) => (
            <div
              key={col.name}
              className="px-3 py-2.5 ml-3 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => togglePk(col.name)}
                    className={`cursor-pointer shrink-0 transition-colors ${pkColumns.has(col.name) ? "text-amber-400" : "text-neutral-700 hover:text-amber-400/60"}`}
                    title={
                      pkColumns.has(col.name)
                        ? "Remove From Primary Key"
                        : "Add To Primary Key"
                    }
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M0 8a4 4 0 0 1 7.465-2H14a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V9H7.465A4 4 0 0 1 0 8Zm4-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => toggleFk(col.name)}
                    className={`cursor-pointer shrink-0 transition-colors ${col.references ? "text-blue-400" : "text-neutral-700 hover:text-blue-400/60"}`}
                    title={
                      col.references ? "Remove Foreign Key" : "Add Foreign Key"
                    }
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </button>
                  {editingColumnName === col.name ? (
                    <input
                      type="text"
                      maxLength={15}
                      defaultValue={col.name}
                      className="w-20 max-w-[100px] h-5 px-1.5 text-[10px] font-mono leading-none bg-white/[0.06] border border-white/[0.08] rounded text-neutral-300 placeholder-neutral-600 outline-none focus:border-blue-500/50 box-border"
                      onBlur={(e) => {
                        const newName = e.target.value.trim();
                        if (newName && newName !== col.name)
                          renameColumn(table.name, col.name, newName);
                        setEditingColumnName(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setEditingColumnName(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingColumnName(col.name)}
                      className="text-xs text-neutral-200 truncate text-left cursor-pointer hover:text-white transition-colors"
                    >
                      {col.name}
                    </button>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-1 shrink-0">
                  <TypeDropdown
                    value={col.type}
                    onChange={(t: string) => changeType(col.name, t)}
                    enumNames={enumNames}
                  />
                  <button
                    type="button"
                    onClick={() => deleteColumn(col.name)}
                    className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                    title="Delete Column"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12" /></svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-1 flex-nowrap w-full min-h-[20px]">
                <div className="flex items-center gap-1">
                  <ConstraintToggle
                    label="NN"
                    active={!!col.notNull}
                    onClick={() => toggleConstraint(col.name, "notNull")}
                  />
                  <ConstraintToggle
                    label="UQ"
                    active={!!col.unique}
                    onClick={() => toggleConstraint(col.name, "unique")}
                  />
                  <ConstraintToggle
                    label="DEFAULT"
                    active={
                      col.default !== undefined ||
                      editingDefaultColumn === col.name
                    }
                    onClick={() => toggleDefault(col.name)}
                  />
                </div>

                {(col.default !== undefined ||
                  editingDefaultColumn === col.name) && (
                    <div className="flex items-center gap-3 shrink-0 h-5">
                      {editingDefaultColumn === col.name ? (
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="value"
                          defaultValue={col.default || ""}
                          className="w-20 max-w-[100px] h-5 px-1.5 text-[10px] font-mono leading-none bg-white/[0.06] border border-white/[0.08] rounded text-neutral-300 placeholder-neutral-600 outline-none focus:border-emerald-500/50 box-border"
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            changeDefault(col.name, v);
                            setEditingDefaultColumn(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              (e.target as HTMLInputElement).blur();
                            if (e.key === "Escape") setEditingColumnName(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingDefaultColumn(col.name)}
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

              {col.references && (
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-400 text-[10px]">&rarr;</span>
                  <select
                    value={col.references.referencedTable}
                    onChange={(e) => changeFkTable(col.name, e.target.value)}
                    className="bg-transparent text-[10px] text-neutral-400 font-mono border-none outline-none cursor-pointer hover:text-neutral-300 transition-colors"
                  >
                    {fkTargetTables.map((t) => (
                      <option
                        key={t.name}
                        value={t.name}
                        className="bg-neutral-800 text-neutral-300"
                      >
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={col.references.referencedColumn}
                    onChange={(e) => changeFkColumn(col.name, e.target.value)}
                    className="bg-transparent text-[10px] text-neutral-400 font-mono border-none outline-none cursor-pointer hover:text-neutral-300 transition-colors"
                  >
                    {(
                      allTables.find(
                        (t) => t.name === col.references!.referencedTable,
                      )?.columns ?? []
                    ).map((c) => (
                      <option
                        key={c.name}
                        value={c.name}
                        className="bg-neutral-800 text-neutral-300"
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}

          <div className="px-3 pt-1 pb-1 ml-3 border-t border-white/[0.06] space-y-1.5 -mt-px">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Indexes
              </span>
              <button
                onClick={addIndex}
                disabled={tableColumns.every((c) => indexedColumns.has(c.name))}
                className="cursor-pointer p-1 rounded text-neutral-500 hover:text-violet-400 hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-neutral-500"
                title="Add Index"
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
              </button>
            </div>
            {tableIndexes.length === 0 ? (
              <p className="text-[10px] text-neutral-600 italic py-1">
                No Indexes
              </p>
            ) : (
              <div className="space-y-1.5">
                {tableIndexes.map((idx) => {
                  const indexedCol = idx.indexedColumn;
                  const indexedByOthers = new Set(
                    tableIndexes
                      .filter((i) => i.name !== idx.name)
                      .map((i) => i.indexedColumn),
                  );
                  const availableColumns = tableColumns.filter(
                    (c) =>
                      c.name === indexedCol || !indexedByOthers.has(c.name),
                  );

                  return (
                    <div
                      key={idx.name}
                      className="flex items-center gap-2 group"
                    >
                      <select
                        value={indexedCol}
                        onChange={(e) =>
                          updateIndex(idx.name, {
                            indexedColumn: e.target.value,
                            name: `idx_${table.name}_${e.target.value}`,
                          })
                        }
                        className="flex-1 min-w-0 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1 text-[10px] font-mono text-neutral-400 outline-none focus:border-violet-500/50 cursor-pointer"
                      >
                        {availableColumns.map((c) => (
                          <option
                            key={c.name}
                            value={c.name}
                            className="bg-neutral-800"
                          >
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => deleteIndex(idx.name)}
                        className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                        title="Remove Index"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
