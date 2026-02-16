# AgenticIDE — Detailed Guide

A visual development environment for composing, testing, and deploying AI agent pipelines. Build multi-step text and image generation workflows by connecting nodes on a canvas, create agentic automations, and generate complex AI art — all from a single platform.

---

## Tech Stack

| Layer              | Technology                                                    |
| ------------------ | ------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router)                                      |
| Frontend           | React 19, TypeScript 5 (strict)                              |
| Node Graph         | @xyflow/react 12 (React Flow)                                |
| State Management   | Zustand 5                                                    |
| Styling            | Tailwind CSS 4, tw-animate-css                               |
| UI Components      | Radix UI, cmdk (command palette), Lucide icons                |
| Animation          | Framer Motion 12                                             |
| HTTP Client        | Axios (preconfigured instance with auth interceptors)         |
| Notifications      | Sonner (toast)                                                |
| AI SDK             | OpenAI SDK 6 (compatible endpoints), Claude Agent SDK         |
| AI Text Providers  | Mistral AI, GLM (Zhipu AI), OpenRouter, HuggingFace (Qwen)   |
| AI Image Providers | HuggingFace (FLUX.1-schnell, FLUX.1-dev), GLM-Image (Z.AI native) |
| Backend API        | Separate FastAPI backend at `http://localhost:8000/api/v1`    |
| Auth               | JWT (access + refresh tokens) via backend auth endpoints      |

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
# Backend API URL (optional — defaults to http://localhost:8000/api/v1)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Text providers (at least one required)
MISTRAL_API_KEY=your_mistral_api_key
GLM_API_KEY=your_glm_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
HF_API_KEY=your_huggingface_api_key

# HF_API_KEY is also used for image generation (FLUX models)
# GLM_API_KEY is also used for GLM-Image generation (Z.AI native API)
```

| Provider             | Get a key at                             | Used for                     |
| -------------------- | ---------------------------------------- | ---------------------------- |
| Mistral AI           | https://console.mistral.ai/              | Text (default for most nodes)|
| GLM (Z.AI)           | https://open.bigmodel.cn/                | Text + Vision + Image        |
| OpenRouter           | https://openrouter.ai/                   | Text (free tier available)   |
| HuggingFace          | https://huggingface.co/settings/tokens   | Text (Qwen) + Image (FLUX)   |
| Claude CLI           | Local Claude CLI install                 | Vision (imageDescriber, personasReplacer) |

### 3. Run the dev server

```bash
pnpm dev
```

Open http://localhost:3000 → Landing page → Login → `/home`

---

## Routing & Layout Architecture

The app uses Next.js route groups to separate public and authenticated areas:

```
src/app/
├── layout.tsx                    # Root layout (Geist font, metadata, Sonner toasts)
├── globals.css                   # Tailwind theme, dark mode
├── (public)/                     # Public route group
│   ├── layout.tsx                # Shared public layout (dark bg + Navbar)
│   ├── page.tsx                  # Landing page (/)
│   └── login/page.tsx            # Login page (/login)
├── (authenticated)/              # Authenticated route group
│   ├── layout.tsx                # Auth guard + MainSidebar + header + UserAvatar
│   └── home/page.tsx             # Home page (/home)
├── image-genai/                  # Image GenAI (own full-screen layout)
│   ├── layout.tsx                # Image GenAI layout (AppSidebar, own auth guard)
│   ├── page.tsx                  # Main canvas (React Flow + toolbar)
│   ├── characters/page.tsx       # Character management
│   └── settings/page.tsx         # Settings (placeholder)
├── backoffice/                   # Backoffice admin area
│   ├── layout.tsx                # Root wrapper (minimal dark bg)
│   ├── login/page.tsx            # Admin login (/backoffice/login)
│   └── (dashboard)/              # Protected route group
│       ├── layout.tsx            # Auth guard + BackofficeSidebar + header
│       └── page.tsx              # Dashboard home (/backoffice)
├── prototype/page.tsx            # Prototype/legacy page
└── api/                          # API routes (see below)
```

### Route Groups

| Group | Layout | Pages | Purpose |
| ----- | ------ | ----- | ------- |
| `(public)` | Navbar | `/`, `/login` | Landing page + login |
| `(authenticated)` | Auth guard + MainSidebar + header + UserAvatar | `/home`, `/agents`, `/settings` | Main app shell |
| `image-genai/` | Own full-screen layout (AppSidebar) | `/image-genai`, `/image-genai/characters`, `/image-genai/settings` | Node editor (standalone) |
| `backoffice/` | Root: minimal dark bg | `/backoffice/login` | Admin login (no sidebar) |
| `backoffice/(dashboard)` | Auth guard + BackofficeSidebar + header | `/backoffice` | Admin dashboard (protected) |

### Authentication Flow

1. User visits `/` → sees landing page
2. Clicks "Get Started" or "Log In" → navigates to `/login`
3. Submits identifier (email or username) + password → `POST /api/v1/auth/login` with `{ identifier, password }` → receives JWT tokens + user details
4. Tokens stored in localStorage (`access_token` + `refresh_token`)
5. User details stored in Zustand user store + localStorage (`user_details`)
6. Redirected to `/home`
7. All API calls auto-attach `Bearer` token via axios interceptor
8. On 401 → auto-refresh via `POST /api/v1/auth/refresh` → retry original request
9. If refresh fails → clear tokens + clear user → redirect to `/login`
10. Logout → clear tokens + clear user → redirect to `/login`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  DI Container (bootstrap.ts)                        │
│  Single wiring point — all services + dependencies  │
│  ┌──────────┐ ┌─────────────┐ ┌──────────────────┐ │
│  │ EventBus │ │ AutoSave    │ │ EditorManager    │ │
│  │ WS Mgr   │ │ UndoManager │ │ ProjectService   │ │
│  │          │ │ GraphManager│ │ ComponentService │ │
│  └──────────┘ └─────────────┘ └──────────────────┘ │
└─────────────────┬───────────────────────────────────┘
                  │ <DIProvider> + useService()
                  ▼
┌─────────────────────────────────────────────────────┐
│  Dashboard (React Flow canvas)                      │
│  ┌───────┐   ┌───────┐   ┌───────┐   ┌──────────┐ │
│  │ Input │──▶│Process│──▶│Process│──▶│  Output  │ │
│  │ Node  │   │ Node  │   │ Node  │   │  Node    │ │
│  └───────┘   └───────┘   └───────┘   └──────────┘ │
│       ▲ adapter handles (character personas)        │
│  ┌────┴────┐                                        │
│  │Character│                                        │
│  │  Node   │                                        │
│  └─────────┘                                        │
└─────────────────┬───────────────────────────────────┘
                  │ runFromNode() → WS send
                  ▼
┌─────────────────────────────────────────────────────┐
│  WebSocket Execution Bridge                         │
│  1. Sends execution.start (graph + cached outputs)  │
│  2. Backend runs pipeline (topological sort, AI)    │
│  3. Streams node status events back via WS          │
│  4. execution-bridge.ts routes events → store       │
│  5. snake_case ↔ camelCase mapping for NodeOutput   │
└─────────────────┬───────────────────────────────────┘
                  │ status events
                  ▼
┌─────────────────────────────────────────────────────┐
│  Event Bus (event-bus.ts + event-wiring.ts)         │
│  emitEditorEvent() — auto-injects userId            │
│  event-wiring.ts — single source of truth for .on() │
│  flow:dirty → Auto-Save (scheduler.ts)              │
│  All events logged via Logger ("editor-bus")        │
└─────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  Persistence                                        │
│  FastAPI backend (flows table, JSONB graph_data)    │
│  Debounced auto-save (2s) via axios api instance    │
└─────────────────────────────────────────────────────┘
```

