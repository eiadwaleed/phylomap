import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);

// Define schema with propertyOrdering to enforce field order
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    nodes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        propertyOrdering: ["id", "type", "position", "data"],
        properties: {
          id: { type: SchemaType.STRING },
          type: {
            type: SchemaType.STRING,
            enum: ["input", "phenological", "output"],
          },
          position: {
            type: SchemaType.OBJECT,
            propertyOrdering: ["x", "y"],
            properties: {
              x: { type: SchemaType.NUMBER },
              y: { type: SchemaType.NUMBER },
            },
            required: ["x", "y"],
          },
          data: {
            type: SchemaType.OBJECT,
            propertyOrdering: ["label", "stage", "description", "timing"],
            properties: {
              label: { type: SchemaType.STRING },
              stage: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              timing: { type: SchemaType.STRING },
            },
            required: ["label", "stage", "description", "timing"],
          },
        },
        required: ["id", "type", "position", "data"],
      },
    },
    edges: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        propertyOrdering: ["id", "source", "target", "animated", "label"],
        properties: {
          id: { type: SchemaType.STRING },
          source: { type: SchemaType.STRING },
          target: { type: SchemaType.STRING },
          animated: { type: SchemaType.BOOLEAN },
          label: { type: SchemaType.STRING },
        },
        required: ["id", "source", "target", "animated", "label"],
      },
    },
    conversationalResponse: {
      type: SchemaType.STRING,
      description:
        "A natural language response for conversational messages. Empty string if not a conversational message.",
    },
  },
  required: ["nodes", "edges", "conversationalResponse"],
  propertyOrdering: ["conversationalResponse", "nodes", "edges"],
};

export async function generatePhenologicalTree(prompt, chatHistory = []) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  });

  try {
    // Get the last valid tree data from chat history
    const lastTreeData = chatHistory
      .slice()
      .reverse()
      .find((msg) => msg.type === "ai" && msg.treeData)?.treeData;

    // Format chat history for context
    const historyContext = chatHistory
      .map((msg) => {
        if (msg.type === "user") {
          return `Human: ${msg.text}`;
        } else {
          // Only include tree data for the most recent tree-generating message
          const isLastTreeMessage =
            msg.treeData &&
            msg ===
              chatHistory.filter((m) => m.type === "ai" && m.treeData).pop();
          return `Assistant: ${msg.text}${
            isLastTreeMessage
              ? "\nTree data: " + JSON.stringify(msg.treeData)
              : ""
          }`;
        }
      })
      .join("\n");

    const systemPrompt = `You are a helpful AI assistant that can both engage in natural conversation and create phenological tree diagrams.

You have two main functions:

1. Natural Conversation:
- Engage in friendly, helpful dialogue
- Maintain context from the conversation history
- Focus on helping users create and modify phenological trees
- When responding to conversation, set 'conversationalResponse' with your reply and return empty arrays for nodes and edges

2. Tree Generation/Modification:
- Set 'conversationalResponse' to empty string
- Analyze the user's request and conversation history to determine if they want to:
  a) Create a new tree from scratch
  b) Modify an existing tree (if one exists in the history)
- Follow these rules for tree data:

  Rules for all trees:
  - First node: type "input"
  - Last node: type "output"
  - Middle nodes: "phenological"
  - Vertical spacing: y diff 100 units
  - Horizontal zigzag: odd nodes x=150, even nodes x=350
  - IDs: n1, n2…; edges e1-2 connect n1→n2
  - 4–6 nodes, all edges animated=true
  - Descriptions should be detailed but under 100 characters
  - Include specific timing for each stage
  - Edge labels should describe the transition

  If the user's request implies modifying an existing tree:
  - Use the provided tree data as base
  - Understand what aspects they want to change
  - Make appropriate modifications while preserving the overall structure
  - Only create a new tree if the modification request cannot be fulfilled with the existing tree

Respond with pure JSON matching the schema.`;

    const fullPrompt = `${systemPrompt}\n\n${
      lastTreeData
        ? `Most recent tree data: ${JSON.stringify(lastTreeData)}\n\n`
        : ""
    }${
      historyContext ? `Previous conversation:\n${historyContext}\n\n` : ""
    }New message: ${prompt}`;

    const stream = await model.generateContentStream({
      contents: [{ parts: [{ text: fullPrompt }] }],
    });

    let fullText = "";
    for await (const chunk of stream.stream) {
      fullText += chunk.text();
    }

    // Basic sanity check
    if (!fullText.trim().startsWith("{") || !fullText.trim().endsWith("}")) {
      throw new Error("Truncated or malformed JSON");
    }

    const response = JSON.parse(fullText);

    // If this is a conversational response, return it
    if (response.conversationalResponse) {
      return {
        isConversational: true,
        message: response.conversationalResponse,
        nodes: [],
        edges: [],
      };
    }

    // Validate tree data
    if (
      !Array.isArray(response.nodes) ||
      !Array.isArray(response.edges) ||
      (response.nodes.length > 0 &&
        (response.nodes.length < 4 ||
          response.nodes.length > 6 ||
          response.nodes[0]?.type !== "input" ||
          response.nodes[response.nodes.length - 1]?.type !== "output"))
    ) {
      throw new Error(
        "Failed to generate a valid tree. Please try rephrasing your request."
      );
    }

    return {
      isConversational: false,
      nodes: response.nodes,
      edges: response.edges,
    };
  } catch (err) {
    throw new Error(
      err.message || "Response was not valid JSON or was incomplete"
    );
  }
}
