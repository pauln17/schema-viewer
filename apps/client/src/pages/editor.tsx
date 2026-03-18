import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import EditorNavbar from "@/components/editor-navbar";
import EditorSidebar from "@/components/editor-sidebar";
import TableNode from "@/components/table-node";
import type { Enum, Schema, Table } from "@/types/schema";

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

export default function Editor() {
  const router = useRouter();
  const token = router.query.token as string | undefined;
  const queryClient = useQueryClient();

  const [lastSavedData, setLastSavedData] = useState<Schema | null>(null);
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);

  const { data: schema, isLoading } = useQuery<Schema | null>({
    queryKey: ["schema", token],
    queryFn: async () => {
      const res = await fetch("http://localhost:5001/schemas", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        if (res.status === 429) {
          router.replace(`/editor/limit`);
          return null;
        }
        router.push("/editor");
        const e = await res.json();
        console.error("[GET /schema]", e);
        return null;
      }
      const data = await res.json();
      setLastSavedData(data);
      return data;
    },
    enabled: !!token && router.isReady
  });

  const { mutate: saveSchema, isPending } = useMutation({
    mutationFn: async () => {
      const raw = queryClient.getQueryData<Schema>(["schema", token]);
      const cacheData = {
        name: raw?.name ?? "Untitled",
        definition: raw?.definition ?? { enums: [], tables: [] },
      };
      if (token === undefined) {
        const res = await fetch("http://localhost:5001/schemas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cacheData),
        });
        if (!res.ok) throw new Error("Failed to Create Schema");
        return res.json();
      } else {
        const res = await fetch("http://localhost:5001/schemas", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cacheData),
        });
        if (!res.ok) throw new Error("Failed to Save Schema");
        return res.json();
      }
    },
    onSuccess: (data) => {
      if (data.token) {
        queryClient.setQueryData(["schema", undefined], {
          name: "Untitled",
          definition: { tables: [], enums: [] },
        });
        router.push(`/editor/${data.token}`);
      }
      // PUT Returns Schema Directly; POST Returns { Schema, Token }
      const saved = data.schema ?? data;
      if (token) {
        queryClient.setQueryData(["schema", token], saved);
        setLastSavedData(saved);
      }
    },
  });

  const tables = schema?.definition?.tables ?? [];
  const enums = schema?.definition?.enums ?? [];

  const updateQueryCache = useCallback(
    (data: Schema) => {
      queryClient.setQueryData(["schema", token], data);
    },
    [queryClient, token],
  );

  const nodeTypes = useMemo(() => ({ table: TableNode }), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setFlowNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
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

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setFlowEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );

  useEffect(() => {
    setFlowNodes(buildNodes(tables, enums));
    setFlowEdges(buildEdges(tables));
  }, [schema]);

  const hasUnsavedChanges = useMemo(
    () => {
      if (!schema) return false;
      if (!lastSavedData) return true; // Cache-Only Load: Unknown Server State, Assume Unsaved
      return JSON.stringify(schema.definition) !== JSON.stringify(lastSavedData.definition);
    },
    [schema, lastSavedData],
  );

  const isTokenLoading = token && (!router.isReady || isLoading || schema === null);
  return isTokenLoading ? (
    <div className="flex w-screen h-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
        <p className="text-sm text-neutral-500">Loading Schema...</p>
      </div>
    </div>
  ) : (
    <div className="flex w-screen h-screen overflow-hidden">
      <div className="w-120 shrink-0 flex flex-col overflow-hidden">
        <EditorSidebar
          schema={schema ?? null}
          tables={tables}
          enums={enums}
          updateQueryCache={updateQueryCache}
        />
      </div>
      <div className=" flex flex-col w-full h-full">
        <EditorNavbar
          schema={schema ?? null}
          token={token ?? ""}
          saveSchema={() => saveSchema()}
          isPending={isPending}
          isSaved={!hasUnsavedChanges}
          renameSchema={(name) => schema && updateQueryCache({ ...schema, name })}
        />
        <div className="flex-1 overflow-hidden">
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
  );
}
