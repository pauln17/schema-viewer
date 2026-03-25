import type { Table } from "@/types/schema";

type CheckListProps = {
  table: Table;
  tableChecks: string[];
  updateTable: (updated: Table) => void;
};

export function CheckList({ table, tableChecks, updateTable }: CheckListProps) {
  const addCheck = () => {
    updateTable({ ...table, checks: [...tableChecks, ""] });
  };

  const updateCheck = (idx: number, expr: string) => {
    const updated = [...tableChecks];
    updated[idx] = expr;
    updateTable({ ...table, checks: updated });
  };

  const deleteCheck = (idx: number) => {
    updateTable({ ...table, checks: tableChecks.filter((_, i) => i !== idx) });
  };

  return (
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
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {tableChecks.length === 0 ? (
        <p className="text-[10px] text-neutral-600 italic py-1">No Checks</p>
      ) : (
        <div className="space-y-1.5">
          {tableChecks.map((expr, idx) => (
            <div key={idx} className="flex items-center gap-2 group">
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
  );
}
