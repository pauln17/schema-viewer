import { useState, useRef, useEffect } from "react";
import type { Column, Table, Enum, Index } from "@/types/schema";
import { normalizeIdentifier } from "@/lib/schema-to-sql";

interface TableSectionProps {
  table: Table;
  allTables: Table[];
  enums: Enum[];
  updateTables: (tables: Table[]) => void;
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
  const ref = useRef<HTMLDivElement>(null);
  const display = enumNames.includes(value.toUpperCase())
    ? value.toUpperCase()
    : value;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, [open]);

  return (
    <div ref={ref} className="relative">
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
  const [editingDefaultValue, setEditingDefaultValue] = useState<
    string | null
  >(null);
  const [editingTableName, setEditingTableName] = useState(false);
  const [editingColumnName, setEditingColumnName] = useState<string | null>(
    null,
  );
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const tableColumns = table.columns ?? [];
  const tableIndexes = table.indexes ?? [];
  const tableChecks = table.checks ?? [];

  const pkColumns = new Set(
    tableColumns.filter((c) => c.primaryKey).map((c) => c.name),
  );
  const enumNames = enums.map((e) => e.name.toUpperCase());

  const updateTable = (updated: Table) =>
    updateTables(allTables.map((t) => (t.name === table.name ? updated : t)));

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

  const deleteColumn = (colName: string) => {
    const prunedIndexes = tableIndexes
      .map((i) => ({
        ...i,
        indexedColumns: (i.indexedColumns ?? []).filter((c) => c !== colName),
      }))
      .filter((i) => i.indexedColumns.length > 0);

    updateTable({
      ...table,
      columns: tableColumns.filter((c) => c.name !== colName),
      indexes: prunedIndexes,
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

    if (col.default !== undefined || editingDefaultValue === colName) {
      setEditingDefaultValue(null);
      if (col.default !== undefined)
        updateColumn(colName, { default: undefined });
    } else {
      setEditingDefaultValue(colName);
    }
  };

  const changeDefault = (colName: string, value: string) => {
    updateColumn(colName, { default: value });
  };

  const changeType = (colName: string, type: string) => {
    updateColumn(colName, { type });
  };

  const addIndex = () => {
    const name = `${table.name}_untitled_idx`;
    const newIndex: Index = { indexedColumns: [], name };
    updateTable({ ...table, indexes: [...tableIndexes, newIndex] });
    setExpandedIndex(name);
  };

  const updateIndex = (idxName: string, patch: Partial<Index>) => {
    const updated = tableIndexes.map((i) =>
      i.name === idxName ? { ...i, ...patch } : i,
    );
    updateTable({ ...table, indexes: updated });
  };

  const deleteIndex = (idxName: string) => {
    if (expandedIndex === idxName) setExpandedIndex(null);
    updateTable({
      ...table,
      indexes: tableIndexes.filter((i) => i.name !== idxName),
    });
  };

  const autoIndexName = (cols: string[]) =>
    cols.length > 0
      ? `${table.name}_${cols.join("_")}_idx`
      : `${table.name}_untitled_idx`;

  const addIndexColumn = (idxName: string, colName: string) => {
    const idx = tableIndexes.find((i) => i.name === idxName);
    if (!idx) return;
    const cols = [...(idx.indexedColumns ?? []), colName];
    const newName = autoIndexName(cols);
    updateIndex(idxName, { indexedColumns: cols, name: newName });
    setExpandedIndex(newName);
  };

  const removeIndexColumn = (idxName: string, colName: string) => {
    const idx = tableIndexes.find((i) => i.name === idxName);
    if (!idx) return;
    const cols = (idx.indexedColumns ?? []).filter((c) => c !== colName);
    const newName = autoIndexName(cols);
    updateIndex(idxName, { indexedColumns: cols, name: newName });
    setExpandedIndex(newName);
  };


  const addCheck = () => {
    updateTable({
      ...table,
      checks: [...tableChecks, ""],
    });
  };

  const updateCheck = (idx: number, expr: string) => {
    const updated = [...tableChecks];
    updated[idx] = expr;
    updateTable({ ...table, checks: updated });
  };

  const deleteCheck = (idx: number) => {
    updateTable({
      ...table,
      checks: tableChecks.filter((_, i) => i !== idx),
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
                      maxLength={20}
                      defaultValue={col.name}
                      className="w-20 max-w-[100px] h-5 px-1.5 text-[10px] font-mono leading-none bg-white/[0.06] border border-white/[0.08] rounded text-neutral-300 placeholder-neutral-600 outline-none focus:border-blue-500/50 box-border"
                      onBlur={(e) => {
                        const newName = normalizeIdentifier(e.target.value);
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
                    onClick={() => toggleConstraint(col.name, "notNull")}
                    className={`cursor-pointer px-2 py-0.5 rounded text-center text-[10px] font-semibold transition-colors whitespace-nowrap ${!!col.notNull ? CONSTRAINT_STYLES.NN.on : CONSTRAINT_STYLES.NN.off}`}
                  >
                    NN
                  </button>
                  <button
                    onClick={() => toggleConstraint(col.name, "unique")}
                    className={`cursor-pointer px-2 py-0.5 rounded text-center text-[10px] font-semibold transition-colors whitespace-nowrap ${!!col.unique ? CONSTRAINT_STYLES.UQ.on : CONSTRAINT_STYLES.UQ.off}`}
                  >
                    UQ
                  </button>
                  <button
                    onClick={() => toggleDefault(col.name)}
                    className={`cursor-pointer px-2 py-0.5 rounded text-center text-[10px] font-semibold transition-colors whitespace-nowrap ${col.default !== undefined || editingDefaultValue === col.name ? CONSTRAINT_STYLES.DEFAULT.on : CONSTRAINT_STYLES.DEFAULT.off}`}
                  >
                    DEFAULT
                  </button>
                </div>

                {(col.default !== undefined ||
                  editingDefaultValue === col.name) && (
                    <div className="flex items-center gap-3 shrink-0 h-5">
                      {editingDefaultValue === col.name ? (
                        <input
                          type="text"
                          maxLength={20}
                          placeholder="value"
                          defaultValue={col.default || ""}
                          className="w-20 max-w-[100px] h-5 px-1.5 text-[10px] font-mono leading-none bg-white/[0.06] border border-white/[0.08] rounded text-neutral-300 placeholder-neutral-600 outline-none focus:border-emerald-500/50 box-border"
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            changeDefault(col.name, v);
                            setEditingDefaultValue(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              (e.target as HTMLInputElement).blur();
                            if (e.key === "Escape") setEditingDefaultValue(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingDefaultValue(col.name)}
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

          <div className="px-3 pt-1.5 pb-1.5 ml-3 border-t border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Indexes
              </span>
              <button
                onClick={addIndex}
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
              <div className="space-y-1">
                {tableIndexes.map((idx) => {
                  const cols = idx.indexedColumns ?? [];
                  const isExpanded = expandedIndex === idx.name;
                  const colSummary =
                    cols.length > 0 ? `(${cols.join(", ")})` : "(none)";
                  const availableCols = tableColumns.filter(
                    (c) => !cols.includes(c.name),
                  );

                  return (
                    <div
                      key={idx.name}
                      className={`rounded border transition-colors ${isExpanded ? "border-white/[0.1] bg-white/[0.02]" : "border-transparent"}`}
                    >
                      {/* Collapsed row */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setExpandedIndex(isExpanded ? null : idx.name)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setExpandedIndex(isExpanded ? null : idx.name);
                          }
                        }}
                        className="flex items-center gap-1.5 px-1.5 py-1 cursor-pointer group/idx hover:bg-white/[0.03] rounded transition-colors"
                      >
                        <svg
                          className={`w-2.5 h-2.5 text-neutral-500 transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-[10px] font-mono text-neutral-400 truncate min-w-0 flex-1">
                          {idx.name}
                          <span className="text-neutral-600 ml-1">
                            {colSummary}
                          </span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteIndex(idx.name);
                          }}
                          className="p-0.5 text-neutral-600 hover:text-red-400 transition-colors shrink-0 cursor-pointer opacity-0 group-hover/idx:opacity-100"
                          title="Remove Index"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12" /></svg>
                        </button>
                      </div>

                      {/* Expanded view */}
                      {isExpanded && (
                        <div className="pl-5 pr-1.5 pb-2 pt-0.5 space-y-1">
                          {cols.length === 0 ? (
                            <p className="text-[9px] text-neutral-600 italic">
                              No columns — pick one below
                            </p>
                          ) : (
                            cols.map((colName) => (
                              <div
                                key={colName}
                                className="flex items-center gap-1.5 group/col"
                              >
                                <span className="w-1 h-1 rounded-full bg-neutral-600 shrink-0" />
                                <span className="text-[10px] font-mono text-neutral-300 flex-1 truncate">
                                  {colName}
                                </span>
                                <button
                                  onClick={() =>
                                    removeIndexColumn(idx.name, colName)
                                  }
                                  className="p-0.5 text-neutral-600 hover:text-red-400 transition-colors shrink-0 cursor-pointer opacity-0 group-hover/col:opacity-100"
                                  title="Remove column from index"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            ))
                          )}
                          {availableCols.length > 0 && (
                            <select
                              value=""
                              onChange={(e) => {
                                const col = e.target.value;
                                if (!col) return;
                                addIndexColumn(idx.name, col);
                              }}
                              className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 text-[10px] font-mono text-neutral-500 outline-none cursor-pointer mt-1"
                            >
                              <option value="" className="bg-neutral-800">
                                + Add Column…
                              </option>
                              {availableCols.map((c) => (
                                <option
                                  key={c.name}
                                  value={c.name}
                                  className="bg-neutral-800"
                                >
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-3 pt-1.5 pb-1.5 ml-3 border-t border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Checks
              </span>
              <button
                onClick={addCheck}
                className="cursor-pointer p-1 rounded text-neutral-500 hover:text-amber-400 hover:bg-white/[0.06] transition-colors"
                title="Add Check"
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
            {tableChecks.length === 0 ? (
              <p className="text-[10px] text-neutral-600 italic py-1">
                No Checks
              </p>
            ) : (
              <div className="space-y-1.5">
                {tableChecks.map((expr, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 group"
                  >
                    <input
                      type="text"
                      value={expr}
                      onChange={(e) => updateCheck(idx, e.target.value)}
                      placeholder="e.g. start_date < end_date"
                      className="flex-1 min-w-0 h-6 px-2 text-[10px] font-mono bg-white/[0.04] border border-white/[0.06] rounded text-neutral-400 placeholder-neutral-600 outline-none focus:border-amber-500/50"
                    />
                    <button
                      onClick={() => deleteCheck(idx)}
                      className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                      title="Remove check"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12" /></svg>
                    </button>
                  </div>
                ))}
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
