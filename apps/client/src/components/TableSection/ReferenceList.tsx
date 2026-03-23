import type { Table, Column, Reference } from "@/types/schema";

interface ReferenceListProps {
  table: Table;
  tableColumns: Column[];
  allTables: Table[];
  fkTargetTables: Table[];
  tableRefs: Reference[];
  updateTable: (updated: Table) => void;
}

export function ReferenceList({
  table,
  tableColumns,
  allTables,
  fkTargetTables,
  tableRefs,
  updateTable,
}: ReferenceListProps) {
  const addReference = () => {
    if (fkTargetTables.length === 0 || tableColumns.length === 0) return;
    const target = fkTargetTables[0];
    const targetCol = target.columns.find((c) => c.primaryKey) ?? target.columns[0];
    const localCol = tableColumns[0];
    const newRef: Reference = {
      localColumns: [localCol.name],
      referencedTable: target.name,
      referencedColumns: [targetCol.name],
    };
    updateTable({ ...table, references: [...tableRefs, newRef] });
  };

  const deleteReference = (refIdx: number) => {
    updateTable({ ...table, references: tableRefs.filter((_, i) => i !== refIdx) });
  };

  const updateReference = (refIdx: number, patch: Partial<Reference>) => {
    updateTable({
      ...table,
      references: tableRefs.map((r, i) => (i === refIdx ? { ...r, ...patch } : r)),
    });
  };

  const changeRefTable = (refIdx: number, newTableName: string) => {
    const target = allTables.find((t) => t.name === newTableName);
    if (!target) return;
    const targetCol = target.columns.find((c) => c.primaryKey) ?? target.columns[0];
    const ref = tableRefs[refIdx];
    updateReference(refIdx, {
      referencedTable: newTableName,
      referencedColumns: ref.localColumns.map(() => targetCol.name),
    });
  };

  const changeRefLocalCol = (refIdx: number, pairIdx: number, newCol: string) => {
    const ref = tableRefs[refIdx];
    const updated = [...ref.localColumns];
    updated[pairIdx] = newCol;
    updateReference(refIdx, { localColumns: updated });
  };

  const changeRefForeignCol = (refIdx: number, pairIdx: number, newCol: string) => {
    const ref = tableRefs[refIdx];
    const updated = [...ref.referencedColumns];
    updated[pairIdx] = newCol;
    updateReference(refIdx, { referencedColumns: updated });
  };

  const addRefPair = (refIdx: number) => {
    const ref = tableRefs[refIdx];
    const target = allTables.find((t) => t.name === ref.referencedTable);
    if (!target) return;
    const usedLocal = new Set(ref.localColumns);
    const usedForeign = new Set(ref.referencedColumns);
    const nextLocal = tableColumns.find((c) => !usedLocal.has(c.name))?.name;
    const nextForeign = target.columns.find((c) => !usedForeign.has(c.name))?.name;
    if (!nextLocal || !nextForeign) return;
    updateReference(refIdx, {
      localColumns: [...ref.localColumns, nextLocal],
      referencedColumns: [...ref.referencedColumns, nextForeign],
    });
  };

  const removeRefPair = (refIdx: number, pairIdx: number) => {
    const ref = tableRefs[refIdx];
    if (ref.localColumns.length <= 1) {
      deleteReference(refIdx);
      return;
    }
    updateReference(refIdx, {
      localColumns: ref.localColumns.filter((_, i) => i !== pairIdx),
      referencedColumns: ref.referencedColumns.filter((_, i) => i !== pairIdx),
    });
  };

  return (
    <div className="px-3 pt-1.5 pb-1.5 ml-3 border-t border-white/[0.06] space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          References
        </span>
        <button
          onClick={addReference}
          disabled={fkTargetTables.length === 0 || tableColumns.length === 0}
          className="cursor-pointer p-1 rounded text-neutral-500 hover:text-blue-400 hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-neutral-500"
          title="Add Foreign Key"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {tableRefs.length === 0 ? (
        <p className="text-[10px] text-neutral-600 italic py-1">No References</p>
      ) : (
        <div className="space-y-2">
          {tableRefs.map((ref, refIdx) => {
            const targetTable = allTables.find((t) => t.name === ref.referencedTable);
            const targetCols = targetTable?.columns ?? [];
            const isComposite = ref.localColumns.length > 1;
            const usedLocal = new Set(ref.localColumns);
            const usedForeign = new Set(ref.referencedColumns);
            const canAddPair =
              tableColumns.some((c) => !usedLocal.has(c.name)) &&
              targetCols.some((c) => !usedForeign.has(c.name));

            return (
              <div key={refIdx} className="rounded border border-white/[0.06] bg-white/[0.01] p-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-[10px] text-blue-400/70">&rarr;</span>
                  <select
                    value={ref.referencedTable}
                    onChange={(e) => changeRefTable(refIdx, e.target.value)}
                    className="bg-transparent text-[10px] text-neutral-400 font-mono border-none outline-none cursor-pointer hover:text-neutral-300 transition-colors"
                  >
                    {fkTargetTables.map((t) => (
                      <option key={t.name} value={t.name} className="bg-neutral-800 text-neutral-300">{t.name}</option>
                    ))}
                  </select>
                  {isComposite && (
                    <span className="text-[9px] text-blue-400/50 font-semibold uppercase">composite</span>
                  )}
                  <button
                    onClick={() => deleteReference(refIdx)}
                    className="ml-auto p-0.5 text-neutral-600 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                    title="Remove reference"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12" /></svg>
                  </button>
                </div>
                {ref.localColumns.map((localCol, pairIdx) => {
                  const otherLocalCols = new Set(ref.localColumns.filter((_, i) => i !== pairIdx));
                  const otherForeignCols = new Set(ref.referencedColumns.filter((_, i) => i !== pairIdx));
                  return (
                    <div key={pairIdx} className="flex items-center gap-1.5 pl-4">
                      <select
                        value={localCol}
                        onChange={(e) => changeRefLocalCol(refIdx, pairIdx, e.target.value)}
                        className="bg-transparent text-[10px] text-neutral-500 font-mono border-none outline-none cursor-pointer hover:text-neutral-300 transition-colors"
                      >
                        {tableColumns.filter((c) => c.name === localCol || !otherLocalCols.has(c.name)).map((c) => (
                          <option key={c.name} value={c.name} className="bg-neutral-800 text-neutral-300">{c.name}</option>
                        ))}
                      </select>
                      <span className="text-blue-400/50 text-[10px]">&rarr;</span>
                      <select
                        value={ref.referencedColumns[pairIdx] ?? ""}
                        onChange={(e) => changeRefForeignCol(refIdx, pairIdx, e.target.value)}
                        className="bg-transparent text-[10px] text-neutral-400 font-mono border-none outline-none cursor-pointer hover:text-neutral-300 transition-colors"
                      >
                        {targetCols.filter((c) => c.name === ref.referencedColumns[pairIdx] || !otherForeignCols.has(c.name)).map((c) => (
                          <option key={c.name} value={c.name} className="bg-neutral-800 text-neutral-300">{c.name}</option>
                        ))}
                      </select>
                      {isComposite && (
                        <button
                          onClick={() => removeRefPair(refIdx, pairIdx)}
                          className="p-0.5 text-neutral-600 hover:text-red-400 transition-colors cursor-pointer"
                          title="Remove column pair"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  );
                })}
                {canAddPair && (
                  <button
                    onClick={() => addRefPair(refIdx)}
                    className="flex items-center gap-1 pl-4 text-[10px] text-neutral-600 hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Reference Pair
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
