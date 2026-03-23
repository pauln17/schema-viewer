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
import { ToastContainer, toast } from "react-toastify";
import { useRouter } from "next/router";
import EditorHeader from "@/components/EditorHeader";
import EditorSidebar from "@/components/EditorSidebar";
import TableNode from "@/components/TableNode";
import type { Enum, Schema, Table } from "@/types/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function getLocalFkColumns(table: Table): string[] {
  const names: string[] = [];
  for (const ref of table.references ?? []) {
    names.push(...ref.localColumns);
  }
  return [...new Set(names)];
}

function getReferencedColumns(tableName: string, tables: Table[]): string[] {
  const names: string[] = [];
  for (const t of tables) {
    if (t.name === tableName) continue;
    for (const ref of t.references ?? []) {
      if (ref.referencedTable === tableName) {
        names.push(...ref.referencedColumns);
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
      localFkColumns: getLocalFkColumns(t),
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
    for (const ref of table.references ?? []) {
      const tgtTable = tablesByNames[ref.referencedTable];
      if (!tgtTable) continue;

      const srcPos = posByTable[table.name];
      const tgtPos = posByTable[tgtTable.name];
      const targetIsRight = tgtPos.x > srcPos.x;

      for (let i = 0; i < ref.localColumns.length; i++) {
        const localCol = ref.localColumns[i];
        const foreignCol = ref.referencedColumns[i];
        if (!foreignCol) continue;

        const targetHasColumn = tgtTable.columns.some((c) => c.name === foreignCol);
        if (!targetHasColumn) continue;

        const sourceHandle = targetIsRight
          ? `${table.name}-${localCol}-source-right`
          : `${table.name}-${localCol}-source-left`;
        const targetHandle = targetIsRight
          ? `${tgtTable.name}-${foreignCol}-target-left`
          : `${tgtTable.name}-${foreignCol}-target-right`;

        edges.push({
          id: `${table.name}-${tgtTable.name}-${localCol}-${foreignCol}`,
          source: table.name,
          sourceHandle,
          target: tgtTable.name,
          targetHandle,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#FFFFFF" },
        });
      }
    }
  }
  return edges;
}

export default function Editor() {
  const router = useRouter();
  const token = router.query.token as string | undefined;
  const queryClient = useQueryClient();

  const { data: schema, isLoading } = useQuery<Schema | null>({
    queryKey: ["schema", token],
    queryFn: async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/schemas`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.status >= 400) {
          router.push("/editor");
          return;
        }
        const data = await res.json();
        return data;
      } catch (e) {
        const msg = e instanceof Error ? e.message.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "Unknown Error";
        toast.error(`Server Error: ${msg}`, {
          position: "bottom-center",
          autoClose: 3000,
          pauseOnHover: false,
          closeOnClick: true,
          theme: "dark",
          onClose: () => router.push("/editor"),
        });
      }
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
      }
    },
  });

  const updateQueryCache = useCallback(
    (data: Schema) => {
      queryClient.setQueryData(["schema", token], data);
    },
    [queryClient, token],
  );

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
