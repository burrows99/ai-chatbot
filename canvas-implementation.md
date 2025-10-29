# Canvas Artifact – Setup & Integration Guide (Shadcn-based)

This document defines the `canvas` artifact, its purpose, required configuration, and step-by-step instructions to set up project management views (Kanban, Grid, Gantt) using Shadcn UI components and a simplified, single context provider. It replaces SyncFusion-specific guidance and avoids multiple providers.

## What is a Canvas Artifact?

A `canvas` artifact renders a configurable layout of project-management views driven by JSON `content`. It enables workflows by composing multiple views (Grid, Kanban, Gantt) that share the same data and selections via a centralized, app-wide context. User interactions in any view propagate to others through a single store API.

Core properties:
- Layout-driven composition using `LayoutRenderer` (row/col/component nodes).
- Single, app-wide context provider (e.g., `DashboardContextProvider`) for cross-view sync.
- View adapters that map canonical task data to each view’s UI without duplicating sources.
- Streaming-aware persistence that merges changes into the document `content`.

## Files

- `artifacts/canvas/client.tsx`
  - Defines `canvasArtifact` with kind `"canvas"`.
  - Parses document `content` JSON to read `{ layout, data }`.
  - Renders provided `layout` or falls back to a default multi-view layout.
  - Wires shared data and persistence through a single context store.
- `artifacts/canvas/server.ts`
  - Registers a document handler via `createDocumentHandler<'canvas'>`.
  - Seeds persisted content as: `{ version, title, layout: null, data: [] }`.
  - Normalizes server streaming updates and merges them into the document.
- `artifacts/canvas/defaults.tsx`
  - `buildDefaultLayout()` creates a default layout containing `business.grid`, `business.kanban`, and `business.gantt`.
  - Configures shared data via `sharedKey: 'canvas:tasks'` and includes a Gantt-friendly transform.
- `artifacts/canvas/wrapped.tsx`
  - Lightweight adapters (`GridWrapped`, `KanbanWrapped`, `GanttWrapped`) that bridge registry metadata to Shadcn-based views and the unified context store.
- Related base integration:
  - Single app provider (e.g., `DashboardContextProvider`) exposing `get/set/subscribe/dispatch/select`.
  - `components/layout/*` – JSON-driven layout renderer.

## Purpose in the System

- Centralize dashboard views (tasks, boards, timelines) within a single artifact.
- Enable a cohesive multi-view experience where edits, status changes, and selections stay synchronized.
- Provide a flexible, JSON-configurable layout and registry integration for rapid composition.

---

## Prerequisites & Dependencies

- Shadcn UI installed and available (`components/ui/*`).
- A single, app-level context provider mounted once at the app root.
- Tailwind/Styling: Ensure any dynamic classes used by layout/components are safelisted or mapped to fixed sets.
- Registry: `business.grid`, `business.kanban`, and `business.gantt` must be registered and resolvable by `LayoutRenderer`.
- App routing: `lib/artifacts/server.ts` includes `canvasDocumentHandler` and adds `"canvas"` to `artifactKinds`.

Note: API keys such as `XAI_API_KEY` are unrelated to canvas setup unless server-side streaming/data sources require them.

---

## Context System Integration (Single Provider)

Canvas uses a unified context to synchronize data and selections:

- `DashboardContextProvider`: App-wide provider exposing a store API (`get/set/subscribe/dispatch/select`).
- Shared data key: `dataBinding.sharedKey` (e.g., `'canvas:tasks'`) identifies the canonical dataset used by all views.
- Persistence: Debounced saves merge shared changes into `content.data`, suppressed during server→store sync and streaming.
- Selections: Shared over a common `selectionKey` (default `'canvas:selections'`) as a per-view map.

Typical flow:
1. Server seeds `content` with `{ layout, data }`.
2. Client mounts canvas; content `data` is written into the store under `'canvas:tasks'`.
3. Views render using store selectors and publish user edits via a single `dispatch` or `set` API.
4. Persistence writes updates back to `content.data` (debounced) after suppression lifts.

---

## Content Schema

Document `content` JSON expected by canvas:

```jsonc
{
  "version": 1,
  "title": "Project Dashboard",
  "layout": { /* LayoutNode tree (optional) */ },
  "data": [
    {
      "id": "T-1",
      "title": "Design login page",
      "status": "todo",
      "priority": "high",
      "assignee": "Sam",
      "startDate": "2025-08-15",
      "dueDate": "2025-09-10",
      "progress": 35
    }
  ]
}
```

- If `layout` is omitted or `null`, a default three-view layout (Grid, Kanban, Gantt) is rendered side-by-side, all bound to `data` via the same shared key.

---

## Required Context Parameters

Each component node in the layout may declare `dataBinding` and `props`:

- `dataBinding.sharedKey` (string): Shared store key for cross-view synchronization (recommended: `'canvas:tasks'`).
- `dataBinding.initialData` (array): Seed data when no shared value is present yet.
- `dataBinding.fetcher` (optional): Function or descriptor to fetch data from remote sources.
- `dataBinding.pollIntervalMs` (optional): Polling cadence for the fetcher.
- `selectionKey` (optional): Shared channel for synchronized selections.
- `props` (object): View-specific configuration (columns, status columns, task field mappings, etc.).
- `transform` (optional): Function to map canonical records to view-specific shapes.

---

## Step-by-Step Setup

### 1) Register the Canvas Artifact

- Ensure `canvasDocumentHandler` is registered in `lib/artifacts/server.ts` and `"canvas"` is present in `artifactKinds`.
- In `components/artifact.tsx`, include `canvasArtifact` in `artifactDefinitions` so the artifact can be rendered by the UI.

### 2) Provide Content

- Create a new canvas artifact via chat/tooling with a prompt like: “Create a canvas showing tasks”.
- Persist `content` JSON with `data` and (optionally) `layout`. If `layout` is omitted, the default layout renders.

### 3) Layout Composition

- Use `LayoutRenderer` to render a JSON layout tree.
- Each `component` node requires:
  - `name`: Component registry name (e.g., `business.grid`, `business.kanban`, `business.gantt`).
  - `props`: View-specific configuration.
  - `dataBinding`: Shared data config (e.g., `{ sharedKey: "canvas:tasks", initialData: [...] }`).

---

## View Setup Instructions (Shadcn)

Below are generic setup steps and examples for each view within the canvas. These describe configuration and context hooks, not internal implementation details, and avoid any library-specific providers.

### Kanban View (business.kanban)

- Purpose: Visualize tasks by status with columns; supports add/edit/move actions.
- Data: Uses the shared key (`'canvas:tasks'`) and maps records to Kanban card fields via a lightweight adapter.
- Required context:
  - `dataBinding.sharedKey: 'canvas:tasks'`.
  - `props.statusColumns` (optional): Explicit column list; otherwise inferred from data `status` values with fallback `['todo', 'in-progress', 'done']`.
- Example component node:

```jsonc
{
  "type": "component",
  "name": "business.kanban",
  "props": {
    "title": "Kanban",
    "statusColumns": ["Backlog", "To do", "In progress", "In review", "Done"]
  },
  "dataBinding": {
    "sharedKey": "canvas:tasks",
    "initialData": []
  }
}
```

- Behavior: On add/edit/move, publish changes via the store API (`dispatch`/`set`) under the shared key; columns derive from `props.statusColumns` or unique `status` values.

### Grid View (business.grid)

- Purpose: Tabular view with sorting, filtering, selection, and editing.
- Data: Binds to shared rows and renders Shadcn table primitives with optional adapters.
- Required context:
  - `dataBinding.sharedKey: 'canvas:tasks'`.
  - `props.columns` (optional): Define visible columns, types, widths; otherwise inferred from data keys.
- Example component node:

```jsonc
{
  "type": "component",
  "name": "business.grid",
  "props": {
    "title": "Data Grid",
    "columns": [
      { "field": "id", "header": "ID", "primary": true, "width": 100 },
      { "field": "title", "header": "Title", "width": 250 },
      { "field": "status", "header": "Status", "width": 140 },
      { "field": "assignee", "header": "Assignee", "width": 140 },
      { "field": "dueDate", "header": "Due Date", "type": "date", "width": 140 }
    ]
  },
  "dataBinding": {
    "sharedKey": "canvas:tasks",
    "initialData": []
  }
}
```

- Behavior: Edits and deletes propagate via the store API and keep Kanban/Gantt synchronized.

### Gantt View (business.gantt)

