import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { type Socket } from "socket.io-client";

import type { Column, Enum, Index, Reference, Schema, Table } from "@/types/schema";

export const useSchemaActions = (schema: Schema, token: string | undefined, socket: Socket | undefined) => {
  const queryClient = useQueryClient();
  const { tables, enums } = schema.definition;

  const emitData = useCallback(() => {
    if (socket) {
      const data = queryClient.getQueryData(["schema", token]);
      if (!data) return;
      socket.emit("schema", data)
    }
  }, [socket, queryClient, token]);

  const setSchema = useCallback(
    (patch: Partial<Schema>) => {
      queryClient.setQueryData(["schema", token], { ...schema, ...patch })
      emitData();
    },
    [queryClient, schema, token],
  );

  const setDefinition = useCallback(
    (tablesPatch: Table[], enumsPatch: Enum[]) => {
      setSchema({ definition: { tables: tablesPatch, enums: enumsPatch } })
    },
    [setSchema],
  );

  const renameSchema = useCallback(
    (name: string) => setSchema({ name }),
    [setSchema],
  );

  const createTable = useCallback(() => {
    const base = "table";
    let name = base;
    let n = 0;
    while (tables.some((t) => t.name === name)) {
      n += 1;
      name = `${base}_${n}`;
    }
    setDefinition(
      [
        ...tables,
        { name, position: { x: 0, y: 0 }, columns: [], indexes: [], keys: [], checks: [], references: [] },
      ],
      enums,
    );
  }, [tables, enums, setDefinition]);

  const updateTable = useCallback(
    (updated: Table) =>
      setDefinition(
        tables.map((t) => (t.name === updated.name ? updated : t)),
        enums,
      ),
    [tables, enums, setDefinition],
  );

  const deleteTable = useCallback(
    (tableName: string) =>
      setDefinition(
        tables.filter((t) => t.name !== tableName),
        enums,
      ),
    [tables, enums, setDefinition],
  );

  const renameTable = useCallback(
    (oldName: string, newName: string) => {
      const updated = tables.map((t) => {
        const renamed = t.name === oldName ? { ...t, name: newName } : t;
        return {
          ...renamed,
          references: (renamed.references ?? []).map((r) =>
            r.referencedTable === oldName ? { ...r, referencedTable: newName } : r,
          ),
        };
      });
      setDefinition(updated, enums);
    },
    [tables, enums, setDefinition],
  );

  const addColumn = useCallback(
    (tableName: string) => {
      const table = tables.find((t) => t.name === tableName);
      if (!table) return;
      const cols = table.columns ?? [];
      const base = "column";
      let name = base;
      let n = 0;
      while (cols.some((c) => c.name === name)) {
        n += 1;
        name = `${base}_${n}`;
      }
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? { ...t, columns: [...cols, { name, type: "TEXT" }] }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const updateColumn = useCallback(
    (tableName: string, colName: string, patch: Partial<Column>) => {
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              columns: (t.columns ?? []).map((c) =>
                c.name === colName ? { ...c, ...patch } : c,
              ),
            }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const deleteColumn = useCallback(
    (tableName: string, colName: string) => {
      const table = tables.find((t) => t.name === tableName);
      if (!table) return;

      const updatedIndexes = (table.indexes ?? [])
        .map((i) => ({
          ...i,
          indexedColumns: (i.indexedColumns ?? []).filter((c) => c !== colName),
        }))
        .filter((i) => i.indexedColumns.length > 0);

      const updatedRefs = (table.references ?? [])
        .map((r) => ({
          ...r,
          localColumns: r.localColumns.filter((c) => c !== colName),
          referencedColumns: r.referencedColumns.filter(
            (_, i) => r.localColumns[i] !== colName,
          ),
        }))
        .filter((r) => r.localColumns.length > 0);

      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              columns: (t.columns ?? []).filter((c) => c.name !== colName),
              indexes: updatedIndexes,
              references: updatedRefs,
            }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const renameColumn = useCallback(
    (tableName: string, oldName: string, newName: string) => {
      const updated = tables.map((t) => {
        if (t.name === tableName) {
          return {
            ...t,
            columns: t.columns.map((c) =>
              c.name === oldName ? { ...c, name: newName } : c,
            ),
            references: (t.references ?? []).map((r) => ({
              ...r,
              localColumns: r.localColumns.map((c) => (c === oldName ? newName : c)),
            })),
          };
        }
        return {
          ...t,
          references: (t.references ?? []).map((r) =>
            r.referencedTable !== tableName
              ? r
              : {
                ...r,
                referencedColumns: r.referencedColumns.map((c) =>
                  c === oldName ? newName : c,
                ),
              },
          ),
        };
      });
      setDefinition(updated, enums);
    },
    [tables, enums, setDefinition],
  );

  const addIndex = useCallback(
    (tableName: string) => {
      const table = tables.find((t) => t.name === tableName);
      if (!table) return undefined;
      const name = `${tableName}_untitled_idx`;
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? { ...t, indexes: [...(t.indexes ?? []), { indexedColumns: [], name }] }
            : t,
        ),
        enums,
      );
      return name;
    },
    [tables, enums, setDefinition],
  );

  const updateIndex = useCallback(
    (tableName: string, idxName: string, patch: Partial<Index>) => {
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              indexes: (t.indexes ?? []).map((i) =>
                i.name === idxName ? { ...i, ...patch } : i,
              ),
            }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const deleteIndex = useCallback(
    (tableName: string, idxName: string) => {
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? { ...t, indexes: (t.indexes ?? []).filter((i) => i.name !== idxName) }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const addIndexColumn = useCallback(
    (tableName: string, idxName: string, colName: string) => {
      const table = tables.find((t) => t.name === tableName);
      if (!table) return undefined;
      const idx = (table.indexes ?? []).find((i) => i.name === idxName);
      if (!idx) return undefined;
      const cols = [...(idx.indexedColumns ?? []), colName];
      const newName = cols.length > 0 ? `${tableName}_${cols.join("_")}_idx` : `${tableName}_untitled_idx`;
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              indexes: (t.indexes ?? []).map((i) =>
                i.name === idxName
                  ? { ...i, indexedColumns: cols, name: newName }
                  : i,
              ),
            }
            : t,
        ),
        enums,
      );
      return newName;
    },
    [tables, enums, setDefinition],
  );

  const removeIndexColumn = useCallback(
    (tableName: string, idxName: string, colName: string) => {
      const table = tables.find((t) => t.name === tableName);
      if (!table) return undefined;
      const idx = (table.indexes ?? []).find((i) => i.name === idxName);
      if (!idx) return undefined;
      const cols = (idx.indexedColumns ?? []).filter((c) => c !== colName);
      const newName = cols.length > 0 ? `${tableName}_${cols.join("_")}_idx` : `${tableName}_untitled_idx`;
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              indexes: (t.indexes ?? []).map((i) =>
                i.name === idxName
                  ? { ...i, indexedColumns: cols, name: newName }
                  : i,
              ),
            }
            : t,
        ),
        enums,
      );
      return newName;
    },
    [tables, enums, setDefinition],
  );

  const addReference = useCallback(
    (tableName: string) => {
      const table = tables.find((t) => t.name === tableName);
      if (!table) return;
      const tableColumns = table.columns ?? [];
      const fkTargetTables = tables.filter((t) => t.name !== tableName);
      if (fkTargetTables.length === 0 || tableColumns.length === 0) return;
      const target = fkTargetTables[0];
      const targetCol =
        target.columns.find((c) => c.primaryKey) ?? target.columns[0];
      const localCol = tableColumns[0];
      const newRef: Reference = {
        localColumns: [localCol.name],
        referencedTable: target.name,
        referencedColumns: [targetCol.name],
      };
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? { ...t, references: [...(t.references ?? []), newRef] }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const deleteReference = useCallback(
    (tableName: string, refIdx: number) => {
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              references: (t.references ?? []).filter((_, i) => i !== refIdx),
            }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const updateReference = useCallback(
    (tableName: string, refIdx: number, patch: Partial<Reference>) => {
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              references: (t.references ?? []).map((r, i) =>
                i === refIdx ? { ...r, ...patch } : r,
              ),
            }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const changeRefTable = useCallback(
    (tableName: string, refIdx: number, newTableName: string) => {
      const table = tables.find((t) => t.name === tableName);
      if (!table) return;
      const target = tables.find((t) => t.name === newTableName);
      if (!target) return;
      const refs = table.references ?? [];
      const ref = refs[refIdx];
      if (!ref) return;
      const targetCol =
        target.columns.find((c) => c.primaryKey) ?? target.columns[0];
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              references: refs.map((r, i) =>
                i === refIdx
                  ? {
                    ...r,
                    referencedTable: newTableName,
                    referencedColumns: ref.localColumns.map(
                      () => targetCol.name,
                    ),
                  }
                  : r,
              ),
            }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const changeRefLocalCol = useCallback(
    (tableName: string, refIdx: number, pairIdx: number, newCol: string) => {
      const table = tables.find((t) => t.name === tableName);
      if (!table) return;
      const refs = table.references ?? [];
      const ref = refs[refIdx];
      if (!ref) return;
      const updated = [...ref.localColumns];
      updated[pairIdx] = newCol;
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              references: refs.map((r, i) =>
                i === refIdx ? { ...r, localColumns: updated } : r,
              ),
            }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const changeRefForeignCol = useCallback(
    (tableName: string, refIdx: number, pairIdx: number, newCol: string) => {
      const table = tables.find((t) => t.name === tableName);
      if (!table) return;
      const refs = table.references ?? [];
      const ref = refs[refIdx];
      if (!ref) return;
      const updated = [...ref.referencedColumns];
      updated[pairIdx] = newCol;
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              references: refs.map((r, i) =>
                i === refIdx ? { ...r, referencedColumns: updated } : r,
              ),
            }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const addRefPair = useCallback(
    (tableName: string, refIdx: number) => {
      const table = tables.find((t) => t.name === tableName);
      if (!table) return;
      const refs = table.references ?? [];
      const ref = refs[refIdx];
      if (!ref) return;
      const target = tables.find((t) => t.name === ref.referencedTable);
      if (!target) return;
      const tableColumns = table.columns ?? [];
      const usedLocal = new Set(ref.localColumns);
      const usedForeign = new Set(ref.referencedColumns);
      const nextLocal = tableColumns.find(
        (c) => !usedLocal.has(c.name),
      )?.name;
      const nextForeign = target.columns.find(
        (c) => !usedForeign.has(c.name),
      )?.name;
      if (!nextLocal || !nextForeign) return;
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              references: refs.map((r, i) =>
                i === refIdx
                  ? {
                    ...r,
                    localColumns: [...r.localColumns, nextLocal],
                    referencedColumns: [...r.referencedColumns, nextForeign],
                  }
                  : r,
              ),
            }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const removeRefPair = useCallback(
    (tableName: string, refIdx: number, pairIdx: number) => {
      const table = tables.find((t) => t.name === tableName);
      if (!table) return;
      const refs = table.references ?? [];
      const ref = refs[refIdx];
      if (!ref) return;
      if (ref.localColumns.length <= 1) {
        setDefinition(
          tables.map((t) =>
            t.name === tableName
              ? { ...t, references: refs.filter((_, i) => i !== refIdx) }
              : t,
          ),
          enums,
        );
        return;
      }
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              references: refs.map((r, i) =>
                i === refIdx
                  ? {
                    ...r,
                    localColumns: r.localColumns.filter(
                      (_, j) => j !== pairIdx,
                    ),
                    referencedColumns: r.referencedColumns.filter(
                      (_, j) => j !== pairIdx,
                    ),
                  }
                  : r,
              ),
            }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const addCheck = useCallback(
    (tableName: string) => {
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? { ...t, checks: [...(t.checks ?? []), ""] }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const updateCheck = useCallback(
    (tableName: string, idx: number, expr: string) => {
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              checks: (t.checks ?? []).map((c, i) => (i === idx ? expr : c)),
            }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const deleteCheck = useCallback(
    (tableName: string, idx: number) => {
      setDefinition(
        tables.map((t) =>
          t.name === tableName
            ? { ...t, checks: (t.checks ?? []).filter((_, i) => i !== idx) }
            : t,
        ),
        enums,
      );
    },
    [tables, enums, setDefinition],
  );

  const createEnum = useCallback(() => {
    const base = "enum";
    let name = base;
    let n = 0;
    while (enums.some((e) => e.name === name)) {
      n += 1;
      name = `${base}_${n}`;
    }
    setDefinition(tables, [...enums, { name, options: [] }]);
  }, [tables, enums, setDefinition]);

  const updateEnum = useCallback(
    (updated: Enum) =>
      setDefinition(
        tables,
        enums.map((e) => (e.name === updated.name ? updated : e)),
      ),
    [tables, enums, setDefinition],
  );

  const deleteEnum = useCallback(
    (enumName: string) =>
      setDefinition(
        tables,
        enums.filter((e) => e.name !== enumName),
      ),
    [tables, enums, setDefinition],
  );

  const renameEnum = useCallback(
    (oldName: string, newName: string) =>
      setDefinition(
        tables,
        enums.map((e) => (e.name === oldName ? { ...e, name: newName } : e)),
      ),
    [tables, enums, setDefinition],
  );

  const renameEnumOption = useCallback(
    (enumName: string, oldName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;
      setDefinition(
        tables,
        enums.map((e) =>
          e.name === enumName
            ? {
              ...e,
              options: (e.options ?? []).map((v) =>
                v === oldName ? trimmed : v,
              ),
            }
            : e,
        ),
      );
    },
    [tables, enums, setDefinition],
  );

  const addEnumOption = useCallback(
    (enumName: string) => {
      const enumItem = enums.find((e) => e.name === enumName);
      if (!enumItem) return;
      const options = enumItem.options ?? [];
      const base = "option";
      let name = base;
      let n = 0;
      while (options.some((v) => v === name)) {
        n += 1;
        name = `${base}_${n}`;
      }
      setDefinition(
        tables,
        enums.map((e) =>
          e.name === enumName ? { ...e, options: [...options, name] } : e,
        ),
      );
    },
    [tables, enums, setDefinition],
  );

  const removeEnumOption = useCallback(
    (enumName: string, value: string) => {
      setDefinition(
        tables,
        enums.map((e) =>
          e.name === enumName
            ? { ...e, options: (e.options ?? []).filter((v) => v !== value) }
            : e,
        ),
      );
    },
    [tables, enums, setDefinition],
  );

  return {
    renameSchema,
    createTable,
    updateTable,
    deleteTable,
    renameTable,
    addColumn,
    updateColumn,
    deleteColumn,
    renameColumn,
    addIndex,
    updateIndex,
    deleteIndex,
    addIndexColumn,
    removeIndexColumn,
    addReference,
    deleteReference,
    updateReference,
    changeRefTable,
    changeRefLocalCol,
    changeRefForeignCol,
    addRefPair,
    removeRefPair,
    addCheck,
    updateCheck,
    deleteCheck,
    createEnum,
    updateEnum,
    deleteEnum,
    renameEnum,
    renameEnumOption,
    addEnumOption,
    removeEnumOption,
  };
};