### Key Systems

| System           | File(s)                                              | Purpose                                                          |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| **Core Module**  | `src/modules/core/`                                  | Shared infrastructure (EventBus, Logger, DI) used by all modules |
| DI Container     | `src/modules/core/di/Container.ts`                   | Lightweight typed DI container (factory-based, lazy singletons)  |
| DI Tokens        | `src/modules/core/di/tokens.ts`                      | Symbol-based service tokens (`TOKENS.EventBus`, etc.)            |
| DI React         | `src/modules/core/di/react.tsx`                      | `DIProvider`, `useContainer()`, `useService()` hook              |
| Bootstrap        | `src/modules/bootstrap.ts`                           | Single wiring point — registers all services with dependencies   |
| EventBus         | `src/modules/core/bus/EventBus.ts`                   | Generic typed pub/sub class with built-in logging via Logger     |
| Logger           | `src/modules/core/logger/Logger.ts`                  | Colored console logger with module prefix                        |
| **Editor Module**| `src/modules/image-gen-editor/`                      | Image-gen editor subsystem (engine, persistence, events, media)  |
| Editor Manager   | `src/modules/image-gen-editor/editor-manager/`       | Facade: lifecycle orchestration, project/component/flow services |
| Component Service| `src/modules/image-gen-editor/editor-manager/component-service.ts` | Fetch component registry from backend, group by category |
| Auto-Save        | `src/modules/image-gen-editor/auto-save/`            | Debounced persistence via axios to FastAPI backend               |
| Undo Manager     | `src/modules/image-gen-editor/undo-manager/`         | Per-flow undo/redo (history stack, snapshot scheduler)            |
| Execution Bridge | `src/modules/image-gen-editor/execution-bridge.ts`   | WS-based remote execution: send graph, receive status events, case mapping |
| Execution Engine | `src/modules/image-gen-editor/engine/`               | Graph analysis types, BFS traversal (execution now server-side)  |
| Graph Manager    | `src/modules/image-gen-editor/engine/graph/`         | BFS traversal (upstream/downstream), topological sort types      |
| WebSocket Mgr    | `src/modules/websocket/WebSocketManager.ts`          | WS connection lifecycle, auto-reconnect, ping/pong, pub/sub     |
| WS React Hook    | `src/hooks/useWebSocket.ts`                          | `useWebSocket()` → `{ on, send, isConnected }`                  |
| Event Bus (editor) | `src/modules/image-gen-editor/event-bus.ts`        | Domain EventMap, BasePayload (userId), emitEditorEvent() helper  |
| Event Wiring     | `src/modules/image-gen-editor/event-wiring.ts`       | Single source of truth for all EventBus subscriptions            |
| **Shared (lib)** | `src/lib/`                                           | General utilities and AI provider infrastructure                 |
| Branding         | `src/lib/constants.ts`                               | Centralized product name, tagline, description                   |
| Auth             | `src/lib/auth.ts`                                    | Token storage helpers (get, set, clear, isAuthenticated)         |
| Backoffice Auth  | `src/lib/backoffice-auth.ts`                         | Backoffice token storage helpers (separate from user auth)       |
| API Client       | `src/lib/api.ts`                                     | Axios instance with Bearer token + auto-refresh interceptors     |
| Text Providers   | `src/lib/providers.ts`                               | OpenAI-compatible client factory for all text AI providers       |
| Image Providers  | `src/lib/image-providers.ts`                         | Universal image generation registry (HuggingFace FLUX, GLM-Image Z.AI) |
| User Store       | `src/store/user-store.ts`                            | Zustand store for current user details (persisted to localStorage) |
| Flow Store       | `src/store/flow-store.ts`                            | Multi-flow state: nodes, edges, execution status per flow        |

---

## Landing Page

The landing page at `/` is a clean, minimal marketing page built with Framer Motion scroll animations:

| Section | Component | Description |
| ------- | --------- | ----------- |
| Navbar | `src/components/landing/navbar.tsx` | Fixed top nav with scroll blur effect, mobile hamburger menu |
| Hero | `src/components/landing/hero.tsx` | Product name, tagline, CTAs with staggered fade-in |
| Features | `src/components/landing/features.tsx` | 6-card grid (uses reusable `FeatureCard` component) |
| How It Works | `src/components/landing/how-it-works.tsx` | 3-step pipeline walkthrough |
| Use Cases | `src/components/landing/use-cases.tsx` | 4 use case cards with accent borders |
| CTA + Footer | `src/components/landing/cta-footer.tsx` | Final call-to-action + minimal footer |

### Reusable Landing Components

| Component | File | Purpose |
| --------- | ---- | ------- |
| `SectionWrapper` | `src/components/landing/section-wrapper.tsx` | Scroll-animated section container (whileInView fade-up) |
| `GradientText` | `src/components/landing/gradient-text.tsx` | Blue-to-purple gradient text (configurable tag: h1/h2/span) |
| `FeatureCard` | `src/components/landing/feature-card.tsx` | Animated feature card with icon, title, description |

