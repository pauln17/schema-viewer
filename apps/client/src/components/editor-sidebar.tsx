import { useState, memo } from "react";
import type { Column, Table, Enum, Index } from "@/types/schema";

interface EditorSidebarProps {
  tables: Table[];
  enums: Enum[];
  onTablesChange: (tables: Table[]) => void;
  handleTableNameSubmit: (oldName: string, newName: string) => void;
  handleColumnNameSubmit: (
    tableName: string,
    oldName: string,
    newName: string,
  ) => void;
  handleEnumsChange: (enums: Enum[]) => void;
  handleEnumNameSubmit: (oldName: string, newName: string) => void;
  handleValueNameSubmit: (
    enumName: string,
    oldName: string,
    newName: string,
  ) => void;
}

interface TableSectionProps {
  table: Table;
  allTables: Table[];
  enums: Enum[];
  onTableChange: (updated: Table) => void;
  onDeleteTable: (tableName: string) => void;
  handleTableNameSubmit: (oldName: string, newName: string) => void;
  handleColumnNameSubmit: (
    tableName: string,
    oldName: string,
    newName: string,
  ) => void;
}

interface EnumSectionProps {
  enum: Enum;
  onEnumChange: (updated: Enum) => void;
  onDeleteEnum: (enumName: string) => void;
  handleEnumNameSubmit: (oldName: string, newName: string) => void;
  handleValueNameSubmit: (
    enumName: string,
    oldName: string,
    newName: string,
  ) => void;
}

const SQL_TYPES = [
  "UUID",
  "VARCHAR",
  "TEXT",
  "INTEGER",
  "BIGINT",
  "BOOLEAN",
  "DATE",
  "TIMESTAMP",
  "FLOAT",
  "DECIMAL",
  "JSON",
];

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

function DeleteIcon({ title }: { title?: string }) {
  return (
    <svg
      className="w-3.5 h-3.5 cursor-pointer"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      {title ? <title>{title}</title> : null}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12"
      />
    </svg>
  );
}

