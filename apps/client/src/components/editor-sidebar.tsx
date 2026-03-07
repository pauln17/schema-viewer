import { useState, memo } from 'react';
import type { Column, Table, Enum, Index } from '@/types/schema';

interface EditorSidebarProps {
    tables: Table[];
    enums: Enum[];
    indexes: Index[];
    onTablesChange: (tables: Table[]) => void;
    onIndexesChange: (indexes: Index[]) => void;
}

interface TableSectionProps {
    table: Table;
    allTables: Table[];
    enums: Enum[];
    indexes: Index[];
    onTableChange: (updated: Table) => void;
    onIndexesChange: (indexes: Index[]) => void;
}

const SQL_TYPES = ['UUID', 'VARCHAR', 'TEXT', 'INTEGER', 'BIGINT', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'FLOAT', 'DECIMAL', 'JSON'];

const CONSTRAINT_STYLES: Record<string, { on: string; off: string }> = {
    NN: { on: 'bg-red-500/20 text-red-400', off: 'bg-white/[0.04] text-neutral-600 hover:text-red-400/60' },
    UQ: { on: 'bg-cyan-500/20 text-cyan-400', off: 'bg-white/[0.04] text-neutral-600 hover:text-cyan-400/60' },
    DEFAULT: { on: 'bg-emerald-500/20 text-emerald-400', off: 'bg-white/[0.04] text-neutral-600 hover:text-emerald-400/60' },
};

function ConstraintToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    const style = CONSTRAINT_STYLES[label];
    return (
        <button onClick={onClick} className={`cursor-pointer px-2 py-0.5 rounded text-center text-[10px] font-semibold transition-colors whitespace-nowrap ${active ? style.on : style.off}`}>
            {label}
        </button>
    );
}

