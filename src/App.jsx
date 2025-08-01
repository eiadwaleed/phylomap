import "./App.css";
import { Flow } from "./components/Flow";
import { ChatBox } from "./components/ChatBox";
import { useState } from "react";

const STORAGE_KEYS = {
  TREE_DATA: "phenological_tree_data",
};

function App() {
  const [treeData, setTreeData] = useState(() => {
    const savedTree = localStorage.getItem(STORAGE_KEYS.TREE_DATA);
    return savedTree ? JSON.parse(savedTree) : { nodes: [], edges: [] };
  });

  // Handle tree updates from ChatBox
  const handleTreeUpdate = (newTreeData) => {
    setTreeData(newTreeData);
  };

  return (
    <div className="app">
      <header style={{ padding: "1rem" }}>
        <h1 style={{ margin: 0 }}>Phenological Tree Creator</h1>
      </header>
      <Flow treeData={treeData} />
      <ChatBox onTreeUpdate={handleTreeUpdate} />
    </div>
  );
}

export default App;