---

## Sidebar Navigation

### MainSidebar (Authenticated Area)

**File:** `src/components/main-sidebar.tsx`

Used by the `(authenticated)` layout for `/home` and inner app pages.

| Icon | Label | Route | Color |
| ---- | ----- | ----- | ----- |
| Home | Home | `/home` | blue |
| ImageIcon | Image GenAI | `/image-genai` | fuchsia |
| Bot | Agents Automations | `/agents` | emerald |
| Settings | Settings | `/settings` | gray |
| LogOut | Sign Out | → `/login` | red (hover) |

### AppSidebar (Image GenAI)

**File:** `src/components/app-sidebar.tsx`

Used by the image-genai layout for the node editor.

| Icon | Label | Route | Color |
| ---- | ----- | ----- | ----- |
| Workflow | Editor | `/image-genai` | blue |
| UserRound | Characters | `/image-genai/characters` | amber |
| Settings | Settings | `/image-genai/settings` | gray |
| LogOut | Sign Out | → `/login` | red (hover) |

### BackofficeSidebar (Admin Area)

**File:** `src/components/backoffice/backoffice-sidebar.tsx`

Used by the backoffice `(dashboard)` layout for admin pages.

| Icon | Label | Route | Color |
| ---- | ----- | ----- | ----- |
| LayoutDashboard | Dashboard | `/backoffice` | blue |
| Users | Users | `/backoffice/users` | emerald |
| FolderKanban | Projects | `/backoffice/projects` | amber |
| BarChart3 | Analytics | `/backoffice/analytics` | fuchsia |
| Settings2 | Settings | `/backoffice/settings` | gray |
| LogOut | Sign Out | → `/backoffice/login` | red (hover) |

### Backoffice Authentication Flow

1. Admin visits `/backoffice/login` → sees login form (no sidebar/header)
2. Submits identifier + password → `POST /api/v1/auth/backoffice/login` with `{ identifier, password }`
3. Tokens stored in separate localStorage keys (`bo_access_token` + `bo_refresh_token`)
4. Redirected to `/backoffice` → dashboard with sidebar + header
5. Auth is isolated from the main app — admin and user sessions are independent
6. Logout clears backoffice tokens only → redirect to `/backoffice/login`

---

## Node Types

Nodes are the building blocks of a flow. Each node has typed input/output handles and an associated executor function. Drag nodes from the sidebar onto the canvas and connect them with edges.

### Input Nodes

| Node              | Description                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| **Initial Prompt**    | Text entry point. Type your prompt text directly. Supports persona injection via adapter handles. |
| **Image Describer**   | Upload an image → AI vision model generates a text description. Uses Claude CLI by default.       |

### Scene Atmosphere

| Node              | Description                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| **Scene Builder**     | Pure data source — compose a scene prompt from dropdowns (style, lighting, time of day, weather, camera angle, lens, mood). No AI call. |

### Processing Nodes

| Node                  | Description                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------- |
| **Prompt Enhancer**   | Enhances upstream text with optional notes. Supports persona injection via adapters.         |
| **Story Teller**      | Creative narrative generator — produces vivid story passages from a concept + tags. Focuses on words, emotion, and character (not visual/image descriptions). Persona-aware. |
| **Translator**        | Translates upstream text to a target language (26 languages supported).                      |
| **Grammar Fix**       | Proofreader — fixes grammar, spelling, and punctuation. Optional style tone adjustment without expanding or rewriting content. |
| **Compressor**        | Compresses text over 2500 characters via AI summarization; passes shorter text through.      |
| **Personas Replacer** | Analyzes a target image and replaces characters with connected personas. Vision-powered.     |

### Output Nodes

| Node               | Description                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- |
| **Text Output**    | Terminal sink — displays the final text result. Copy to clipboard support.                    |
| **Image Generator**| Takes upstream text prompt and generates an image via HuggingFace (FLUX) or GLM-Image (Z.AI). Per-node model selection via settings. |

### Utility Nodes

| Node                    | Description                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| **Consistent Character**| Pure data source — holds a saved character persona (name + description). Connect via adapter handles to inject persona identity into downstream nodes. |
| **Group**               | Visual container — groups nodes together on the canvas. No execution logic.              |

---

## Execution Engine (WebSocket-based)

Execution is handled by the **FastAPI backend** via WebSocket. The frontend sends the graph and receives real-time status events.

When you click **Run** on a node:

1. **Frontend pre-processing** (`flow-store.ts` → `runFromNode`):
   - Computes downstream + unexecuted upstream nodes (graph traversal)
   - Clears downstream textOutput data for immediate visual feedback
   - Preserves status/outputs for nodes outside the execution set
   - Sets `isRunning = true`, emits `execution:started`

2. **WebSocket send** (`execution-bridge.ts` → `sendRemoteExecution`):
   - Packages nodes (id, type, data), edges (connectivity), providerId, triggerNodeId
   - Converts cached outputs to snake_case for the backend
   - Sends `execution.start` message over WebSocket

3. **Backend pipeline** (FastAPI):
   - Topological sort, cycle detection, model resolution
   - Sequential node execution with AI provider calls
   - Streams per-node status events back via WebSocket

4. **Frontend event handling** (`execution-bridge.ts` → `wireExecutionWs`):
   - `execution.node.status` → updates nodeStatus (pending/running/skipped)
   - `execution.node.completed` → maps output snake→camel, updates store + textOutput data
   - `execution.node.failed` → sets error status
   - `execution.completed` → sets `isRunning = false`, merges final outputs, toast
   - `execution.failed` → sets globalError, toast error
   - WS disconnect → graceful error recovery

5. **Status Flow** — Each node transitions through: `idle → pending → running → complete/error/skipped`
6. **Error Propagation** — If an upstream node errors, all downstream nodes in the chain are marked `error`

### Adapter Handles

Some nodes (initialPrompt, promptEnhancer, storyTeller, personasReplacer) support **adapter inputs** — special connection points (top "+" ghost handle) that receive character persona data from ConsistentCharacter nodes. These are separate from regular text flow edges and enable persona injection into prompts.

**Adapter management:**
- **Add adapter** — Click the dashed "+" ghost button on the top of the node, or drag a connection from a character node and drop it onto the ghost button (auto-creates handle + connects)
- **Remove adapter** — Double-click the red adapter handle, or select the adapter edge and press Backspace/Delete (both methods clean up the handle + re-index remaining adapters)
- **Max adapters** — 5 per node

