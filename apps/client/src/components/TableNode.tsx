import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';

import type { Column, Enum,Index } from '@/types/schema';

type TableNodeData = {
    label: string;
    columns: Column[];
    indexes: Index[];
    enums: Enum[];
    referencedColumns: string[];
    localFkColumns: string[];
};

type TableNodeProps = {
    data: TableNodeData;
};

type ColumnRowProps = {
    tableName: string;
    col: Column;
    enums: Enum[];
    referencedColumns: string[];
    localFkColumns: string[];
};

type ConstraintBadgeProps = {
    text: string;
    color: string;
};

function ConstraintBadge({ text, color }: ConstraintBadgeProps) {
    return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${color}`}>
            {text}
        </span>
    );
}

function ColumnRow({ tableName, col, enums, referencedColumns, localFkColumns }: ColumnRowProps) {
    const displayType = enums.some(e => e.name.toUpperCase() === col.type.toUpperCase()) ? col.type.toUpperCase() : col.type;
    const base = `${tableName}-${col.name}`;
    const needsSource = localFkColumns.includes(col.name);
    const needsTarget = referencedColumns.includes(col.name);
    const isFk = localFkColumns.includes(col.name);
    return (
        <div className={`relative flex items-center gap-3 px-4 py-2 hover:bg-white/[0.04] transition-colors ${col.primaryKey ? 'border-l-2 border-l-yellow-400/60 bg-yellow-400/[0.08]' : ''}`}>
            {needsSource && (
                <>
                    <Handle type="source" position={Position.Left} id={`${base}-source-left`} className="!w-2.5 !h-2.5 !opacity-0 pointer-events-none" />
                    <Handle type="source" position={Position.Right} id={`${base}-source-right`} className="!w-2.5 !h-2.5 !opacity-0 pointer-events-none" />
                </>
            )}
            {needsTarget && (
                <>
                    <Handle type="target" position={Position.Left} id={`${base}-target-left`} className="!w-2.5 !h-2.5 !opacity-0 pointer-events-none" />
                    <Handle type="target" position={Position.Right} id={`${base}-target-right`} className="!w-2.5 !h-2.5 !opacity-0 pointer-events-none" />
                </>
            )}
            {/* Column Details */}
            <div className="flex items-center gap-2 min-w-0 w-28 shrink">
                {col.primaryKey ? (
                    <svg className="w-3.5 h-3.5 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 8a4 4 0 0 1 7.465-2H14a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V9H7.465A4 4 0 0 1 0 8Zm4-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                    </svg>
                ) : isFk ? (
                    <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}
                <span className="text-xs text-white/90 truncate">{col.name}</span>
            </div>

            {/* Constraints */}
            <div className="flex items-center gap-1 shrink-0 min-h-[20px]">
                {isFk && <ConstraintBadge text="FK" color="bg-blue-500/20 text-blue-400" />}
                {col.unique && <ConstraintBadge text="UQ" color="bg-cyan-500/20 text-cyan-400" />}
                {col.notNull && <ConstraintBadge text="NN" color="bg-red-500/20 text-red-400" />}
                {col.default !== undefined && <ConstraintBadge text="DF" color="bg-emerald-500/20 text-emerald-400" />}
            </div>

            {/* Column Type - aligned far right */}
            <span className="ml-auto text-[11px] text-white/50 font-mono shrink-0 text-right">{displayType}</span>
        </div>
    );
}

function TableNode({ data }: TableNodeProps) {
    const { label, columns, indexes, enums, referencedColumns, localFkColumns } = data;
    const pkCols = columns.filter(c => c.primaryKey);
    const otherCols = columns.filter(c => !c.primaryKey);

    return (
        <div className="w-[320px] min-w-[320px] rounded-lg border border-white/[0.12] bg-[#050505] overflow-hidden">
            {/* Table Name */}
            <div className="px-4 py-2.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold text-sm text-white tracking-wide">{label}</span>
                </div>
            </div>

            {/* Columns */}
            <div className="divide-y divide-white/[0.06]">
                {pkCols.map(col => <ColumnRow key={col.name} tableName={label} col={col} enums={enums} referencedColumns={referencedColumns} localFkColumns={localFkColumns} />)}
                {otherCols.map(col => <ColumnRow key={col.name} tableName={label} col={col} enums={enums} referencedColumns={referencedColumns} localFkColumns={localFkColumns} />)}
            </div>

            {/* Indexes */}
            {indexes.length > 0 && (
                <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02]">
                    <div className="space-y-2">
                        {indexes.map(idx => (
                            <div
                                key={idx.name}
                                className="flex items-start gap-2 min-w-0"
                            >
                                <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-white/40 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-mono text-white/60 block truncate">{idx.name}</span>
                                    <span className="text-[10px] font-mono text-white/40 block truncate">({idx.indexedColumns?.join(", ")})</span>
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
