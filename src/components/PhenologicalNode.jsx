import { Handle, Position } from "@xyflow/react";

export function PhenologicalNode({ data, type }) {
  return (
    <div className={`phenological-node ${type}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        <div className="node-header">{data.label}</div>
        <div className="node-details">
          <div className="stage">{data.stage}</div>
          <div className="timing">{data.timing}</div>
          <div className="description">{data.description}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