### Character Lock-Follow

ConsistentCharacter nodes display a lock/unlock icon (top-right, outside the node container) when connected to a downstream node via adapter-out. When **locked**, dragging the target node also drags the locked character node(s) alongside it, maintaining their relative position.

---

## AI Providers

### Text Providers

All text providers use OpenAI-compatible APIs via the OpenAI SDK.

| Provider    | Text Model                  | Vision Model         | Base URL                                 |
| ----------- | --------------------------- | -------------------- | ---------------------------------------- |
| Mistral     | ministral-14b-2512          | pixtral-12b-2409     | `https://api.mistral.ai/v1`             |
| GLM (Z.AI)  | glm-4.7-flash              | glm-4.6v             | `https://api.z.ai/api/coding/paas/v4`  |
| OpenRouter  | dolphin-mistral-24b (free)  | —                    | `https://openrouter.ai/api/v1`          |
| HuggingFace | Qwen2.5-72B-Instruct       | Qwen2.5-VL-7B       | `https://router.huggingface.co/v1`      |
| Claude CLI  | (local CLI)                 | (local CLI)          | Local process                            |

### Image Providers

| Provider    | Models                                          | API Endpoint                                        |
| ----------- | ----------------------------------------------- | --------------------------------------------------- |
| HuggingFace | FLUX.1-schnell (fast), FLUX.1-dev (quality)     | `https://router.huggingface.co/hf-inference/models/` |
| GLM-Image   | GLM-Image (Z.AI native)                         | `https://api.z.ai/api/paas/v4/images/generations`   |

> **Note:** GLM-Image uses the Z.AI native API directly (not routed through HuggingFace). It returns an image URL which is downloaded and converted to base64 by the provider. Uses `GLM_API_KEY`.

### Dynamic Model Configuration (Backend-Driven)

Model parameters are now managed by the **FastAPI backend** with JSON schema generation. Each model has specific configurable parameters (e.g., `aspect_ratio`, `safety_check`, `guidance_scale`) that are dynamically rendered in the settings modal.

**Backend endpoint:** `GET /api/v1/providers/models/schemas` — returns field schemas per model

**Frontend integration:**
- `src/lib/provider-schemas.ts` — fetches model schemas from backend
- `src/components/shared/SchemaField.tsx` — dynamic field renderer (select, boolean, number, text)
- `src/components/nodes/NodeSettingsPopover.tsx` — modal with provider/model dropdowns + dynamic parameter fields

**Field types:**
- `select` → dropdown with options
- `boolean` → checkbox
- `number` → number input with min/max/step validation
- `text` → text input

**Priority chain:** node override → node-type defaults → provider defaults

### Per-Node Model Defaults

Each node type has a default provider + model assignment. Resolution priority:

```
nodeData override  →  node-type default
```