function TableSection({ table, allTables, enums, indexes, onTableChange, onIndexesChange }: TableSectionProps) {
    const [expanded, setExpanded] = useState(false);

    // Primary Key Columns for Header Badge + Enum Names (always uppercase for display)
    const pkColumns = new Set(table.columns.filter(c => c.primaryKey).map(c => c.name));
    const enumNames = enums.map(e => e.name.toUpperCase());

    // Updates Column in Table By Accepting a Partial<Column> Input (Everything is Optional -> Only Updates Fields Given) -> Returns Updated Table Object
    const updateColumn = (colName: string, patch: Partial<Column>) => {
        onTableChange({
            ...table,
            columns: table.columns.map(c => c.name === colName ? { ...c, ...patch } : c),
        });
    };

    // Toggling PK, FK, Constraints Buttons
    const togglePk = (colName: string) => {
        const col = table.columns.find(c => c.name === colName);
        if (col) updateColumn(colName, { primaryKey: !col.primaryKey });
    };

    const toggleFk = (colName: string) => {
        const col = table.columns.find(c => c.name === colName);
        if (!col) return;
        if (col.references) {
            updateColumn(colName, { references: undefined });
        } else {
            const targets = allTables.filter(t => t.name !== table.name);
            if (targets.length === 0) return;
            const target = targets[0];
            const targetCol = target.columns.find(c => c.primaryKey) ?? target.columns[0];
            updateColumn(colName, { references: { table: target.name, column: targetCol.name } });
        }
    };

    const toggleConstraint = (colName: string, field: 'notNull' | 'unique') => {
        const col = table.columns.find(c => c.name === colName);
        if (col) updateColumn(colName, { [field]: !col[field] });
    };


    const changeFkTable = (colName: string, newTable: string) => {
        const target = allTables.find(t => t.name === newTable);
        if (!target) return;
        const targetCol = target.columns.find(c => c.primaryKey) ?? target.columns[0];
        updateColumn(colName, { references: { table: newTable, column: targetCol.name } });
    };

    const changeFkColumn = (colName: string, newCol: string) => {
        const col = table.columns.find(c => c.name === colName);
        if (!col?.references) return;
        updateColumn(colName, { references: { table: col.references.table, column: newCol } });
    };

    // Changing Column Type
    const changeType = (colName: string, type: string) => {
        updateColumn(colName, { type });
    };

    // Toggling Default Value
    const toggleDefault = (colName: string) => {
        const col = table.columns.find(c => c.name === colName);
        if (col) updateColumn(colName, { default: col.default !== undefined ? undefined : '' });
    };

    const fkTargetTables = allTables.filter(t => t.name !== table.name);
    const tableIndexes = indexes.filter(i => i.table === table.name);

    const addIndex = () => {
        const name = `idx_${table.name}_${tableIndexes.length + 1}`;
        const firstCol = table.columns[0]?.name ?? 'id';
        onIndexesChange([...indexes, { table: table.name, columns: [firstCol], name }]);
    };

    const updateIndex = (idxName: string, patch: Partial<Index>) => {
        onIndexesChange(indexes.map(i => i.name === idxName ? { ...i, ...patch } : i));
    };

    const removeIndex = (idxName: string) => {
        onIndexesChange(indexes.filter(i => i.name !== idxName));
    };

    return (
        <div className={`rounded-lg overflow-hidden border transition-colors ${expanded ? 'border-white/[0.1] bg-white/[0.02]' : 'border-white/[0.06]'}`}>

            {/* Table Header*/}
            <button
                onClick={() => setExpanded(!expanded)}
                className={`cursor-pointer group w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${expanded ? 'bg-white/[0.05] border-b border-white/[0.06]' : 'hover:bg-white/[0.04]'}`}
            >
                <svg
                    className={`w-3 h-3 text-neutral-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className={`text-sm truncate transition-colors ${expanded ? 'text-white font-medium' : 'text-neutral-200 group-hover:text-white'}`}>{table.name}</span>
                <div className="ml-auto flex items-center gap-1.5">
                    {pkColumns.size > 0 && (
                        <span className="text-[10px] font-mono bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                            {pkColumns.size === 1
                                ? [...pkColumns][0]
                                : `(${[...pkColumns].join(', ')})`
                            }
                        </span>
                    )}
                    <span className="text-[10px] text-neutral-500 font-mono">{table.columns.length}</span>
                </div>
            </button>

            {/* Columns*/}
            {expanded && (
                <div>
                    {table.columns.map((col) => (
                        <div key={col.name} className="px-3 py-2.5 ml-3 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    <button
                                        onClick={() => togglePk(col.name)}
                                        className={`cursor-pointer shrink-0 transition-colors ${pkColumns.has(col.name) ? 'text-amber-400' : 'text-neutral-700 hover:text-amber-400/60'}`}
                                        title={pkColumns.has(col.name) ? 'Remove from primary key' : 'Add to primary key'}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M0 8a4 4 0 0 1 7.465-2H14a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V9H7.465A4 4 0 0 1 0 8Zm4-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => toggleFk(col.name)}
                                        className={`cursor-pointer shrink-0 transition-colors ${col.references ? 'text-blue-400' : 'text-neutral-700 hover:text-blue-400/60'}`}
                                        title={col.references ? 'Remove foreign key' : 'Add foreign key'}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                    </button>
                                    <span className="text-xs text-neutral-200 truncate">{col.name}</span>
                                </div>
                                {/* Dropdown Menu for Data/Enum Type */}
                                <div className="relative inline-flex items-center shrink-0">
                                    {(() => {
                                        const isEnumType = enumNames.includes(col.type.toUpperCase());
                                        const normalizedType = isEnumType ? col.type.toUpperCase() : col.type;
                                        return (
                                            <select
                                                value={normalizedType}
                                                onChange={(e) => changeType(col.name, e.target.value)}
                                                className="appearance-none bg-transparent text-[11px] text-neutral-500 font-mono border-none outline-none cursor-pointer hover:text-neutral-300 transition-colors pr-3.5 pl-0"
                                                style={{ width: `${normalizedType.length + 3}ch` }}
                                            >
                                                <optgroup label="Data Types" className="bg-neutral-800 text-neutral-400">
                                                    {SQL_TYPES.map(t => (
                                                        <option key={t} value={t} className="bg-neutral-800 text-neutral-300">{t}</option>
                                                    ))}
                                                </optgroup>
                                                {enumNames.length > 0 && (
                                                    <optgroup label="Enums" className="bg-neutral-800 text-neutral-400">
                                                        {enumNames.map(e => (
                                                            <option key={e} value={e} className="bg-neutral-800 text-neutral-300">{e}</option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                            </select>
                                        );
                                    })()}
                                    <svg className="absolute right-0 w-3 h-3 pointer-events-none text-neutral-600" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5l3 3 3-3" />
                                    </svg>
                                </div>
                            </div>

                            {/* Constraints Buttons*/}
                            <div className="flex items-center gap-1">
                                <ConstraintToggle label="NN" active={!!col.notNull} onClick={() => toggleConstraint(col.name, 'notNull')} />
                                <ConstraintToggle label="UQ" active={!!col.unique} onClick={() => toggleConstraint(col.name, 'unique')} />
                                <ConstraintToggle label="DEFAULT" active={col.default !== undefined} onClick={() => toggleDefault(col.name)} />
                            </div>

                            {/* Dropdown Menu for FK Target Table and Column */}
                            {col.references && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-blue-400 text-[10px]">&rarr;</span>
                                    <select
                                        value={col.references.table}
                                        onChange={(e) => changeFkTable(col.name, e.target.value)}
                                        className="bg-transparent text-[10px] text-neutral-400 font-mono border-none outline-none cursor-pointer hover:text-neutral-300 transition-colors"
                                    >
                                        {fkTargetTables.map(t => (
                                            <option key={t.name} value={t.name} className="bg-neutral-800 text-neutral-300">{t.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={col.references.column}
                                        onChange={(e) => changeFkColumn(col.name, e.target.value)}
                                        className="bg-transparent text-[10px] text-neutral-400 font-mono border-none outline-none cursor-pointer hover:text-neutral-300 transition-colors"
                                    >
                                        {(allTables.find(t => t.name === col.references!.table)?.columns ?? []).map(c => (
                                            <option key={c.name} value={c.name} className="bg-neutral-800 text-neutral-300">{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Indexes */}
                    <div className="px-3 pt-1 pb-1 ml-3 border-t border-white/[0.06] space-y-1.5 -mt-px">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Indexes</span>
                            <button
                                onClick={addIndex}
                                className="cursor-pointer p-1 rounded text-neutral-500 hover:text-violet-400 hover:bg-white/[0.06] transition-colors"
                                title="Add index"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                        {indexes.filter(i => i.table === table.name).length === 0 ? (
                            <p className="text-[10px] text-neutral-600 italic py-1">No Indexes</p>
                        ) : (
                            <div className="space-y-1.5">
                                {indexes.filter(i => i.table === table.name).map(idx => {
                                    const col = idx.columns[0] ?? '';
                                    const handleColumnChange = (newCol: string) => {
                                        const baseName = `idx_${table.name}_${newCol}`;
                                        const taken = new Set(tableIndexes.filter(i => i.name !== idx.name).map(i => i.name));
                                        let name = baseName;
                                        for (let n = 2; taken.has(name); n++) name = `${baseName}_${n}`;
                                        updateIndex(idx.name, { columns: [newCol], name });
                                    };
                                    return (
                                        <div key={idx.name} className="flex items-center gap-2 group">
                                            <select
                                                value={col}
                                                onChange={(e) => handleColumnChange(e.target.value)}
                                                className="flex-1 min-w-0 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1 text-[10px] font-mono text-neutral-400 outline-none focus:border-violet-500/50 cursor-pointer"
                                            >
                                                {table.columns.map(c => (
                                                    <option key={c.name} value={c.name} className="bg-neutral-800">{c.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => removeIndex(idx.name)}
                                                className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                                                title="Remove index"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Add Column */}
                    <button className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-2 text-neutral-500 hover:text-blue-400 hover:bg-white/[0.04] transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs">Add Column</span>
                    </button>
                </div>
            )}
        </div>
    );
}

function EnumSection({ enumDef }: { enumDef: Enum }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`rounded-lg overflow-hidden border transition-colors ${expanded ? 'border-white/[0.1] bg-white/[0.02]' : 'border-white/[0.06]'}`}>
            {/* Enum Header*/}
            <button
                onClick={() => setExpanded(!expanded)}
                className={`cursor-pointer group w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${expanded ? 'bg-white/[0.05] border-b border-white/[0.06]' : 'hover:bg-white/[0.04]'}`}
            >
                <svg
                    className={`w-3 h-3 text-neutral-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className={`text-sm truncate transition-colors ${expanded ? 'text-white font-medium' : 'text-neutral-200 group-hover:text-white'}`}>{enumDef.name}</span>
                <span className="ml-auto text-[10px] text-neutral-500 font-mono">{enumDef.values.length}</span>
            </button>

            {/* Enum Values*/}
            {expanded && (
                <div>
                    {enumDef.values.map((value) => (
                        <div key={value} className="flex items-center gap-2 px-3 py-1.5 ml-3 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shrink-0" />
                            <span className="text-xs text-neutral-300 font-mono">{value}</span>
                        </div>
                    ))}

                    <button className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-2 text-neutral-500 hover:text-emerald-400 hover:bg-white/[0.04] transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs">Add Value</span>
                    </button>
                </div>
            )}
        </div>
    );
}

function EditorSidebar({ tables, enums, indexes, onTablesChange, onIndexesChange }: EditorSidebarProps) {

    const handleTableChange = (updated: Table) => {
        onTablesChange(tables.map(t => t.name === updated.name ? updated : t));
    };

    return (
        <div className="w-80 shrink-0 border-r border-white/[0.06] bg-black flex flex-col overflow-hidden">
            {/* Sidebar Header*/}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Tables</h3>
                <button className="cursor-pointer text-neutral-500 hover:text-blue-400 transition-colors p-1 rounded-md hover:bg-white/[0.06]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/*Sidebar Content*/}
            <div className="flex-1 overflow-y-auto px-4 ">
                <div className="space-y-2">
                    {/* Requires Enums For Type Display */}
                    {tables.map((table) => (
                        <TableSection key={table.name} table={table} allTables={tables} enums={enums} indexes={indexes} onTableChange={handleTableChange} onIndexesChange={onIndexesChange} />
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Enums</h3>
                        <button className="cursor-pointer text-neutral-500 hover:text-emerald-400 transition-colors p-1 rounded-md hover:bg-white/[0.06]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-2 pb-2">
                        {enums.map((enumDef) => (
                            <EnumSection key={enumDef.name} enumDef={enumDef} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Export/Import SQL Buttons*/}
            <div className="p-3 border-t border-white/[0.06] space-y-2">
                <button className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] text-sm text-neutral-300 hover:bg-white/[0.1] hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Export SQL
                </button>
                <button className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] text-sm text-neutral-300 hover:bg-white/[0.1] hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Import SQL
                </button>
            </div>
        </div>
    );
}

export default memo(EditorSidebar);
