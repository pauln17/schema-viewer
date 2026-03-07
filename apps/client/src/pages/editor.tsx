import { useState, useCallback, useMemo, useEffect, type JSX } from 'react';
import { useRouter } from 'next/router';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import EditorSidebar from '@/components/editor-sidebar';
import EditorNavbar from '@/components/editor-navbar';
import TableNode from '@/components/table-node';
import type { Table, Enum, Schema } from '@/types/schema';

function buildNodes(tables: Table[], enums: Enum[]): Node[] {
    return tables.map(t => ({
        id: t.name,
        type: 'table',
        position: t.position,
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
                    type: 'smoothstep',
                    style: { stroke: '#525252' },
                });
            }
        }
    }
    return edges;
}

export default function Editor() {
    const router = useRouter();
    const token = router.query.token as string | undefined;

    const { data: schemas } = useQuery<Schema | null>({
        queryKey: ['schemas', token],
        queryFn: async () => {
            const res = await fetch('http://localhost:5001/schemas', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok) {
                if (res.status === 429) {
                    router.replace(`/editor/limit`);
                    return null;
                }
                router.replace('/editor/unauthorized');
                return null;
            }
            return res.json();
        },
        enabled: !!token && router.isReady,
    });

    const [activeTab, setActiveTab] = useState('editor');
    const [tables, setTables] = useState<Table[]>([]);
    const [enums, setEnums] = useState<Enum[]>([]);
    const [flowNodes, setFlowNodes] = useState<Node[]>(() => buildNodes(tables, enums));
    const [flowEdges, setFlowEdges] = useState<Edge[]>(() => buildEdges(tables));

    // Syncs API Data to Local State
    useEffect(() => {
        if (schemas) {
            setTables(schemas.definition.tables);
            setEnums(schemas.definition.enums);
        }
    }, [schemas]);

    // Syncs Local State to React Flow
    useEffect(() => {
        setFlowNodes(buildNodes(tables, enums));
        setFlowEdges(buildEdges(tables));
    }, [tables, enums]);

    const handleTablesChange = useCallback((updated: Table[]) => setTables(updated), []);

    // Custom Node Types for React Flow -> React Flow Matches Node Types to Component Names to Generate Nodes
    const nodeTypes = useMemo(() => ({ table: TableNode }), []);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setFlowNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
        [],
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setFlowEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
        [],
    );
    const onConnect = useCallback(
        (params: Connection) => setFlowEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
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

    return (
        <div className="flex w-screen h-screen overflow-hidden">
            <EditorSidebar tables={tables} enums={enums} onTablesChange={handleTablesChange} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <EditorNavbar activeTab={activeTab} onTabChange={setActiveTab} />
                {tabContent[activeTab]}
            </div>
        </div>
    );
}