| Node Type        | Default Provider | Default Model              | Rationale                      |
| ---------------- | ---------------- | -------------------------- | ------------------------------ |
| grammarFix       | mistral          | ministral-14b-2512         | Mechanical — fast and cheap    |
| compressor       | mistral          | ministral-14b-2512         | Summarization — lightweight    |
| promptEnhancer   | mistral          | ministral-14b-2512         | Good writing, fast turnaround  |
| initialPrompt    | mistral          | ministral-14b-2512         | Persona injection only         |
| translator       | mistral          | ministral-14b-2512         | Mechanical — fast and reliable |
| storyTeller      | mistral          | labs-mistral-small-creative| Creative writing specialist    |
| imageDescriber   | claude           | (CLI default)              | Vision — rate-limit avoidance  |
| personasReplacer | claude           | (CLI default)              | Vision — rate-limit avoidance  |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout (Geist font, Sonner toasts, DIProvider)
│   ├── globals.css                         # Tailwind theme, dark mode
│   ├── (public)/                           # Public route group
│   │   ├── layout.tsx                      # Shared public layout (Navbar)
│   │   ├── page.tsx                        # Landing page (/)
│   │   └── login/page.tsx                  # Login page (/login)
│   ├── (authenticated)/                    # Authenticated route group
│   │   ├── layout.tsx                      # Auth guard + MainSidebar + header + UserAvatar
│   │   └── home/page.tsx                   # Home page (/home)
│   ├── image-genai/
│   │   ├── layout.tsx                      # Image GenAI layout (AppSidebar, own auth guard)
│   │   ├── page.tsx                        # Main canvas (React Flow + sidebar + toolbar)
│   │   ├── characters/page.tsx             # Character management page
│   │   └── settings/page.tsx               # Settings page
│   ├── backoffice/
│   │   ├── layout.tsx                      # Root wrapper (minimal dark bg)
│   │   ├── login/page.tsx                  # Admin login page (/backoffice/login)
│   │   └── (dashboard)/                    # Protected route group
│   │       ├── layout.tsx                  # Auth guard + BackofficeSidebar + header
│   │       └── page.tsx                    # Dashboard home (/backoffice)
│   ├── prototype/page.tsx                  # Prototype/legacy page
│   └── api/
│       ├── enhance/route.ts                # POST — prompt enhancement
│       ├── translate/route.ts              # POST — translation
│       ├── describe/route.ts               # POST — image description (vision)
│       ├── replace/route.ts                # POST — persona replacement
│       ├── storyteller/route.ts            # POST — creative story generation
│       ├── grammar-fix/route.ts            # POST — grammar correction
│       ├── compress/route.ts               # POST — text compression
│       ├── inject-persona/route.ts         # POST — persona injection into text
│       ├── generate-image/route.ts         # POST — image generation (FLUX, GLM-Image)
│       ├── pipeline/route.ts               # POST — legacy two-step pipeline
│       ├── providers/route.ts              # GET — available text AI providers
│       ├── image-providers/route.ts        # GET — available image AI providers
│       ├── characters/route.ts             # GET/POST — character CRUD
│       ├── characters/[id]/image/route.ts  # GET — character avatar image
│       └── claude-code/test-claude/route.ts # GET — Claude CLI connectivity test
├── modules/
│   ├── bootstrap.ts                        # DI wiring: registers all services + dependencies
│   ├── core/                               # Shared infrastructure (domain-agnostic)
│   │   ├── index.ts                        # Core barrel export
│   │   ├── di/                             # Dependency Injection system
│   │   │   ├── Container.ts                # Lightweight DI container (factory-based, lazy singletons)
│   │   │   ├── tokens.ts                   # Symbol-based service tokens (TOKENS.EventBus, etc.)
│   │   │   ├── react.tsx                   # DIProvider, useContainer(), useService() hook
│   │   │   └── index.ts                    # DI barrel export
│   │   ├── bus/
│   │   │   ├── EventBus.ts                 # Generic typed EventBus<TEventMap> class
│   │   │   └── index.ts
│   │   ├── events/
│   │   │   └── index.ts                    # Shared cross-module event types (placeholder)
│   │   └── logger/
│   │       ├── Logger.ts                   # Colored console logger with module prefix
│   │       └── index.ts
│   ├── websocket/                           # WebSocket infrastructure (domain-agnostic)
│   │   ├── WebSocketManager.ts             # Singleton: connect, reconnect, ping/pong, pub/sub
│   │   ├── types.ts                        # WSMessage, WSConfig, connection state types
│   │   └── index.ts                        # Barrel + backward-compat singleton (get/set)
│   └── image-gen-editor/                   # Image-gen editor module (single responsibility)
│       ├── index.ts                        # Barrel export (public API surface)
│       ├── event-bus.ts                    # Domain EventMap, BasePayload, emitEditorEvent() helper
│       ├── event-wiring.ts                # Single source of truth for all event subscriptions
│       ├── execution-bridge.ts             # WS execution bridge: send, receive, case mapping
│       ├── model-defaults.ts               # Per-node-type model assignments
│       ├── scene-prompts.ts                # Scene prompt composition from dropdown values
│       ├── image-utils.ts                  # Image processing utilities
│       ├── characters.ts                   # Character data helpers (localStorage)
│       ├── editor-manager/                 # Editor lifecycle facade
│       │   ├── index.ts                    # Barrel export
│       │   ├── ImageGenEditorManager.ts    # Facade: lifecycle + routing (DI constructor injection)
│       │   ├── types.ts                    # EditorStatus, ProjectOption, EditorReactiveState
│       │   ├── store.ts                    # Zustand store + hook + syncReactiveState
│       │   ├── project-service.ts          # ProjectService: fetch, select, create projects
│       │   ├── component-service.ts        # ComponentService: fetch components from backend
│       │   ├── flow-loader.ts              # FlowLoader: load flows from backend API
│       │   └── node-id-service.ts          # NodeIdService: monotonic node ID counter
│       ├── auto-save/                      # Auto-save subsystem
│       │   ├── index.ts                    # Barrel export
│       │   ├── AutoSaveManager.ts          # Browser lifecycle (beforeunload) — no event deps
│       │   ├── types.ts                    # Config constants + SerializableFlow
│       │   ├── serializer.ts               # serializeFlow() — strips runtime state
│       │   ├── persistence.ts              # saveFlow() + flushAll() via axios api instance
│       │   └── scheduler.ts               # scheduleSave() debounce + cancelAll()
│       ├── undo-manager/                   # Undo/redo subsystem
│       │   ├── index.ts                    # Barrel export
│       │   ├── UndoManager.ts             # Facade: routes to history + scheduler (DI-managed)
│       │   ├── types.ts                    # Snapshot, FlowHistory, config constants
│       │   ├── history.ts                  # HistoryStack: per-flow past/future stacks
│       │   └── scheduler.ts               # SnapshotScheduler: debounce + batch window
│       └── engine/
│           ├── index.ts                    # Engine barrel export
│           ├── types.ts                    # NodeOutput, ExecutionState, StatusCallback types
│           ├── runner.ts                   # executeGraph() — orchestrates full pipeline run
│           ├── graph/                      # Graph analysis sub-module
│           │   ├── GraphManager.ts         # Facade for graph operations (DI-managed)
│           │   ├── index.ts                # Barrel export
│           │   ├── topological-sort.ts     # Kahn's algorithm, cycle detection
│           │   ├── edge-classification.ts  # Text vs adapter edge classification
│           │   └── traversal.ts            # BFS upstream/downstream traversal
│           └── executor/                   # Node executor sub-module
│               ├── ExecutorManager.ts      # Registry manager (DI constructor injection)
│               ├── index.ts                # Barrel export
│               ├── utils.ts               # Shared helpers (mergeInputText, persona injection)
│               ├── data-sources.ts         # consistentCharacter, sceneBuilder executors
│               ├── text-processing.ts      # initialPrompt, promptEnhancer, translator, etc.
│               ├── image-processing.ts     # imageDescriber, imageGenerator, personasReplacer
│               └── output.ts              # textOutput executor
├── components/
│   ├── landing/
│   │   ├── navbar.tsx                      # Landing page fixed navbar
│   │   ├── hero.tsx                        # Hero section
│   │   ├── features.tsx                    # Features grid
│   │   ├── how-it-works.tsx                # How it works steps
│   │   ├── use-cases.tsx                   # Use case cards
│   │   ├── cta-footer.tsx                  # CTA + footer
│   │   ├── section-wrapper.tsx             # Reusable scroll-animated section
│   │   ├── gradient-text.tsx               # Reusable gradient text component
│   │   └── feature-card.tsx                # Reusable animated feature card
│   ├── nodes/
│   │   ├── index.ts                        # Node type registry (nodeTypes map)
│   │   ├── BaseNode.tsx                    # Shared node shell (header, handles, status ring)
│   │   ├── InitialPromptNode.tsx           # Text input node
│   │   ├── PromptEnhancerNode.tsx          # Enhance text with notes
│   │   ├── TranslatorNode.tsx              # Language translation
│   │   ├── StoryTellerNode.tsx             # Creative story generator
│   │   ├── GrammarFixNode.tsx              # Grammar correction
│   │   ├── CompressorNode.tsx              # Text compression
│   │   ├── ImageDescriberNode.tsx          # Vision → text description
│   │   ├── ImageGeneratorNode.tsx          # Text → image generation
│   │   ├── PersonasReplacerNode.tsx        # Persona swap on target image
│   │   ├── ConsistentCharacterNode.tsx     # Character persona data source
│   │   ├── SceneBuilderNode.tsx            # Scene attribute composer
│   │   ├── TextOutputNode.tsx              # Terminal text display
│   │   ├── GroupNode.tsx                   # Visual grouping container
│   │   └── NodeSettingsPopover.tsx         # Per-node settings popover
│   ├── shared/
│   │   ├── ImageUpload.tsx                 # Reusable image upload (drag/paste/click)
│   │   ├── LanguageSelect.tsx              # Language dropdown
│   │   ├── GeneralDropdown.tsx             # Reusable dropdown (value/label options, Radix popover)
│   │   ├── Modal.tsx                       # Reusable modal with blurry backdrop + fade animation
│   │   ├── ProviderSelect.tsx              # AI provider selector (characters, prototype pages)
│   │   ├── UserAvatar.tsx                  # Reusable user avatar (initials, gradient circle)
│   │   ├── AppToaster.tsx                  # Sonner toaster (dark theme, bottom-right)
│   │   └── icon-registry.ts               # Lucide icon name → component lookup map
│   ├── providers/
│   │   └── AppProviders.tsx                # Client-side DI bootstrap + DIProvider wrapper
│   ├── backoffice/
│   │   └── backoffice-sidebar.tsx          # Backoffice sidebar (Dashboard, Users, Projects, Analytics, Settings)
│   ├── ui/                                 # Radix UI primitives (button, dialog, popover, command)
│   ├── main-sidebar.tsx                    # Main app sidebar (Home, Image GenAI, Agents, Settings)
│   ├── app-sidebar.tsx                     # Image GenAI sidebar (Editor, Characters, Settings)
│   ├── TabBar.tsx                          # Multi-flow tab bar
│   └── ImageLightbox.tsx                   # Full-screen image viewer
├── store/
│   ├── flow-store.ts                       # Zustand store (multi-flow state + actions)
│   ├── user-store.ts                       # Zustand store (current user details, localStorage-persisted)
│   └── types.ts                            # FlowData, TabState interfaces
└── lib/                                    # General utilities + AI provider infrastructure
    ├── constants.ts                        # Branding constants (BRAND.name, tagline, description)
    ├── auth.ts                             # Token helpers (get/set/clear tokens, isAuthenticated)
    ├── backoffice-auth.ts                  # Backoffice token storage helpers
    ├── api.ts                              # Axios instance (baseURL, Bearer interceptor, auto-refresh)
    ├── providers.ts                        # Text AI provider config + OpenAI client factory
    ├── image-providers.ts                  # Image generation provider registry
    ├── toast.ts                            # Sonner toast helpers (success/error/info/warning)
    ├── utils.ts                            # General utilities (cn, clsx)
    ├── agents/                             # Agent framework (template-based prompts, executor)
    └── claude-code/                        # Claude CLI integration (API adapter)
