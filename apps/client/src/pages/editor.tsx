import "@xyflow/react/dist/style.css";

import { useQueryClient } from "@tanstack/react-query";
import {
  Background,
  Controls,
  ReactFlow,
} from "@xyflow/react";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { ToastContainer } from "react-toastify";
import { io } from "socket.io-client";

import EditorHeader from "@/components/EditorHeader";
import EditorSidebar from "@/components/EditorSidebar";
import { useEditorFlow } from "@/hooks/useEditorFlow";
import { useQuerySchema } from "@/hooks/useQuerySchema";
import type { Schema } from "@/types/schema";

export default function Editor() {
  const router = useRouter();
  const token = router.query.token as string | undefined;
  const queryClient = useQueryClient();

  io(`${process.env.NEXT_PUBLIC_SERVER_URL}`)

  const { data, isFetching } = useQuerySchema(token);
  const schema = data ?? { name: "", definition: { tables: [], enums: [] } };

  const updateQueryCache = useCallback(
    (data: Schema) => {
      queryClient.setQueryData(["schema", token], data);
    },
    [queryClient, token],
  );

  const tables = schema?.definition?.tables ?? [];
  const enums = schema?.definition?.enums ?? [];

  const { flowNodes, flowEdges, nodeTypes, onNodesChange, onEdgesChange, onNodeDragStop } =
    useEditorFlow({
      schema,
      updateQueryCache,
    });

  const isTokenLoading = token && (!!router.isReady && (isFetching));
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
            schema={schema}
            token={token}
            renameSchema={(name) => schema && updateQueryCache({ ...schema, name })}
          />
          <div className="flex flex-1 min-h-0 min-w-0 flex-col sm:flex-row">
            <div className="w-full sm:w-72 md:w-80 shrink-0 flex flex-col overflow-hidden border-b sm:border-b-0 border-white/[0.06] max-h-[45%] sm:max-h-full">
              <EditorSidebar
                schema={schema}
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
