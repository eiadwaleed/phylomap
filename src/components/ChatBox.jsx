import { useState, useRef, useEffect } from "react";
import { generatePhenologicalTree } from "../services/ai";

const EXAMPLE_PROMPTS = [
  "Create a tree showing butterfly metamorphosis from egg, through each caterpillar stage, chrysalis, to adult butterfly",
  "Show the stages of a maple tree's growth from seed germination through sapling, young tree, to mature tree",
  "Create a tree showing frog development from egg mass, through tadpole stages, to adult frog",
  "Show the evolution of birds from small theropod dinosaurs through archaeopteryx, early birds, to modern birds",
];

const STORAGE_KEYS = {
  CHAT_HISTORY: "phenological_chat_history",
  TREE_DATA: "phenological_tree_data",
  CHAT_POSITION: "phenological_chat_position",
};

export function ChatBox({ onTreeUpdate }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(() => {
    const savedPosition = localStorage.getItem(STORAGE_KEYS.CHAT_POSITION);
    return savedPosition ? JSON.parse(savedPosition) : { x: 20, y: 20 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const messagesEndRef = useRef(null);
  const chatboxRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.CHAT_HISTORY,
      JSON.stringify(chatHistory)
    );
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHAT_POSITION, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    const handleResize = () => {
      if (!chatboxRef.current) return;
      const box = chatboxRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - box.width;
      const maxY = window.innerHeight - box.height;

      setPosition((prev) => ({
        x: Math.min(Math.max(0, prev.x), maxX),
        y: Math.min(Math.max(0, prev.y), maxY),
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseDown = (e) => {
    if (e.target.closest(".reset-button") || e.target.closest(".toggle-icon"))
      return;
    const chatbox = chatboxRef.current;
    if (!chatbox) return;
    const rect = chatbox.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !chatboxRef.current) return;
    const maxX = window.innerWidth - chatboxRef.current.offsetWidth;
    const maxY = window.innerHeight - chatboxRef.current.offsetHeight;

    setPosition({
      x: Math.min(Math.max(0, e.clientX - dragOffset.x), maxX),
      y: Math.min(Math.max(0, e.clientY - dragOffset.y), maxY),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleExampleClick = (example) => setMessage(example);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset?")) {
      setChatHistory([]);
      setMessage("");
      localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
      localStorage.removeItem(STORAGE_KEYS.TREE_DATA);
      onTreeUpdate({ nodes: [], edges: [] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    const userMessage = message.trim();
    setMessage("");

    setChatHistory((prev) => [...prev, { type: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await generatePhenologicalTree(userMessage, chatHistory);

      if (response.isConversational) {
        setChatHistory((prev) => [
          ...prev,
          { type: "ai", text: response.message },
        ]);
        return;
      }

      const currentTree = {
        nodes: response.nodes.map((node) => ({ ...node })),
        edges: response.edges.map((edge) => ({ ...edge })),
      };

      localStorage.setItem(STORAGE_KEYS.TREE_DATA, JSON.stringify(currentTree));
      onTreeUpdate(currentTree);

      const responseMessage = `I've created a new phenological tree with ${
        response.nodes.length
      } stages showing the progression from "${
        response.nodes[0].data.label
      }" to "${
        response.nodes[response.nodes.length - 1].data.label
      }".\n\nKey stages include:\n${response.nodes
        .map((node) => `- ${node.data.label} (${node.data.timing})`)
        .join("\n")}\n\nLet me know if you'd like any adjustments!`;

      setChatHistory((prev) => [
        ...prev,
        { type: "ai", text: responseMessage, treeData: currentTree },
      ]);
    } catch (error) {
      console.error("Error generating tree:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          type: "ai",
          text:
            "I had trouble generating the tree. Please try one of these example prompts:\n\n" +
            '1. "Show butterfly metamorphosis from egg to adult"\n' +
            '2. "Create tree of maple tree growth stages"\n' +
            '3. "Show frog development from egg to adult"\n' +
            '4. "Create bird evolution tree from dinosaurs to modern birds"',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleTextareaChange = (e) => {
    setMessage(e.target.value);

    // Auto-expand height
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && chatboxRef.current) {
      const box = chatboxRef.current.getBoundingClientRect();
      const maxY = window.innerHeight - 600; // Updated to match new height
      if (box.top > maxY) {
        setPosition((prev) => ({ ...prev, y: Math.max(20, maxY) }));
      }
    }
  };

  return (
    <div
      ref={chatboxRef}
      className={`chatbox ${isExpanded ? "expanded" : ""} ${
        isDragging ? "dragging" : ""
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isDragging ? 1000 : 100,
      }}
    >
      <div className="chatbox-header" onMouseDown={handleMouseDown}>
        <h3>AI Tree Assistant</h3>
        <div className="header-controls">
          <button className="reset-button" onClick={handleReset} title="Reset">
            Reset
          </button>
          <span className="toggle-icon" onClick={handleToggleExpand}>
            {isExpanded ? "−" : "+"}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="chatbox-content">
          <div className="chat-messages">
            {chatHistory.length === 0 && (
              <div className="message ai">
                Hello! I can help you create phenological trees. Try one of
                these:
                <div className="example-prompts">
                  {EXAMPLE_PROMPTS.map((example, index) => (
                    <button
                      key={index}
                      className="example-button"
                      onClick={() => handleExampleClick(example)}
                    >
                      {example.split(" ").slice(0, 4).join(" ")}...
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="message ai loading">Generating...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <form onSubmit={handleSubmit}>
              <textarea
                value={message}
                onChange={handleTextareaChange}
                placeholder="Describe a development or evolution process..."
                disabled={isLoading}
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Generating..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