function TableSection({
  table,
  allTables,
  enums,
  onTableChange,
  onDeleteTable,
  handleTableNameSubmit,
  handleColumnNameSubmit,
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

  // Primary Key Columns + Enum Names (always uppercase for display)
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
    onTableChange({
      ...table,
      columns: [...tableColumns, { name, type: "TEXT" }],
    });
  };

  // Updates Column in Table By Accepting a Partial<Column> Input (Everything is Optional -> Only Updates Fields Given) -> Returns Updated Table Object
  const updateColumn = (colName: string, patch: Partial<Column>) => {
    onTableChange({
      ...table,
      columns: tableColumns.map((c) =>
        c.name === colName ? { ...c, ...patch } : c,
      ),
    });
  };

  // Toggling Primary Key
  const togglePk = (colName: string) => {
    const col = tableColumns.find((c) => c.name === colName);
    if (col) updateColumn(colName, { primaryKey: !col.primaryKey });
  };

  // Toggle Foreign Key + FK Data Dropdowns
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

  // Toggle Default
  const toggleDefault = (colName: string) => {
    const col = tableColumns.find((c) => c.name === colName);
    if (!col) return;

    if (col.default !== undefined || editingDefaultColumn === colName) {
      // Toggle Default Off (Remove Default Value): If Default is Active
      setEditingDefaultColumn(null);
      if (col.default !== undefined)
        updateColumn(colName, { default: undefined });
    } else {
      // Toggle Default On (Show Text Bar) -> If Default Is Not Active
      setEditingDefaultColumn(colName);
    }
  };

  // Change Default Value
  const changeDefault = (colName: string, value: string) => {
    updateColumn(colName, { default: value });
  };

  // Changing Column Type
  const changeType = (colName: string, type: string) => {
    updateColumn(colName, { type });
  };

  // Indexes
  const indexedColumns = new Set(tableIndexes.map((i) => i.indexedColumn));
  const addIndex = () => {
    const firstNonIndexedCol = tableColumns.find(
      (c) => !indexedColumns.has(c.name),
    )!.name;
    const name = `idx_${table.name}_${firstNonIndexedCol}`;
    const newIndex: Index = { indexedColumn: firstNonIndexedCol, name };
    onTableChange({ ...table, indexes: [...tableIndexes, newIndex] });
  };

  const updateIndex = (idxName: string, patch: Partial<Index>) => {
    const updated = tableIndexes.map((i) =>
      i.name === idxName ? { ...i, ...patch } : i,
    );
    onTableChange({ ...table, indexes: updated });
  };

  const removeIndex = (idxName: string) => {
    onTableChange({
      ...table,
      indexes: tableIndexes.filter((i) => i.name !== idxName),
    });
  };

  const removeColumn = (colName: string) => {
    onTableChange({
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
                  handleTableNameSubmit(table.name, newName);
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
            onClick={() => onDeleteTable(table.name)}
            className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
            title="Delete table"
          >
            <DeleteIcon />
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
                        ? "Remove from primary key"
                        : "Add to primary key"
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
                      col.references ? "Remove foreign key" : "Add foreign key"
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
                          handleColumnNameSubmit(table.name, col.name, newName);
                        setEditingColumnName(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setEditingTableName(false);
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
                {/* Dropdown Menu for Data/Enum Type */}
                <div className="relative inline-flex items-center shrink-0">
                  {(() => {
                    const isEnumType = enumNames.includes(
                      col.type.toUpperCase(),
                    );
                    const normalizedType = isEnumType
                      ? col.type.toUpperCase()
                      : col.type;
                    return (
                      <select
                        value={normalizedType}
                        onChange={(e) => changeType(col.name, e.target.value)}
                        className="appearance-none bg-transparent text-[11px] text-neutral-500 font-mono border-none outline-none cursor-pointer hover:text-neutral-300 transition-colors pr-3.5 pl-0"
                        style={{ width: `${normalizedType.length + 3}ch` }}
                      >
                        <optgroup
                          label="Data Types"
                          className="bg-neutral-800 text-neutral-400"
                        >
                          {SQL_TYPES.map((t) => (
                            <option
                              key={t}
                              value={t}
                              className="bg-neutral-800 text-neutral-300"
                            >
                              {t}
                            </option>
                          ))}
                        </optgroup>
                        {enumNames.length > 0 && (
                          <optgroup
                            label="Enums"
                            className="bg-neutral-800 text-neutral-400"
                          >
                            {enumNames.map((e) => (
                              <option
                                key={e}
                                value={e}
                                className="bg-neutral-800 text-neutral-300"
                              >
                                {e}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    );
                  })()}
                  <svg
                    className="absolute right-0 w-3 h-3 pointer-events-none text-neutral-600"
                    fill="none"
                    viewBox="0 0 12 12"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 4.5l3 3 3-3"
                    />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => removeColumn(col.name)}
                  className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                  title="Delete column"
                >
                  <DeleteIcon />
                </button>
              </div>

              {/* Constraints Buttons */}
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

                {/* Conditionally Rendered Text Bar For Default Value */}
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
                          if (e.key === "Escape") setEditingTableName(false);
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

              {/* Dropdown Menu for FK Target Table and Column */}
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

          {/* Indexes */}
          <div className="px-3 pt-1 pb-1 ml-3 border-t border-white/[0.06] space-y-1.5 -mt-px">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Indexes
              </span>
              <button
                onClick={addIndex}
                disabled={tableColumns.every((c) => indexedColumns.has(c.name))}
                className="cursor-pointer p-1 rounded text-neutral-500 hover:text-violet-400 hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-neutral-500"
                title="Add index"
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
                  const handleColumnChange = (newCol: string) => {
                    updateIndex(idx.name, {
                      indexedColumn: newCol,
                      name: `idx_${table.name}_${newCol}`,
                    });
                  };

                  return (
                    <div
                      key={idx.name}
                      className="flex items-center gap-2 group"
                    >
                      <select
                        value={indexedCol}
                        onChange={(e) => handleColumnChange(e.target.value)}
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
                        onClick={() => removeIndex(idx.name)}
                        className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                        title="Remove index"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Column */}
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

function EnumSection({
  enum: enumItem,
  onEnumChange,
  onDeleteEnum,
  handleEnumNameSubmit,
  handleValueNameSubmit,
}: EnumSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingEnumName, setEditingEnumName] = useState(false);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const enumValues = enumItem.values ?? [];

  const removeValue = (value: string) => {
    onEnumChange({
      ...enumItem,
      values: enumValues.filter((v) => v !== value),
    });
  };

  const addValue = () => {
    const base = "value";
    let name = base;
    let n = 0;
    while (enumValues.some((v) => v === name)) {
      n += 1;
      name = `${base}_${n}`;
    }
    onEnumChange({ ...enumItem, values: [...enumValues, name] });
  };

  return (
    <div
      className={`rounded-lg overflow-hidden border transition-colors ${expanded ? "border-white/[0.1] bg-white/[0.02]" : "border-white/[0.06]"}`}
    >
      {/* Enum Header */}
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
          className="w-4 h-4 text-emerald-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        <div
          className="flex items-center shrink-0 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          {editingEnumName ? (
            <input
              type="text"
              defaultValue={enumItem.name}
              className="min-w-[80px] h-5 px-1.5 text-[10px] font-mono leading-none bg-white/[0.06] border border-white/[0.08] rounded text-neutral-300 placeholder-neutral-600 outline-none focus:border-blue-500/50 box-border text-sm"
              onBlur={(e) => {
                const newName = e.target.value.trim();
                if (newName && newName !== enumItem.name)
                  handleEnumNameSubmit(enumItem.name, newName);
                setEditingEnumName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingEnumName(false);
              }}
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingEnumName(true);
              }}
              className={`text-left text-sm truncate max-w-[180px] transition-colors cursor-pointer hover:text-white ${expanded ? "text-white font-medium" : "text-neutral-200"}`}
            >
              {enumItem.name}
            </button>
          )}
        </div>
        <div
          className="ml-auto flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-neutral-500 font-mono">
            {enumValues.length}
          </span>
          <button
            type="button"
            onClick={() => onDeleteEnum(enumItem.name)}
            className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
            title="Delete enum"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      {/* Enum Values */}
      {expanded && (
        <div>
          {enumValues.map((value) => (
            <div
              key={value}
              className="flex items-center gap-2 px-3 py-1.5 ml-3 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shrink-0" />
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {editingValue === value ? (
                  <input
                    type="text"
                    defaultValue={value}
                    className="flex-1 min-w-0 h-5 px-1.5 text-[10px] font-mono leading-none bg-white/[0.06] border border-white/[0.08] rounded text-neutral-300 placeholder-neutral-600 outline-none focus:border-emerald-500/50 box-border text-xs"
                    onBlur={(e) => {
                      handleValueNameSubmit(
                        enumItem.name,
                        value,
                        e.target.value,
                      );
                      setEditingValue(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setEditingValue(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingValue(value)}
                    className="text-left text-xs text-neutral-300 font-mono truncate cursor-pointer hover:text-white transition-colors"
                  >
                    {value}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeValue(value)}
                className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                title="Delete value"
              >
                <DeleteIcon />
              </button>
            </div>
          ))}

          <button
            onClick={addValue}
            className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-2 text-neutral-500 hover:text-emerald-400 hover:bg-white/[0.04] transition-colors"
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
            <span className="text-xs">Add Value</span>
          </button>
        </div>
      )}
    </div>
  );
}

function EditorSidebar({
  tables,
  enums,
  onTablesChange,
  handleTableNameSubmit,
  handleColumnNameSubmit,
  handleEnumsChange,
  handleEnumNameSubmit,
  handleValueNameSubmit,
}: EditorSidebarProps) {
  const handleTableChange = (updated: Table) => {
    onTablesChange(tables.map((t) => (t.name === updated.name ? updated : t)));
  };

  const handleCreateTable = (name: string) => {
    const newTable: Table = {
      name,
      position: { x: 0, y: 0 },
      columns: [],
      indexes: [],
    };
    onTablesChange([...tables, newTable]);
  };

  const handleEnumChange = (updated: Enum) => {
    handleEnumsChange(
      enums.map((e) => (e.name === updated.name ? updated : e)),
    );
  };

  const handleCreateEnum = (name: string) => {
    handleEnumsChange([...enums, { name, values: [] }]);
  };

  const handleDeleteTable = (tableName: string) => {
    onTablesChange(tables.filter((t) => t.name !== tableName));
  };

  const handleDeleteEnum = (enumName: string) => {
    handleEnumsChange(enums.filter((e) => e.name !== enumName));
  };

  return (
    <div className="w-80 shrink-0 border-r border-white/[0.06] bg-black flex flex-col overflow-hidden">
      {/* Sidebar Header*/}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
          Tables
        </h3>
        <button
          onClick={() => handleCreateTable("New Table")}
          className="cursor-pointer text-neutral-500 hover:text-blue-400 transition-colors p-1 rounded-md hover:bg-white/[0.06]"
        >
          <svg
            className="w-4 h-4"
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

      {/*Sidebar Content*/}
      <div className="flex-1 overflow-y-auto px-4 ">
        <div className="space-y-2">
          {/* Requires Enums For Type Display */}
          {tables.map((table) => (
            <TableSection
              key={table.name}
              table={table}
              allTables={tables}
              enums={enums}
              onTableChange={handleTableChange}
              onDeleteTable={handleDeleteTable}
              handleTableNameSubmit={handleTableNameSubmit}
              handleColumnNameSubmit={handleColumnNameSubmit}
            />
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
              Enums
            </h3>
            <button
              onClick={() => handleCreateEnum("New Enum")}
              className="cursor-pointer text-neutral-500 hover:text-emerald-400 transition-colors p-1 rounded-md hover:bg-white/[0.06]"
            >
              <svg
                className="w-4 h-4"
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

          <div className="space-y-2 pb-2">
            {enums.map((enumItem) => (
              <EnumSection
                key={enumItem.name}
                enum={enumItem}
                onEnumChange={handleEnumChange}
                onDeleteEnum={handleDeleteEnum}
                handleEnumNameSubmit={handleEnumNameSubmit}
                handleValueNameSubmit={handleValueNameSubmit}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Export/Import SQL Buttons*/}
      <div className="p-3 border-t border-white/[0.06] space-y-2">
        <button className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] text-sm text-neutral-300 hover:bg-white/[0.1] hover:text-white transition-colors">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Export SQL
        </button>
        <button className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] text-sm text-neutral-300 hover:bg-white/[0.1] hover:text-white transition-colors">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Import SQL
        </button>
      </div>
    </div>
  );
}

export default memo(EditorSidebar);
