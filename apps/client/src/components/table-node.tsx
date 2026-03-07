import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Column, Index, Enum } from '@/types/schema';

interface TableNodeData {
    label: string;
    columns: Column[];
    indexes?: Index[];
    enums?: Enum[];
}

function ConstraintBadge({ text, color }: { text: string; color: string }) {
    return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${color}`}>
            {text}
        </span>
    );
}

function ColumnRow({ col, enums }: { col: Column; enums?: Enum[] }) {
    const displayType = enums?.some(e => e.name.toUpperCase() === col.type.toUpperCase()) ? col.type.toUpperCase() : col.type;
    return (
        <div className={`flex items-center gap-3 px-4 py-2 hover:bg-neutral-800/50 transition-colors ${col.primaryKey ? 'shadow-[inset_2px_0_0_0_rgba(245,158,11,0.6)] bg-amber-500/[0.03]' : ''}`}>
            {/* Column Details */}
            <div className="flex items-center gap-2 min-w-0 w-28 shrink">
                {col.primaryKey ? (
                    <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 8a4 4 0 0 1 7.465-2H14a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V9H7.465A4 4 0 0 1 0 8Zm4-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                    </svg>
                ) : col.references ? (
                    <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}
                <span className="text-xs text-neutral-200 truncate">{col.name}</span>
            </div>

            {/* Constraints */}
            <div className="flex items-center gap-1 w-[7rem] justify-end shrink-0 min-h-[20px]">
                {col.references && <ConstraintBadge text="FK" color="bg-blue-500/20 text-blue-400" />}
                {col.unique && <ConstraintBadge text="UQ" color="bg-cyan-500/20 text-cyan-400" />}
                {col.notNull && <ConstraintBadge text="NN" color="bg-red-500/20 text-red-400" />}
                {col.default !== undefined && <ConstraintBadge text="DF" color="bg-emerald-500/20 text-emerald-400" />}
            </div>

            {/* Column Type */}
            <span className="text-[11px] text-neutral-500 font-mono w-24 shrink-0 text-right">{displayType}</span>
        </div>
    );
}

function TableNode({ data }: { data: TableNodeData }) {
    const pkCols = data.columns.filter(c => c.primaryKey);
    const otherCols = data.columns.filter(c => !c.primaryKey);

    return (
        <div className="w-[320px] min-w-[320px] rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg overflow-hidden">
            {/* Handles */}
            <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-blue-300" />
            <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-blue-300" />

            {/* Table Name */}
            <div className="px-4 py-2.5 bg-neutral-800">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold text-sm text-white tracking-wide">{data.label}</span>
                </div>
            </div>

            {/* Columns */}
            <div className="divide-y divide-neutral-800">
                {pkCols.map(col => <ColumnRow key={col.name} col={col} enums={data.enums} />)}
                {otherCols.map(col => <ColumnRow key={col.name} col={col} enums={data.enums} />)}
            </div>

            {/* Indexes */}
            {(data.indexes?.length ?? 0) > 0 && (
                <div className="px-4 py-2.5 border-t border-neutral-800 bg-neutral-800/40">
                    <div className="space-y-2">
                        {data.indexes!.map(idx => (
                            <div
                                key={idx.name}
                                className="flex items-start gap-2 min-w-0"
                                title={`${idx.name} (${idx.indexedColumn})`}
                            >
                                <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-violet-500/60 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-mono text-neutral-400 block truncate">{idx.name}</span>
                                    <span className="text-[10px] font-mono text-neutral-600 block truncate">({idx.indexedColumn})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(TableNode);