```

---

## State Management

The Zustand store manages multiple flows simultaneously with tab-based navigation.

### Store Shape

```typescript
interface TabState {
  activeFlowId: string;      // Currently visible flow
  flowIds: string[];          // Tab order
  flows: Record<string, FlowData>;
}

interface FlowData {
  id: string;
  name: string;
  nodes: Node[];              // React Flow nodes
  edges: Edge[];              // React Flow edges
  hoveredGroupId: string | null;
  execution: ExecutionState;  // Running status, outputs, provider
  isDirty: boolean;           // Unsaved changes flag
  lastSavedAt: number | null;
}

interface ExecutionState {
  isRunning: boolean;
  nodeStatus: Record<string, NodeExecutionStatus>;   // idle|pending|running|complete|error|skipped
  nodeOutputs: Record<string, NodeOutput>;
  globalError: string | null;
  providerId: string;
}
```

### Key Actions

- **Flow CRUD**: `createFlow` (empty canvas), `closeFlow`, `switchFlow`, `renameFlow`
- **Graph editing**: `onNodesChange`, `onEdgesChange`, `onConnect`, `updateNodeData`, `addNode`
- **Adapter management**: `removeAdapter` (double-click or edge delete with re-indexing), `connectToGhostAdapter` (auto-create handle + edge on ghost drop)
- **Execution**: `runFromNode` (partial graph re-execution with smart upstream resolution)
- **Undo/Redo**: `undo`, `redo` — per-flow history via `UndoManager` singleton
- **State**: `markClean`, `patchFlow` (immutable update helper)

---

## Persistence

Flows are persisted to the FastAPI backend database as JSONB (`graph_data` column in the `flows` table). The old file-based persistence (`users/test/flows/`) has been removed.

### Auto-Save Flow

1. Any state change in the store emits `flow:dirty` via the event bus
2. `auto-save/` listens for `flow:dirty` and debounces saves (2 second delay)
3. Save serializes the flow (strips runtime state) and sends via `api.post()` to FastAPI backend
4. On page unload, `flushAll()` fires `api.post()` for each dirty flow (fire-and-forget)

### Backend Flow API

| Method | Path                          | Description                           |
| ------ | ----------------------------- | ------------------------------------- |
| POST   | `/api/v1/flows/save-flow`    | Upsert a flow (auto-save, create/update) |

---

## Backend Auth API

The frontend communicates with a separate FastAPI backend for authentication.

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/v1/auth/login` | Credentials + password → access + refresh tokens (user) |
| POST | `/api/v1/auth/refresh` | Refresh token → new token pair |
| POST | `/api/v1/auth/backoffice/login` | Credentials + password → access + refresh tokens (admin) |

Access tokens expire in 30 minutes, refresh tokens in 7 days. The axios interceptor in `api.ts` handles automatic token refresh transparently.

---

## Backend Projects API

| Method | Path | Body | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/api/v1/projects` | `{ project_name, user_id }` | Create a new project |
| POST | `/api/v1/projects/select` | `{ user_id }` | List all projects for a user |

---

## Backend Components API

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/v1/components/get-components` | Fetch all component definitions (type, name, category, icon, color) |

Components are stored in the `agentic_components` table and returned grouped by category in the sidebar. The frontend resolves icon name strings to lucide-react components via `icon-registry.ts`.

---

## Backend Database Schema

The FastAPI backend uses the following tables:

### Component System (server-driven node registry)

| Table | Purpose |
| ----- | ------- |
| `agentic_components` | Node type blueprints (type, name, category, icon, color, uses_llm, defaults) |
| `component_fields` | Configurable fields per component (field_key, field_type, options, validation) |
| `component_ports` | Input/output handles per component (direction, port_type, is_dynamic) |
| `component_api_config` | Execution/API mapping (api_route, request/response_mapping, executor_type) |
| `component_output_schema` | Output definitions per component (output_key, output_type, source) |

