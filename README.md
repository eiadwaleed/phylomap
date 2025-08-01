# Phenological Tree Creator

A modern, interactive web application for visualizing and creating phenological trees - diagrams that illustrate the sequential stages of biological development and life cycles. This tool allows users to generate detailed, visually appealing tree diagrams through natural language prompts.

**Live Demo:** [https://phylomap.netlify.app/](https://phylomap.netlify.app/)

## Features

- **AI-Powered Tree Generation**: Leverages Google's Generative AI to transform text descriptions into structured phenological trees
- **Interactive Visualization**: Built with React Flow (@xyflow/react) for dynamic, draggable node-based diagrams
- **Persistent Storage**: Automatically saves your trees and chat history in local storage
- **User-Friendly Interface**: Includes a draggable chat interface with example prompts to help you get started
- **Responsive Design**: Works across different screen sizes

## Technical Stack

- **Frontend**: React 19 with Vite for blazing fast development
- **Visualization**: @xyflow/react for node-based diagrams
- **AI Integration**: Google Generative AI for natural language processing
- **Styling**: CSS with responsive design principles

## Use Cases

Perfect for:
- **Education**: Visualize biological life cycles, plant growth stages, or evolutionary processes
- **Research**: Create visual representations of sequential biological phenomena
- **Presentations**: Generate clear, professional diagrams for academic or educational presentations
- **Study Aids**: Help students understand complex biological processes through visual learning

## Getting Started

Simply type a prompt describing the biological process or life cycle you want to visualize, and the application will generate an interactive tree diagram showing each stage with descriptions and timing information.

Example prompts:
- "Create a tree showing butterfly metamorphosis from egg, through each caterpillar stage, chrysalis, to adult butterfly"
- "Show the stages of a maple tree's growth from seed germination through sapling, young tree, to mature tree"
- "Create a tree showing frog development from egg mass, through tadpole stages, to adult frog"

The generated trees can be manipulated, rearranged, and saved for future reference.

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Google AI API key (see `.env.example`)
4. Start the development server: `npm run dev`
