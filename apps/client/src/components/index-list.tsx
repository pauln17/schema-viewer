import { useState } from "react";

import { useSchemaActions } from "@/hooks/useSchemaActions";
import type { Schema, Table } from "@/types/schema";

export function IndexList({ table, schema, token }: { table: Table; schema: Schema; token: string | undefined }) {
  const { addIndex, deleteIndex, addIndexColumn, removeIndexColumn } = useSchemaActions(schema, token);

  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const tableColumns = table.columns ?? [];
  const tableIndexes = table.indexes ?? [];

  return (
    <div className="px-3 pt-1.5 pb-1.5 border-t border-white/[0.06] space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          Indexes
        </span>
        <button
          onClick={() => {
            const name = addIndex(table.name);
            if (name) setExpandedIndex(name);
          }}
          disabled={tableColumns.length === 0}
          className="cursor-pointer p-1 rounded text-neutral-500 hover:text-violet-400 hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-neutral-500"
          title="Add Index"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {tableIndexes.length === 0 ? (
        <p className="text-[10px] text-neutral-600 italic py-1">No Indexes</p>
      ) : (
        <div className="space-y-1">
          {tableIndexes.map((idx) => {
            const cols = idx.indexedColumns ?? [];
            const isExpanded = expandedIndex === idx.name;
            const colSummary = cols.length > 0 ? `(${cols.join(", ")})` : "(none)";
            const availableCols = tableColumns.filter((c) => !cols.includes(c.name));

            return (
              <div
                key={idx.name}
                className={`rounded border transition-colors ${isExpanded ? "border-white/[0.1] bg-white/[0.02]" : "border-transparent"}`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedIndex(isExpanded ? null : idx.name)}
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
                    <span className="text-neutral-600 ml-1">{colSummary}</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (expandedIndex === idx.name) setExpandedIndex(null);
                      deleteIndex(table.name, idx.name);
                    }}
                    className="p-0.5 text-neutral-600 hover:text-red-400 transition-colors shrink-0 cursor-pointer opacity-0 group-hover/idx:opacity-100"
                    title="Remove Index"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12" /></svg>
                  </button>
                </div>

                {isExpanded && (
                  <div className="pl-5 pr-1.5 pb-2 pt-0.5 space-y-1">
                    {cols.length === 0 ? (
                      <p className="text-[9px] text-neutral-600 italic">No columns — pick one below</p>
                    ) : (
                      cols.map((colName) => (
                        <div key={colName} className="flex items-center gap-1.5 group/col">
                          <span className="w-1 h-1 rounded-full bg-neutral-600 shrink-0" />
                          <span className="text-[10px] font-mono text-neutral-300 flex-1 truncate">{colName}</span>
                          <button
                            onClick={() => {
                              const newName = removeIndexColumn(table.name, idx.name, colName);
                              if (newName) setExpandedIndex(newName);
                            }}
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
                          const newName = addIndexColumn(table.name, idx.name, col);
                          if (newName) setExpandedIndex(newName);
                        }}
                        className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 text-[10px] font-mono text-neutral-500 outline-none cursor-pointer mt-1"
                      >
                        <option value="" className="bg-neutral-800">+ Add Column…</option>
                        {availableCols.map((c) => (
                          <option key={c.name} value={c.name} className="bg-neutral-800">{c.name}</option>
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
  );
}