### Data Storage

| Table | Purpose |
| ----- | ------- |
| `flows` | Flow graphs as JSONB (id, name, user_id, project_id, graph_data) |
| `characters` | Character personas (name, description, image_path, user_id, project_id) |
| `users` | User accounts |
| `projects` | User projects |

All 13 node types are seeded in the component tables with their fields, ports, API configs, and output schemas.

---

## API Routes — AI Processing

All AI processing routes accept a `providerId` and optional `model` field. They resolve the AI provider, call the external API, and return the result.

| Route                  | Input                               | Output               | Used by             |
| ---------------------- | ----------------------------------- | -------------------- | ------------------- |
| `/api/enhance`         | `text`, `notes?`                    | `enhanced`           | promptEnhancer      |
| `/api/translate`       | `text`, `language`                  | `translation`        | translator          |
| `/api/describe`        | `images[]`                          | `description`        | imageDescriber      |
| `/api/replace`         | `personas[]`, `targetImage`         | `description`        | personasReplacer    |
| `/api/storyteller`     | `text`, `tags?`                     | `story`              | storyTeller         |
| `/api/grammar-fix`     | `text`, `style?`                    | `fixed`              | grammarFix          |
| `/api/compress`        | `text`                              | `compressed`         | compressor          |
| `/api/inject-persona`  | `personas[]`, `promptText`          | `injected`           | initialPrompt, promptEnhancer, storyTeller |
| `/api/generate-image`  | `prompt`, `providerId?`, `model?`   | `imageData` (base64) | imageGenerator      |
| `/api/pipeline`        | `images[]`, `targetImage`           | `personaDescription`, `replacePrompt` | (legacy) |

---

## Event Bus

The event bus uses a generic `EventBus<T>` class from `src/modules/core/bus/` instantiated with the editor's domain `EventMap` in `src/modules/image-gen-editor/event-bus.ts`. It decouples the UI, persistence, and execution layers.

### Architecture

- **EventBus** (`src/modules/core/bus/EventBus.ts`) — generic typed pub/sub with built-in logging (every `emit()` logs via Logger)
- **EventMap** (`src/modules/image-gen-editor/event-bus.ts`) — domain event catalog with typed payloads; every event includes `userId` via `BasePayload`
- **emitEditorEvent()** (`src/modules/image-gen-editor/event-bus.ts`) — typed emit helper that auto-injects `userId` from the user store; all emit sites use this instead of `eventBus.emit()` directly
- **event-wiring.ts** (`src/modules/image-gen-editor/event-wiring.ts`) — **single source of truth** for all event subscriptions; called once by `bootstrap()`; no service subscribes to events in its own `init()`

### Event Catalog

All payloads include `{ userId }` via `BasePayload` (auto-injected by `emitEditorEvent()`).

| Event                    | Payload (+ userId)                       | Wired Handlers           |
| ------------------------ | ---------------------------------------- | ------------------------ |
| `flow:created`           | `{ flowId, name }`                       | —                        |
| `flow:closed`            | `{ flowId }`                             | —                        |
| `flow:switched`          | `{ flowId }`                             | —                        |
| `flow:renamed`           | `{ flowId, name }`                       | —                        |
| `flow:dirty`             | `{ flowId }`                             | Auto-save (debounced)    |
| `flow:saved`             | `{ flowId }`                             | —                        |
| `editor:status`          | `{ status: "disabled" \| "active" }`     | —                        |
| `execution:started`      | `{ flowId }`                             | —                        |
| `execution:node-status`  | `{ flowId, nodeId, status, output? }`    | —                        |
| `execution:completed`    | `{ flowId }`                             | —                        |
| `execution:error`        | `{ flowId, error }`                      | —                        |

### Emitting Events

```typescript
import { emitEditorEvent } from "@/modules/image-gen-editor";

// userId is auto-injected from the user store — never pass it manually
emitEditorEvent("flow:dirty", { flowId });
// → payload: { flowId, userId: "user-abc-123" }
```

### Adding Event Handlers

All subscriptions go in `src/modules/image-gen-editor/event-wiring.ts`:

```typescript
export function wireEditorEvents(eventBus: EditorEventBus): void {
  unsubs.push(
    eventBus.on("flow:dirty", ({ flowId }) => scheduleSave(flowId)),
  );
  // Add new handlers here — this is the ONLY file with .on() calls
}
```

---

## Dependency Injection

The app uses a lightweight custom DI container (no external library). All services are registered with their dependencies in a single `bootstrap()` function, making the dependency graph explicit and readable.

### Container Design

- **Factory-based registration**: each service is created via a factory that receives the container
- **Lazy singletons**: instances are created on first `resolve()`, cached forever
- **Idempotent bootstrap**: module-level `_container` guard ensures `bootstrap()` runs exactly once, even when React 18 Strict Mode double-invokes `useMemo` factories
- **No decorators / reflect-metadata**: works cleanly with Next.js + React
- **Symbol-based tokens**: unique, debuggable, zero collision risk

### Registered Services (11 tokens)

| Token | Class | Scope | Dependencies |
| ----- | ----- | ----- | ------------ |
| `TOKENS.EventBus` | `EventBus<EventMap>` | Singleton | None (leaf) |
| `TOKENS.WebSocketManager` | `WebSocketManager` | Singleton | Logger |
| `TOKENS.GraphManager` | `GraphManager` | Singleton | None (stateless) |
| `TOKENS.ExecutorManager` | `ExecutorManager` | Singleton | Logger |
| `TOKENS.UndoManager` | `UndoManager` | Singleton | None (self-contained) |
| `TOKENS.AutoSaveManager` | `AutoSaveManager` | Singleton | None (browser lifecycle only) |
| `TOKENS.ProjectService` | `ProjectService` | Singleton | None |
| `TOKENS.ComponentService` | `ComponentService` | Singleton | None |
| `TOKENS.FlowLoader` | `FlowLoader` | Singleton | None |
| `TOKENS.NodeIdService` | `NodeIdService` | Singleton | None |
| `TOKENS.EditorManager` | `ImageGenEditorManager` | Singleton | AutoSaveManager, ProjectService, ComponentService, FlowLoader, NodeIdService |

### Bootstrap & React Integration

