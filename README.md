# Xpanse

**One Space. Infinite Ways to Collaborate.**

Xpanse is a high-performance, real-time team collaboration ecosystem built utilizing **Python**, **FastAPI**, and **React**. It represents a structural, modern approach to productivity, dissolving the barrier between isolated project management platforms (like Trello) and rapid-fire team communication layers (like Slack) by unifying them into a highly responsive, nested workspace layout.

## Features

- **Unified Workspace:** Bring your project boards and team group chats under a single, unified horizon. 
- **Granular Permissions:** Grant full access to your entire space, or pinpoint permissions down to a single room or board using a secure top-down permission inheritance model.
- **Real-Time Collaboration:** Powered by WebSockets to maintain thousands of concurrent, lightweight, stateful connections with absolute performance efficiency.
- **Interactive Kanban Boards:** Manage workflows dynamically with reactive task cards in a standard Kanban view.
- **Persistent AI Assistant:** An integrated streaming AI chatbot leveraging Retrieval-Augmented Generation (RAG) to safely aggregate and analyze data vectors across your teams.
- **Team Communication:** Group chat (GC) channels and direct messages integrated directly into your workflow.

## Tech Stack

### Frontend
- **Framework:** React 19 / Vite + TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Rich Text Editor:** Tiptap

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Real-Time:** FastAPI WebSockets
- **Database ORM:** SQLModel / SQLAlchemy
- **Data Storage:** PostgreSQL
- **Cache & Broker:** Redis
- **AI Integration:** OpenAI API (Async streaming)

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- PostgreSQL
- Redis

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Set up the virtual environment, install dependencies, and configure the `.env` file based on `.env.example`.

## Architecture Overview

Xpanse operates as a decoupled full-stack application. The frontend utilizes React for state preservation, reactive rendering, and persistent canvas management. The backend leverages FastAPI for REST endpoints and a WebSocket router for real-time messaging, Kanban sync, and the streaming AI bot. PostgreSQL handles hierarchical access controls and data storage, while Redis powers Pub/Sub mechanisms to mirror WebSocket messages.
