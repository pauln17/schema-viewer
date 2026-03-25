import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";

import TableNode from "@/components/TableNode";
import { buildEdges, buildNodes } from "@/lib/react-flow";
import type { Schema } from "@/types/schema";

type UseEditorFlowProps = {
  schema: Schema;
  updateQueryCache: (data: Schema) => void;
};

type FlowState = {
  schema: Schema;
  nodes: Node[];
  edges: Edge[];
};

export const useEditorFlow = ({ schema, updateQueryCache }: UseEditorFlowProps) => {
  const tables = schema.definition.tables;
  const enums = schema.definition.enums;

  const baseNodes = useMemo(() => buildNodes(tables), [tables]);
  const baseEdges = useMemo(() => buildEdges(tables), [tables]);

  const [flowState, setFlowState] = useState<FlowState>({
    schema,
    nodes: baseNodes,
    edges: baseEdges,
  });

  const flowNodes = flowState.schema === schema ? flowState.nodes : baseNodes;
  const flowEdges = flowState.schema === schema ? flowState.edges : baseEdges;

  const nodeTypes = useMemo(() => ({ table: TableNode }), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setFlowState({
        schema,
        nodes: applyNodeChanges(changes, flowNodes),
        edges: flowEdges,
      }),
    [flowEdges, flowNodes, schema],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setFlowState({
        schema,
        nodes: flowNodes,
        edges: applyEdgeChanges(changes, flowEdges),
      }),
    [flowEdges, flowNodes, schema],
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
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

  return {
    flowNodes,
    flowEdges,
    nodeTypes,
    onNodesChange,
    onEdgesChange,
    onNodeDragStop,
  };
};