```
App loads → layout.tsx renders <AppProviders>
  → AppProviders calls bootstrap() via useMemo
    → Idempotency guard: if already called, returns existing container
    → Container created, all 11 factories registered
    → Backward-compat singletons eagerly resolved (EventBus, UndoManager, WS Manager, etc.)
    → wireEditorEvents() subscribes EventBus handlers
    → wireExecutionWs() subscribes WS execution event handlers
  → AppProviders useEffect connects WebSocket when user is authenticated
  → <DIProvider container={container}> wraps the app
    → Components use useService<T>(TOKENS.X) to resolve services
```

> **Note:** The idempotency guard is critical. React 18 Strict Mode (enabled by default in Next.js 13+) double-invokes `useMemo` factories in development. Without the guard, a second Container would be created and its backward-compat singletons would overwrite the first set — leaving the module-level `getWebSocketManager()`, `eventBus`, etc. pointing to orphaned, never-connected instances.

### Usage in Components

```typescript
import { useService } from "@/modules/core/di";
import { TOKENS } from "@/modules/core/di";
import type { ImageGenEditorManager } from "@/modules/image-gen-editor";

const editor = useService<ImageGenEditorManager>(TOKENS.EditorManager);
```

### Backward Compatibility

Existing `import { eventBus }`, `import { undoManager }`, `import { imageGenEditor }` patterns still work via Proxy objects that delegate to the DI-managed instances. These will be migrated incrementally.

---

## UI Features

- **Landing Page** — Modern marketing page with Framer Motion scroll animations, Navbar, Hero, Features, How It Works, Use Cases, CTA
- **Node Canvas** — React Flow canvas with drag-and-drop node placement from a categorized sidebar
- **Multi-Flow Tabs** — Create, switch, rename, and close multiple flows as tabs
- **Undo/Redo** — Ctrl+Z / Ctrl+Shift+Z with per-flow history, debounced drag/typing, batch grouping for compound actions (node delete + edge cleanup = one undo step)
- **Per-Node Play** — Every node has a play button to re-run from that point (smart upstream resolution: unexecuted ancestors run first, cached outputs reused)
- **Edge Animation** — Running nodes animate their outgoing edges in real-time
- **Status Indicators** — Each node shows its execution state (pending → running spinner → green complete / red error)
- **Toast Notifications** — Sonner-based themed toasts for pipeline completion, errors, and info
- **Image Upload** — Drag & drop, Ctrl+V paste from clipboard, or click to pick files
- **Provider Selection** — Per-node provider + model override via settings modal on all nodes. Image Generator nodes show image providers; text nodes show text providers. Modal includes dynamic model-specific parameter fields (backend-driven schemas). Compact design with small fonts and tight spacing. Safety_check parameter always appears at the bottom.
- **Project Selector** — Dropdown in the editor header to select/create projects (backed by FastAPI `POST /api/v1/projects` and `POST /api/v1/projects/select`)
- **LLM Indicator** — Nodes that use AI models display a brain icon in the header
- **Image Lightbox** — Click generated images for full-screen preview
- **Copy to Clipboard** — TextOutput nodes have a one-click copy button
- **User Avatar** — Gradient initials avatar in the authenticated header, pulled from Zustand user store
- **Character Management** — Create and manage consistent character personas at `/image-genai/characters`
- **Multi-Select** — Shift+Click to add/remove nodes from selection; Shift+Drag for box (marquee) select
- **Controls** — React Flow zoom controls and a help button (?) with an interactive shortcut reference popup
- **Help Panel** — Click the ? button in the bottom-left controls to view all canvas controls, selection, connection, keyboard shortcuts, and node interaction instructions in a two-column popup
- **Adapter Handle Management** — Double-click red adapter handles to remove; drop connections on ghost "+" button to auto-create + connect; select adapter edge + Backspace to remove with handle cleanup
- **Character Lock-Follow** — Lock icon on connected ConsistentCharacter nodes; when locked, character follows its target during drag
- **Dark Theme** — Dark-first gradient theme with Geist font family

### Keyboard Shortcuts

| Shortcut         | Action                                  |
| ---------------- | --------------------------------------- |
| Ctrl+Z           | Undo (flow-level, skipped in text inputs) |
| Ctrl+Shift+Z / Ctrl+Y | Redo                               |
| Ctrl+T           | New flow tab                            |
| Ctrl+W           | Close current tab                       |
| Ctrl+Tab         | Next tab                                |
| Ctrl+Shift+Tab   | Previous tab                            |
| Shift+Click      | Add/remove node from selection          |
| Shift+Drag       | Box select multiple nodes               |
| Backspace/Delete | Remove selected nodes/edges (adapter edges also clean up handles) |
| Double-click edge| Remove a connection                     |
| Double-click adapter handle | Remove adapter input + its edge |

---

## CLI Scripts

```bash
# Full pipeline (legacy two-step: describe + replace)
pnpm pipeline -- -p persona.jpg -t target.jpg [-r ref1.jpg] [-x "extra text"]

# Test visual analysis on a single image
pnpm test:visual -- ./image.jpg

# Test replace step with a description
pnpm test:replace -- -t target.jpg -d "persona description text"

# Test Claude Code CLI connectivity
pnpm test:claude
```

---

## Adding a New Text Provider

Edit `src/lib/providers.ts`:

```typescript
const yourModels: ProviderModel[] = [
  { id: "model-name", name: "Model Display Name" },
  { id: "vision-model", name: "Vision Model", supportsVision: true },
];

yourProvider: {
  id: "yourProvider",
  name: "Display Name",
  textModel: "model-name",
  visionModel: "vision-model-name",
  supportsVision: true,
  baseURL: "https://api.provider.com/v1",
  apiKeyEnv: "YOUR_API_KEY",
  models: yourModels,  // Shown in per-node settings dropdown
},
```

Then add `YOUR_API_KEY=...` to `.env.local`.

## Adding a New Image Provider

Edit `src/lib/image-providers.ts` — implement the `ImageProvider` interface:

```typescript
const yourProvider: ImageProvider = {
  id: "yourProvider",
  name: "Display Name",
  models: [
    { id: "model-id", name: "Model Name" },
  ],
  async generate(prompt, model, options) {
    // Call your API, return { imageData, width, height }
  },
};

// Register in the registry:
const imageProviderRegistry: Record<string, ImageProvider> = {
  huggingface,
  yourProvider,  // ← add here
};
```
