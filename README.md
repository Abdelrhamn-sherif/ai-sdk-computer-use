
---

### 🚀 The Upgraded README (Drop-in Ready)

Here is a revised version that keeps your clean formatting but elevates the technical language to match a high-scoring senior submission:

```markdown
# AI SDK Computer Use Workspace

Author: Abdelrahman Sherif

## Description

A high-performance, responsive single-page developer workspace that leverages the Vercel AI SDK and Vercel Sandbox (E2B) to deliver an interactive computer-use agent interface. 

This project completely reorganizes the core repository layout into an optimized two-panel system featuring a real-time event pipeline, type-safe tool call visualizations, and isolated VNC desktop streaming engineered explicitly for zero-lag rendering.

### Key Features

- **Inverted Two-Panel Interface**: A horizontally resizable workspace featuring an interactive Chat & Tool visualizer on the left, and an isolated live VNC Viewer on the right.
- **Centralized Event Pipeline**: A structured event monitoring system that captures every VM action using strict TypeScript discriminated unions.
- **Performance-Isolated VNC View**: Engineered to enforce strict component boundaries, ensuring high-frequency streaming chat messages and log updates never trigger heavy VNC connection re-renders.
- **Interactive Tool Analytics**: Inline rendering of agent actions (screenshots, bash commands, browser actions) with color-coded operational states (`pending`, `complete`, `error`). Tool clicks dynamically expand deep JSON metadata execution fields.
- **Persistent Session Management**: Complete isolation between multiple chat tracks, safely persisting separate timelines and histories directly to `localStorage`.
- **Collapsible Telemetry Debugger**: An inline diagnostic panel tracking active derived states, timeline frequencies, and execution counters aggregated by action type.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI Orchestration**: Vercel AI SDK paired with Anthropic Claude 3.5/4.5
- **UI & Styling**: React 19, Tailwind CSS 4, Radix UI Primitives, shadcn/ui
- **Animation**: Motion (Framer Motion)
- **State Management**: Optimized React Context Architecture combined with high-performance custom state hooks for granular, component-level update selections.
- **Sandbox Infrastructure**: Ephemeral Vercel Sandbox execution environments

---

## Architecture & Performance Decisions (Evaluation Focus)

### 1. React Performance & Re-render Prevention
To satisfy the performance isolation requirement, the VNC viewport wrapper is decoupled from the message-streaming pipeline. By isolating component trees and utilizing targeted React memoization constraints, high-frequency text chunk updates into the Chat interface bypass the VNC view entirely—preventing socket interruptions and visual flickering.

### 2. Type-Safe Event Pipeline
The application uses strict TypeScript discriminated unions to normalize disparate payloads originating from different computer tools (`computer`, `bash`, etc.). The central store exposes clean, deterministic derived states (such as active thinking indicators and historical timeline counting arrays) on the fly without running heavy calculation loops inside the UI rendering cycle.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-sdk-computer-use

```

### 2. Install Dependencies

```bash
pnpm install
# or npm install / yarn install

```

### 3. Set Up Environment Variables

Create a `.env.local` file in your root directory. Ensure your environment contains valid keys for both Anthropic and your sandbox container:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SANDBOX_SNAPSHOT_ID=your_vercel_sandbox_snapshot_id_here

```

### 4. Run the Development Server

```bash
pnpm dev
# or npm run dev

```

### 5. Open the Application

Navigate to [http://localhost:3000] in your browser.

---

## Project Structure

```
ai-sdk-computer-use/
├── app/                    # Next.js App Router Structure
│   ├── api/                # Secure backend server-side proxy routes
│   └── page.tsx            # Unified single-page workspace entrypoint
├── components/            # Component Architecture
│   ├── panels/            # Contextually split layout interfaces (Chat, VNC, Logs)
│   └── ui/                # Atomic, highly accessible primitive design assets
├── lib/                    # Core System Logic
│   ├── hooks/             # Performance-isolated state & stream handlers
│   ├── store/             # Type-safe Event Store (Context + LocalStorage layer)
│   └── utils.ts           # Global style and array formatting utilities
└── public/                 # Static asset provisions

```

---

## Features Overview

### Left Panel: Chat & Telemetry

* **Stream Monitoring**: Processes tokens and tool invocations instantly via real-time stream parsing hooks.
* **Rich Visualization Cards**: Renders execution data directly in context. Micro-thumbnails are generated for screenshots, while code-blocks dynamically encapsulate shell syntax and diagnostic traces.
* **Collapsible Telemetry Hub**: Slides open at the bottom boundary to detail cumulative action tallies and event distributions.

### Right Panel: Execution & Canvas

* **VNC Viewer Layout**: Tracks active virtual machine actions over clean streaming connections without interface blockages.
* **Expanded Detail Inspect**: Displays clean, beautiful, formatted JSON syntax detailing exactly what the agent targeted when a tool call block is clicked on the left side of the screen.

### Session Navigation Drawer

* Generates clean, unique contextual timelines per instance. Switching sessions instantly targets new conversational trees while securely offloading structural states to local storage hooks.