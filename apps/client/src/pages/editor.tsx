import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import EditorHeader from "@/components/EditorHeader";
import EditorSidebar from "@/components/EditorSidebar";
import TableNode from "@/components/TableNode";
import type { Enum, Schema, Table } from "@/types/schema";

interface EditorProps {
  schema: Schema | null;
  token: string | undefined;
  isLoading: boolean;
  saveSchema: () => void;
  isPending: boolean;
  updateQueryCache: (data: Schema) => void;
}

function getReferencedColumns(tableName: string, tables: Table[]): string[] {
  const names: string[] = [];
  for (const t of tables) {
    if (t.name === tableName) continue;
    for (const col of t.columns) {
      if (col.references?.referencedTable === tableName) {
        names.push(col.references.referencedColumn);
      }
    }
  }
  return [...new Set(names)];
}

function buildNodes(tables: Table[], enums: Enum[]): Node[] {
  return tables.map((t) => ({
    id: t.name,
    type: "table",
    position: t.position ?? { x: 0, y: 0 },
    data: {
      label: t.name,
      columns: t.columns ?? [],
      indexes: t.indexes ?? [],
      enums,
      referencedColumns: getReferencedColumns(t.name, tables),
    },
  }));
}

function buildEdges(tables: Table[]): Edge[] {
  const posByTable = Object.fromEntries(
    tables.map((t) => [t.name, t.position ?? { x: 0, y: 0 }])
  );
  const tablesByNames = Object.fromEntries(tables.map((t) => [t.name, t]));
  const edges: Edge[] = [];
  for (const table of tables) {
    for (const col of table.columns) {
      if (!col.references) continue;
      const srcTable = table;
      const tgtTable = tablesByNames[col.references.referencedTable];
      const tgtCol = col.references.referencedColumn;

      const targetHasColumn = tgtTable?.columns?.some((c) => c.name === tgtCol) ?? false;
      if (!targetHasColumn) continue;

      const srcPos = posByTable[srcTable.name];
      const tgtPos = posByTable[tgtTable.name];
      const targetIsRight = tgtPos.x > srcPos.x;
      const sourceHandle = targetIsRight
        ? `${srcTable.name}-${col.name}-source-right`
        : `${srcTable.name}-${col.name}-source-left`;
      const targetHandle = targetIsRight
        ? `${tgtTable.name}-${tgtCol}-target-left`
        : `${tgtTable.name}-${tgtCol}-target-right`;

      edges.push({
        id: `${srcTable.name}-${tgtTable.name}-${col.name}`,
        source: srcTable.name,
        sourceHandle,
        target: tgtTable.name,
        targetHandle,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#FFFFFF" },
      });
    }
  }
  return edges;
}

export default function Editor({ schema, token, isLoading, saveSchema, isPending, updateQueryCache }: EditorProps) {
  const router = useRouter();

  const tables = schema?.definition?.tables ?? [];
  const enums = schema?.definition?.enums ?? [];
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);

  const nodeTypes = useMemo(() => ({ table: TableNode }), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setFlowNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setFlowEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!schema) return;
      updateQueryCache({
        ...schema,
        definition: {
          enums,
          tables: tables.map((t) =>
            t.name === node.id ? { ...t, position: node.position } : t,
          ),
        },
      });
    },
    [enums, schema, tables, updateQueryCache],
  );

  useEffect(() => {
    setFlowNodes(buildNodes(tables, enums));
    setFlowEdges(buildEdges(tables));
  }, [schema]);

  const isTokenLoading = token && (!!router.isReady && (isLoading || schema === null));
  return (
    <>
      <ToastContainer theme="dark" />
      {isTokenLoading ? (
        <div className="flex w-screen h-screen items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
            <p className="text-sm text-neutral-500">Loading Schema...</p>
          </div>
        </div>
      ) : (
        <div className="flex w-screen h-screen overflow-hidden flex-col">
          <EditorHeader
            schema={schema ?? null}
            token={token ?? ""}
            saveSchema={() => saveSchema()}
            isPending={isPending}
            renameSchema={(name) => schema && updateQueryCache({ ...schema, name })}
          />
          <div className="flex flex-1 min-h-0 min-w-0 flex-col sm:flex-row">
            <div className="w-full sm:w-72 md:w-80 shrink-0 flex flex-col overflow-hidden border-b sm:border-b-0 border-white/[0.06] max-h-[45%] sm:max-h-full">
              <EditorSidebar
                schema={schema ?? { name: "Untitled", definition: { tables: [], enums: [] } }}
                tables={tables}
                enums={enums}
                updateQueryCache={updateQueryCache}
                token={token ?? undefined}
              />
            </div>
            <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
              <ReactFlow
                className="[&_.react-flow__node]:!cursor-default [&_.react-flow__node]:!pointer-events-auto"
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={onNodeDragStop}
                colorMode="dark"
                proOptions={{ hideAttribution: true }}
                fitView
              >
                <Background gap={16} size={1} className="!bg-[#0a0a0a]" />
                <Controls className="!mr-5" position="top-right" />
              </ReactFlow>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