- Purpose: Timeline visualization of tasks; supports dependencies, progress, and scheduling.
- Data: Requires mapping canonical task fields to the timeline view via an adapter.
- Required context:
  - `dataBinding.sharedKey: 'canvas:tasks'`.
  - `transform`: Maps `{ id, title, startDate, dueDate, progress, dependencies }` to view fields.
- Example component node:

```jsonc
{
  "type": "component",
  "name": "business.gantt",
  "props": { "title": "Gantt" },
  "dataBinding": {
    "sharedKey": "canvas:tasks",
    "initialData": []
  },
  "transform": {
    "type": "ganttTaskAdapter",
    "map": {
      "id": "Id",
      "title": "Name",
      "startDate": "StartDate",
      "dueDate": "EndDate",
      "progress": "Progress",
      "dependencies": "Dependencies"
    }
  }
}
```

- Behavior: Reflects shared task changes; uses its transform to produce proper timeline records.

---

## Example Layouts

### Default (Implicit)

Omit `layout` to render the default three-view layout. All views bind to `data` via `'canvas:tasks'`.

### Custom Layout

```jsonc
{
  "layout": {
    "type": "row",
    "children": [
      {
        "type": "col",
        "size": 6,
        "children": [
          {
            "type": "component",
            "name": "business.grid",
            "props": { "title": "Tasks" },
            "dataBinding": { "sharedKey": "canvas:tasks", "initialData": [] }
          }
        ]
      },
      {
        "type": "col",
        "size": 6,
        "children": [
          {
            "type": "component",
            "name": "business.kanban",
            "props": {
              "title": "Board",
              "statusColumns": ["To do", "In progress", "In review", "Done"]
            },
            "dataBinding": { "sharedKey": "canvas:tasks", "initialData": [] }
          },
          {
            "type": "component",
            "name": "business.gantt",
            "props": { "title": "Timeline" },
            "dataBinding": { "sharedKey": "canvas:tasks", "initialData": [] },
            "transform": {
              "type": "ganttTaskAdapter",
              "map": {
                "id": "Id",
                "title": "Name",
                "startDate": "StartDate",
                "dueDate": "EndDate",
                "progress": "Progress",
                "dependencies": "Dependencies"
              }
            }
          }
        ]
      }
    ]
  },
  "data": [
    { "id": "T-1", "title": "Design login page", "status": "To do", "assignee": "Sam", "startDate": "2025-08-15", "dueDate": "2025-09-10", "progress": 35 },
    { "id": "T-2", "title": "Build auth API", "status": "In progress", "assignee": "Mina", "startDate": "2025-08-20", "dueDate": "2025-09-20", "progress": 50 }
  ]
}
```

---

## Data Flow and Persistence

- `dataBinding.sharedKey`: All views reference the same shared key to read/write task data.
- Store API: Views call a single `dispatch`/`set` to publish updates; siblings receive updates immediately.
- Persistence: Debounced saves merge changes back into `content.data` and save the document, suppressed during streaming and server→store sync.
- Selections: A shared selection channel tracks per-view selections; components decide how to reflect them.

---

## Troubleshooting

- Views not updating each other:
  - Verify all components use the same `dataBinding.sharedKey` (e.g., `'canvas:tasks'`).
  - Ensure records have a stable primary key (`id`) and adapters preserve identity.
- Kanban columns missing or incorrect:
  - Provide `props.statusColumns` or ensure `status` values are present in `data`.
- Gantt rendering off:
  - Confirm the `transform` mapping matches field names and date formats; verify `startDate`/`dueDate` values are valid date strings.
- Grid edits not persisting:
  - Check updates are dispatched to the store; confirm persistence suppression is lifted.
- Infinite persistence loop or no saves:
  - Suppress during server→store sync and lift once store equals server data.
  - Use deep equality checks to avoid writing unchanged content.
- Styling or theme issues:
  - Ensure Shadcn styles are loaded and Tailwind configuration allows required classes.

---

## Testing Notes

- Smoke tests:
  - Default layout renders all views when `layout` is omitted.
  - Provided `layout` overrides the default.
- Interaction tests:
  - Editing in Grid reflects in Kanban/Gantt via shared data.
  - Adding/moving cards in Kanban updates shared data.
- Unit/registration tests exist per view (see `components/business/*/*.test.tsx`).