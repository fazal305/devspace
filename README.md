# DevSpace

**A local-first developer workspace that runs entirely in your browser.**

Live demo: **[devspace-snowy.vercel.app](https://devspace-snowy.vercel.app)**

> Your workspace belongs to your browser. Projects, files, and snippets are stored in IndexedDB on your machine — nothing is uploaded, and everything keeps working offline.

---

## Overview

DevSpace is a small, self-contained IDE-style workspace: create projects, edit real code with syntax highlighting, search across every file in every project, save reusable snippets, and import/export whole projects as zip archives or real local folders — all without a backend. It's built to demonstrate advanced front-end engineering rather than to clone an existing product: local-first data architecture, a real code editor (CodeMirror 6), Web Workers for off-main-thread search, a hand-written Service Worker for offline capability, and a modular React architecture built around Context + reducers + custom hooks.

## Why I built it

Most portfolio projects are CRUD demos against a REST API. DevSpace is deliberately the opposite: the interesting engineering problems are all on the client — designing an IndexedDB schema that supports a real file tree with cascade deletes and moves, keeping a CodeMirror instance in sync with React state without fighting either, offloading expensive search to a worker with a clean promise-based protocol, and making the whole thing degrade gracefully across browsers that don't support the newer APIs it opportunistically uses (File System Access, Web Notifications, BroadcastChannel, `performance.memory`).

## Live Demo

**[https://devspace-snowy.vercel.app](https://devspace-snowy.vercel.app)**

Deployed as a static Vite build on Vercel. Everything you create there lives in *your* browser's IndexedDB — refresh and it's still there; open it on another device and it starts empty, by design.

## Features

- **Projects** — create (from a blank project or one of five structured starter templates), rename, duplicate, favorite, delete, all persisted to IndexedDB
- **File explorer** — nested folders, create/rename/duplicate/delete, drag-and-drop move, unsaved-change indicators
- **Editor** — CodeMirror 6 with syntax highlighting for JS/JSX/HTML/CSS/JSON/Markdown/XML/SQL, multi-tab editing, search-in-file, tab indentation, Ctrl+S save
- **Workspace search** — substring search across every file in every project, executed in a Web Worker so large workspaces don't freeze the UI
- **Command palette** (Ctrl/Cmd+K) and **quick-open** (Ctrl/Cmd+P) — data-driven command registry with arrow-key navigation
- **Snippets** — save, search, filter by language/tags, copy to clipboard, insert into the active editor
- **Console** — a live log of application events (project created, file saved, search completed, import results, …), separate from transient toast notifications
- **Import/export** — zip a project (with metadata) for download, or import *any* zip (not just DevSpace's own exports) with path sanitization and validation reporting
- **File System Access** — open a real local folder as a project, or save a project back out to disk, where the browser supports it
- **Offline support** — a hand-written Service Worker precaches the app shell and opportunistically caches built assets, so a second visit works with no network at all
- **Performance panel** — live FPS, `performance.memory` where available, page load time, and recorded Web Worker / IndexedDB operation timings
- **Theme system** — light / dark / system, built entirely on CSS custom properties
- **Responsive** — the sidebar becomes a slide-in drawer below 768px; verified at mobile/tablet/desktop widths

## Architecture

### Technology stack

| Concern | Choice | Why |
|---|---|---|
| UI | React 19 + Vite | fast dev loop, no framework lock-in needed for a client-only app |
| Editor | CodeMirror 6 | ~10x lighter than Monaco, modular per-language imports, first-class mobile support — Monaco's VS Code fidelity wasn't worth the weight for an app that already ships its own file tree/tabs |
| Persistence | IndexedDB via Dexie | raw IndexedDB's callback API makes schema versioning and compound-index queries painful; Dexie is a thin promise wrapper, not a replacement for the repository-layer abstraction |
| Reactive queries | dexie-react-hooks | avoids hand-rolling change-tracking for "when does this component need to refetch" |
| Styling | CSS Modules + CSS custom properties | scoped styles with full control over the token-driven theme system; no utility-class framework fighting the design-token approach |
| Archives | JSZip | the only external dependency with no equivalent built-in browser API |

No state-management library, no CSS framework, no UI kit, no router (navigation is panel-based, not URL-based — there was nothing for a router to do). Every dependency above replaces something that would otherwise be substantial, error-prone reinvention (a zip codec, cross-browser IndexedDB transactions, a code editor with undo/redo and bracket matching) — nothing was added for convenience alone.

### React architecture

- **Context**, used only for genuinely global state: `ThemeContext`, `SettingsContext` (persisted UI prefs), `NotificationContext` (toasts *and* the console log, from one call site), `WorkspaceContext` (active project, open tabs, dirty tracking).
- **`useReducer`** inside `WorkspaceContext` for the actually-complex transitions (open/close tabs, mark dirty/clean, switch active file) — see `reducers/workspaceReducer.js`.
- **Custom hooks** for repeated behavior: `useLiveCollection`/`useProjects`/`useProjectEntries`/`useSnippets` (reactive IndexedDB reads), `useWorker` (promise-based Worker client), `useKeyboardShortcuts`, `useCommandPalette`, `usePerformanceMonitor`, `useOnlineStatus`, `useWebNotification`.
- **Lazy loading / code splitting**: `EditorArea` (CodeMirror and all its language packages — the single heaviest dependency) is loaded via `React.lazy` only once a project is actually opened, cutting the initial bundle from ~1.1MB to ~460KB.
- **Error boundary**: a top-level `ErrorBoundary` catches render errors and offers a reload instead of a blank white screen.
- Local component state is used everywhere state doesn't need to be shared — dialogs, form fields, expand/collapse UI state stay local.

### Data model

Everything lives in one Dexie database (`devspace`):

```
projects
  id, name, description, favorite, settings, template, createdAt, updatedAt

entries                        # files AND folders, one self-referencing tree table
  id, projectId, parentId, name, type ('file'|'folder'), language, content,
  createdAt, updatedAt
  indexes: [projectId+parentId] (tree reads), [projectId+name] (quick-open)

snippets
  id, title, description, language, code, tags[], favorite, createdAt, updatedAt

settings                       # key/value store for workspace-level prefs
recentItems                    # recently opened projects/files, self-trimming
```

`files` and `folders` are deliberately one table, not two — a single self-referencing tree collapses move/rename/cascade-delete logic into one code path instead of keeping two structures in sync, which is how real file-tree implementations are usually built internally.

All database access goes through a **repository layer** (`db/repositories/*`) — no component ever imports Dexie directly. Repositories are the only place cascading operations (deleting a project deletes its entries; deleting a folder deletes its descendants) are implemented.

### Browser APIs

| API | Used for | Fallback |
|---|---|---|
| IndexedDB (via Dexie) | all persistent data | none — this is the app's only datastore; a clear "local storage unavailable" message is shown if it's unreachable |
| Web Workers | workspace search, off the main thread | — |
| Service Worker | offline app-shell + asset caching | app still runs fully online-only if registration fails; SW is skipped entirely in dev to avoid fighting HMR |
| File System Access API | open/save a real local folder as a project | feature-detected; buttons disable with an explanatory tooltip on Firefox/Safari |
| Clipboard API | copying snippet code | — |
| Web Notifications | a native notification when a folder import/export finishes *while the tab is hidden* | feature-detected; permission requested lazily, never on load |
| BroadcastChannel | cross-tab consistency — deleting a project in one tab closes it in another tab that has it open | feature-detected, no-ops if unsupported |
| Page Visibility API | gates Web Notifications to only fire when you're not looking | — |
| Performance API (`performance.now`, `performance.memory`, Navigation Timing) | the Performance panel — every number shown is real or explicitly labeled "Not available in this browser," never fabricated | `performance.memory` is Chromium-only and feature-detected |
| `navigator.storage.estimate()` | dashboard storage-usage stat | feature-detected |
| Drag and Drop API | moving files/folders in the explorer | — |

### Web Worker architecture

One worker (`workers/search.worker.js`) plus a small generic client (`services/workerClient.js`, `hooks/useWorker.js`) implementing a request/response protocol keyed by request ID over `postMessage` — callers get `worker.call('search', payload)` returning a promise, never touch `onmessage` directly. A second worker for file/JSON processing is a natural extension point (see Roadmap) but wasn't added speculatively — there's no second real job for it yet.

One non-obvious bug this surfaced during development: creating the Worker instance during render and storing it in a ref works in production, but React 18/19 StrictMode's dev-only mount→unmount→mount cycle terminates that first Worker on the simulated unmount and never replaces it, silently hanging every subsequent `.call()`. The fix was to create the Worker inside a `useEffect` instead of during render.

### Service Worker architecture

Hand-written (no `vite-plugin-pwa`) so the caching mechanics stay visible: on install, the app shell (`/`, `/index.html`, `/favicon.svg`) is precached; navigations are network-first with a cached-shell fallback; other same-origin requests are cache-first, with the cache populated lazily on first successful fetch — so one online visit is enough to make the next load fully offline-capable, without a build-time asset manifest. It's registered only in production builds (`import.meta.env.PROD`), since running a Service Worker against the Vite dev server serves stale cached modules and fights HMR.

## Project Structure

```
devspace/
├── public/
│   ├── favicon.svg          # original geometric monogram, not a real brand asset
│   └── sw.js                # hand-written service worker
├── src/
│   ├── app/                 # App root + provider composition
│   ├── components/
│   │   ├── common/          # Button, Dialog, IconButton, EmptyState, Spinner, ErrorBoundary, ...
│   │   ├── layout/           # AppShell, TopBar, Sidebar, MainWorkspace, BottomPanel
│   │   ├── editor/            # EditorArea, EditorPane (CodeMirror), EditorTabs, cmSetup.js
│   │   ├── explorer/          # FileExplorer, EntryRow
│   │   ├── projects/          # ProjectsPanel, CreateProjectDialog, ImportProjectButton
│   │   ├── snippets/          # SnippetsPanel, SnippetFormDialog
│   │   ├── search/            # SearchPanel
│   │   ├── console/           # ConsoleLog
│   │   ├── command-palette/   # CommandPalette, commands.js
│   │   ├── performance/       # PerformancePanel
│   │   ├── settings/          # SettingsDialog
│   │   └── dashboard/         # Dashboard
│   ├── context/               # Theme, Settings, Notification, Workspace
│   ├── reducers/               # workspaceReducer.js
│   ├── db/
│   │   ├── database.js         # Dexie schema
│   │   └── repositories/       # project/entry/snippet/settings/recentItems repositories
│   ├── workers/                 # search.worker.js
│   ├── services/                 # workerClient, exportService, importService, fileSystemService,
│   │                              # broadcastService, serviceWorkerRegistration
│   ├── hooks/                     # useProjects, useEntries, useSnippets, useWorker,
│   │                              # useKeyboardShortcuts, useCommandPalette, usePerformanceMonitor, ...
│   ├── utils/                     # fileTree, formatters, validators, languageConfig, constants
│   ├── data/                      # starterProjects.js
│   ├── styles/                    # globals.css, variables.css (design tokens)
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Performance Considerations

- **Code-splitting**: CodeMirror and its language packages (the largest dependency by far) are lazy-loaded only when a project is opened, roughly halving the initial JS payload.
- **Search stays off the main thread**: workspace search runs in a Web Worker, so scanning many files never blocks typing or scrolling.
- **Reactive queries, not polling**: `dexie-react-hooks`' `useLiveQuery` subscribes to IndexedDB changes directly rather than components re-fetching on a timer or after every mutation.
- **No loaders for instant operations**: IndexedDB reads/writes are near-instant, so most actions have no spinner at all — a loading state only appears where an operation can plausibly take >200ms (search, import/export).
- **Real metrics only**: the Performance panel never fabricates a number — FPS is measured live via `requestAnimationFrame`, memory via `performance.memory` where it exists, and worker/IndexedDB timings are recorded at their actual call sites, not estimated.

## Security Considerations

- **No `eval()` or `new Function()`** anywhere in the codebase, and no arbitrary code execution — imported project files are treated as inert text content, never executed.
- **Import path sanitization**: every path inside an imported zip is validated segment-by-segment — `.`/`..` segments are rejected (path traversal), reserved filesystem characters are rejected, and known junk (`__MACOSX`, `.DS_Store`, `.git`, `node_modules`) is filtered out. This is defense-in-depth on top of JSZip's own loader-level normalization, verified by directly inspecting the raw zip bytes of a deliberately adversarial archive during development.
- **No unsafe HTML injection**: file content is rendered exclusively through CodeMirror's own text-rendering, never via `dangerouslySetInnerHTML`.
- **Binary files are never blindly decoded as text**: known binary extensions are skipped on import, and oversized files (>2MB) are skipped with a reported warning rather than silently truncated or corrupted.
- **Clipboard and File System Access** are both used only in direct response to a user-initiated click — never triggered automatically.

## Accessibility

- Every icon-only control has an explicit `aria-label` (verified programmatically — an earlier version had the sidebar's Search and Snippets buttons both exposing the ambiguous accessible name "S").
- A skip-to-main-content link is the first focusable element on the page.
- Dialogs implement a real focus trap, `Escape`-to-close, and `aria-modal`/`aria-labelledby`.
- `prefers-reduced-motion` is respected globally — one CSS rule neutralizes every animation/transition in the app, including dialog entrance animations, automatically.
- Color contrast was checked with the actual WCAG relative-luminance formula (not eyeballed) against every theme's token pairs; three real AA failures were found and fixed (white text on dark-theme primary/danger buttons, and faint secondary text in both themes) by introducing tokens dedicated to "safe under white text" rather than reusing accent colors tuned for a different purpose.
- Touch-device usability: row actions (rename/delete/etc.) that reveal on hover are forced always-visible under `@media (hover: none)`, since an invisible-but-tappable button is a real usability bug on touchscreens.

## Browser Compatibility

Built and tested against current Chromium. Every non-universal API (File System Access, Web Notifications, BroadcastChannel, `performance.memory`) is feature-detected and degrades gracefully rather than being assumed:

| Feature | Chrome/Edge | Firefox | Safari |
|---|---|---|---|
| Core app (IndexedDB, Workers, Service Worker) | ✅ | ✅ | ✅ |
| File System Access API | ✅ | ❌ (buttons disable with a tooltip) | ❌ (buttons disable with a tooltip) |
| `performance.memory` | ✅ | ❌ (shows "Not available in this browser") | ❌ (shows "Not available in this browser") |
| Web Notifications / BroadcastChannel | ✅ | ✅ | ✅ (Safari 15.4+) |

## Local Development

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173` (or the next available port). The Service Worker is intentionally **not** registered in dev mode.

```bash
npm run lint     # oxlint
npm run build    # production build to dist/
npm run preview  # serve the production build locally — this is how to actually
                  # exercise the Service Worker and offline behavior
```

## Deployment

The production build is fully static (`dist/`) and needs no server-side runtime — any static host works. This project is deployed on Vercel:

```bash
npx vercel login   # one-time, opens a browser/device login flow
npx vercel --prod
```

## Lessons Learned

- **React StrictMode's double-invoke is a real correctness check, not just noise.** The Web Worker bug above (dead worker after the simulated unmount) is exactly the class of bug StrictMode exists to surface — the fix (create side-effectful resources inside `useEffect`, not during render) is the actually-correct pattern, not a workaround.
- **A prop can update state without updating the DOM you think it controls.** CodeMirror's document is its own source of truth once mounted; an external change to the `content` prop (inserting a snippet into an already-open file) silently failed to reach the editor until a second effect explicitly diffed the prop against `view.state.doc` and only dispatched a transaction when they actually differed.
- **Contrast ratios need to be computed, not eyeballed.** Running the actual WCAG formula against the design tokens caught three real failures that looked fine at a glance.
- **One dependency can quietly be someone else's security boundary.** JSZip normalizing `../` out of stored entry names during its own loader meant a "path traversal" test needed a raw-byte inspection to figure out which layer was actually doing the sanitizing — useful to know, since it changes what a regression in either layer would mean.

## Future Roadmap

Deliberately not implemented, to keep the current feature set coherent rather than half-built:

- Git / GitHub integration
- AI coding assistant
- Real-time collaborative editing
- In-browser terminal emulator
- Package manager integration
- Extension system
- Syntax diagnostics / linting / formatting
- Cloud synchronization (an explicit non-goal for the *current* local-first design — would need a real sync/merge strategy, not just a toggle)

## License

MIT
