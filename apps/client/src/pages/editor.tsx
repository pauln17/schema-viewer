import { useState, useCallback, useMemo, useEffect, type JSX } from "react";
import { useRouter } from "next/router";
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import EditorSidebar from "@/components/editor-sidebar";
import EditorNavbar from "@/components/editor-navbar";
import TableNode from "@/components/table-node";
import type { Table, Enum, Schema } from "@/types/schema";

function buildNodes(tables: Table[], enums: Enum[]): Node[] {
  return tables.map((t) => ({
    id: t.name,
    type: "table",
    position: t.position ?? { x: 0, y: 0 },
    data: {
      label: t.name,
      columns: t.columns,
      indexes: t.indexes,
      enums,
    },
  }));
}

function buildEdges(tables: Table[]): Edge[] {
  const edges: Edge[] = [];
  for (const table of tables) {
    for (const col of table.columns) {
      if (col.references) {
        edges.push({
          // List Table Name, Foreign Table Name, Foreign Column Name
          id: `${table.name}-${col.references.referencedTable}-${col.name}`,
          source: table.name,
          target: col.references.referencedTable,
          type: "smoothstep",
          style: { stroke: "#525252" },
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
      const cacheData = queryClient.getQueryData<Schema>(["schema", token]) ?? { definition: { enums: [], tables: [] } };
      if (token == undefined) {
        const res = await fetch("http://localhost:5001/schemas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Schema",
            definition: cacheData.definition as Schema["definition"],
          }),
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
          body: JSON.stringify(cacheData as Schema),
        });
        if (!res.ok) throw new Error("Failed to Save Schema");
        return res.json();
      }
    },
    onSuccess: (data) => {
      if (data.token) {
        router.push(`/editor/${data.token}`);
        queryClient.removeQueries({ queryKey: ["schema", undefined] });
      }
      setLastSavedData(data.schema);
    },
  });

  const updateQueryCache = useCallback(
    (data: Schema) => {
      queryClient.setQueryData(["schema", token], data);
    },
    [queryClient, token],
  );

  const [lastSavedData, setLastSavedData] = useState<Schema | null>(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [tables, setTables] = useState<Table[]>([]);
  const [enums, setEnums] = useState<Enum[]>([]);
  const [flowNodes, setFlowNodes] = useState<Node[]>(() => buildNodes(tables, enums));
  const [flowEdges, setFlowEdges] = useState<Edge[]>(() => buildEdges(tables));

  const hasUnsavedChanges = useMemo(
    () => {
      return !!schema && !!lastSavedData && JSON.stringify(schema.definition) !== JSON.stringify(lastSavedData.definition);
    },
    [schema, lastSavedData],
  );

  // Syncs API Data to Local State
  useEffect(() => {
    if (schema) {
      setTables(schema.definition.tables ?? []);
      setEnums(schema.definition.enums ?? []);
    }
  }, [schema]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      } else if (!token) {
        localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
      };
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, queryClient, token]);

  // Syncs Local State to React Flow
  useEffect(() => {
    setFlowNodes(buildNodes(tables, enums));
    setFlowEdges(buildEdges(tables));
  }, [tables, enums]);

  const renameTable = useCallback(
    (oldName: string, newName: string) => {
      setTables(
        tables.map((t) => (t.name === oldName ? { ...t, name: newName } : t)),
      );
      updateQueryCache({
        ...schema,
        definition: {
          enums,
          tables: tables.map((t) =>
            t.name === oldName ? { ...t, name: newName } : t,
          ),
        },
      } as Schema);
    },
    [enums, schema, tables, updateQueryCache],
  );

  const renameColumn = useCallback(
    (tableName: string, oldName: string, newName: string) => {
      setTables(
        tables.map((t) =>
          t.name === tableName
            ? {
              ...t,
              columns: t.columns.map((c) =>
                c.name === oldName ? { ...c, name: newName } : c,
              ),
            }
            : t,
        ),
      );
      updateQueryCache({
        ...schema,
        definition: {
          enums,
          tables: tables.map((t) =>
            t.name === tableName
              ? {
                ...t,
                columns: t.columns.map((c) =>
                  c.name === oldName ? { ...c, name: newName } : c,
                ),
              }
              : t,
          ),
        },
      } as Schema);
    },
    [enums, schema, tables, updateQueryCache],
  );

  const updateTables = useCallback(
    (updated: Table[]) => {
      setTables(updated);
      updateQueryCache({
        ...schema,
        definition: {
          ...schema?.definition,
          tables: updated,
        },
      } as Schema);
    },
    [enums, schema, updateQueryCache],
  );

  const deleteTable = useCallback(
    (tableName: string) => {
      updateTables(tables.filter((t) => t.name !== tableName));
    },
    [tables, updateTables],
  );

  const updateEnums = useCallback(
    (updated: Enum[]) => {
      setEnums(updated);
      updateQueryCache({
        ...schema,
        definition: {
          ...schema?.definition,
          enums: updated,
        },
      } as Schema);
    },
    [schema, updateQueryCache],
  );

  const deleteEnum = useCallback(
    (enumName: string) => {
      updateEnums(enums.filter((e) => e.name !== enumName));
    },
    [enums, updateEnums],
  );

  const renameEnum = useCallback(
    (oldName: string, newName: string) => {
      const updated = enums.map((e) =>
        e.name === oldName ? { ...e, name: newName } : e,
      );
      setEnums(updated);
      updateQueryCache({
        ...schema,
        definition: {
          ...schema?.definition,
          enums: updated,
        },
      } as Schema);
    },
    [enums, schema, updateQueryCache],
  );

  const renameEnumOption = useCallback(
    (enumName: string, oldName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;
      const updated = enums.map((e) =>
        e.name === enumName
          ? {
            ...e,
            options: (e.options ?? []).map((v) =>
              v === oldName ? trimmed : v,
            ),
          }
          : e,
      );
      setEnums(updated);
      updateQueryCache({
        ...schema,
        definition: {
          ...schema?.definition,
          enums: updated,
        },
      } as Schema);
    },
    [enums, schema, updateQueryCache],
  );

  // Custom Node Types for React Flow -> React Flow Matches Node Types to Component Names to Generate Nodes
  const nodeTypes = useMemo(() => ({ table: TableNode }), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setFlowNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const tempData = {
        ...schema,
        definition: {
          enums,
          tables: tables.map((t) =>
            t.name === node.id ? { ...t, position: node.position } : t,
          ),
        },
      };
      updateQueryCache(tempData as Schema);
    },
    [enums, schema, tables, updateQueryCache],
  );
  // First Few Renders -> Undefined Token ETC.

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setFlowEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: Connection) =>
      setFlowEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const tabContent: Record<string, JSX.Element> = {
    editor: (
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        fitView
      >
        <Background color="#555555" className="!bg-black" />
        <Controls className="!mr-5" position="top-right" />
      </ReactFlow>
    ),
    sql: (
      <div className="flex-1 flex items-center justify-center bg-black text-neutral-500">
        <p className="text-sm">SQL View Coming Soon</p>
      </div>
    ),
  };

  return token && (!router.isReady || isLoading) ? (
    <div className="flex w-screen h-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
        <p className="text-sm text-neutral-500">Loading Schema...</p>
      </div>
    </div>
  ) : (
    <div className="flex w-screen h-screen overflow-hidden">
      <EditorSidebar
        tables={tables}
        enums={enums}
        updateTables={updateTables}
        deleteTable={deleteTable}
        renameTable={renameTable}
        renameColumn={renameColumn}
        updateEnums={updateEnums}
        deleteEnum={deleteEnum}
        renameEnum={renameEnum}
        renameEnumOption={renameEnumOption}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <EditorNavbar
          schema={schema ?? null}
          token={token ?? ""}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          saveSchema={() => saveSchema()}
          isPending={isPending}
          isSaved={!hasUnsavedChanges}
        />
        {tabContent[activeTab]}
      </div>
    </div>
  );
}
