import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PhenologicalNode } from "./PhenologicalNode";

// Define node types
const nodeTypes = {
  phenological: PhenologicalNode,
  input: PhenologicalNode, // Use same component for input nodes
  output: PhenologicalNode, // Use same component for output nodes
};

export function Flow({ treeData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes and edges when treeData changes
  useEffect(() => {
    console.log("Tree data updated:", treeData);
    if (treeData?.nodes && treeData?.edges) {
      console.log("Setting new nodes:", treeData.nodes);
      console.log("Setting new edges:", treeData.edges);
      setNodes(treeData.nodes);
      setEdges(treeData.edges);
    }
  }, [treeData, setNodes, setEdges]);

  return (
    <div className="flow-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        style={{ background: "white" }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background color="#ccc" variant="dots" />
        <Controls showInteractive={false} />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
