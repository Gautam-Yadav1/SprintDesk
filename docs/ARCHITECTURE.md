# SprintDesk architecture

## Layers

Data flows in one direction. A component never calls `fetch`, and never imports
`mock-data.json`.

```
┌──────────────────────────────────────────────────────────────────────┐
│  UI components            pages/ · features/*/components · components/ui
│    - render props, own local UI state (drawer open, form fields)     │
└───────────────┬──────────────────────────────────────────────────────┘
                │ hooks only
┌───────────────▼──────────────────────────────────────────────────────┐
│  Hooks / query layer      features/*/hooks · hooks/                  │
│    - useTasks, useUsers, useComments, useTaskMutations,              │
│      useNotificationPolling, useSessionBootstrap, useBoardAnalytics  │
│    - owns caching, loading/error state, invalidation                 │
└───────────────┬──────────────────────────────────────────────────────┘
                │ plain async functions
┌───────────────▼──────────────────────────────────────────────────────┐
│  Service layer            services/data/localData.ts                 │
│                           features/auth/services/authApi.ts          │
│                           features/notifications/services/…Api.ts    │
│    - the only place that knows about transports and payload shapes   │
└───────────────┬──────────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────────┐
│  Data sources                                                         │
│    mock-data.json (+ localStorage mirror) · DummyJSON · JSONPlaceholder│
└──────────────────────────────────────────────────────────────────────┘
```

`src/lib/http.ts` sits beside the service layer as the shared transport: a small
fetch client with the request/response interceptor behaviour (bearer token,
401 → refresh → replay). It knows nothing about the auth feature — the feature
registers callbacks into it via `configureAuthHandlers`, which keeps `lib/` free
of feature imports and lets the interceptor be unit-tested on its own.

### Swapping in a real backend

Everything the board renders comes from `services/data/localData.ts`. Its
exported functions are already shaped like an API client (async, cloned results,
artificial latency). Re-implementing those functions against `createHttpClient`
is the entire migration; hooks, stores and components are untouched.

## Request flow, end to end

A drag from *In Progress* to *Done*:

```
TaskCard (drag handle)
  → KanbanBoard.onDragEnd
      → boardStore.moveTask(id, 'done', index)      ← synchronous, persisted
      → useMoveTaskStatus().mutate({ id, status })  ← TanStack Query mutation
            → localData.updateTaskStatus()          ← stamps completedAt
            → queryClient.setQueryData(['tasks'])   ← cache stays in step
  → useBoardAnalytics re-derives                    ← /analytics updates
```

## State ownership

Each piece of state has exactly one home.

| State | Owner | Why |
| ----- | ----- | --- |
| Users, sprints, the 30 tasks, comments | **TanStack Query** | Originates from a service call; needs caching, loading/error state and invalidation |
| DummyJSON login / session restore | **TanStack Query** (mutation + query) | Network calls with pending and error states the UI renders |
| JSONPlaceholder notification feed | **TanStack Query** polling query | `refetchInterval`, paused when the tab is hidden |
| Access token, user, auth status | **Zustand** (`authStore`, not persisted) | Needs synchronous reads from the HTTP layer; deliberately never persisted |
| Refresh token | `sessionStore` module → localStorage | Persisted credential, read once on boot; kept out of the store so there is one copy of it |
| Board column/order arrangement | **Zustand** (`boardStore`, persisted) | Synchronous mutation during a drag, and must survive a refresh |
| Notification list + read state + poll offset | **Zustand** (persisted) | Cross-component, mutated locally, survives reloads |
| Theme | **Zustand** (persisted) | Global, synchronous, persisted |
| Toast queue | **Zustand** (not persisted) | Cross-component and ephemeral; a store keeps `useToast` testable outside React |
| Drawer/modal open, form fields, filters, table sort, panel page | **`useState`** | Used by one component (or its immediate child); nothing else needs to observe them |

React Context is used only where the library requires it (`QueryClientProvider`,
`BrowserRouter`, dnd-kit's `DndContext`). No application data is passed through
Context.

### Why the arrangement lives in Zustand

This is the one genuinely debatable split, so it is worth stating plainly.

Task *entities* originate from the service layer, so TanStack Query owns them.
The board's *arrangement* — which column a card sits in and its order within
that column — is different in kind:

1. **It mutates synchronously, many times per second.** `onDragOver` repositions
   the card as the pointer crosses a column boundary. Writing that through a
   query cache would mean a round trip per frame or a pile of optimistic-update
   bookkeeping.
2. **It must survive a refresh offline.** Zustand's `persist` middleware gives
   that in one line; a query cache is not the right place for user-arranged
   layout.
3. **It is client-authoritative.** Where the user dropped a card is a fact about
   the client, not something the server should be able to reorder underneath
   them mid-session.

So `boardStore` holds `Record<TaskStatus, number[]>` — ids only, never task
copies, so there is no duplicated task data to drift. The store is seeded from
the query result on load and reconciled on every change: unknown ids are placed
into the column matching their stored status (ordered by `order`), ids that no
longer exist are dropped, and existing order is preserved.

Because the arrangement is authoritative for column membership, the task's own
`status` field is treated as a *server projection*: written through on drop, and
read back only when seeding a task the arrangement has not seen. Analytics
derives status from the arrangement, never from the field, which is why moving a
card on `/board` immediately changes the charts on `/analytics`.

## Component map

```
main.tsx  → installAuthInterceptor(), then <App/>
└─ App                      QueryClientProvider · BrowserRouter · ToastViewport
   └─ AppShell              useSessionBootstrap → <FullScreenLoader/> while validating
      └─ AppRoutes          React.lazy per route, <Suspense fallback={<PageSkeleton/>}>
         ├─ PublicOnlyRoute → LoginPage → LoginForm → PasswordStrength (bonus)
         └─ ProtectedRoute  → AppLayout (nav · NotificationBell · ThemeToggle · sign out)
            ├─ DashboardPage    StatCard ×4 · DataTable
            ├─ BoardPage        BoardFilters · KanbanBoard · TaskDrawer · NewTaskModal
            │                   └─ KanbanBoard → DndContext → BoardColumn ×4 → TaskCard
            │                      └─ TaskDrawer → TaskComments · Modal (delete confirm)
            └─ AnalyticsPage    VelocityChart · StatusChart · PriorityChart ·
                                CompletionTrendChart (+ date range, PNG export)
```

`components/ui/` holds the design system — Button, Input/Textarea, Select, Modal,
Toast, DataTable, Skeleton, Badge, Avatar, Spinner. Features compose these; no
feature defines its own button or input.

## Technology choices

| Choice | Reason |
| ------ | ------ |
| **Vite + React 19 + strict TS** | Fast builds, and strict mode catches the class of bug that this codebase's id-keyed lookups would otherwise hide. React 19 satisfies the React 18+ requirement and works with every library here. |
| **TanStack Query v5** | The brief's requirement, and the right tool: it owns cache lifetime, dedupes the boot-time session restore across strict-mode double mounts, and drives the notification polling with `refetchInterval`. |
| **Zustand** | Minimal API for the three things Query should not own (arrangement, notifications, theme), with `persist` for free and synchronous `getState()` reads from non-React code such as the drag handlers. |
| **A hand-written fetch client instead of Axios** | The brief allows either. It removes a dependency, and the refresh-and-retry logic becomes directly testable by mocking `fetch`. |
| **Recharts** | Preferred by the brief for this scope; `ResponsiveContainer` plus `accessibilityLayer` give responsive, keyboard-navigable charts without hand-rolled scales. |
| **`@dnd-kit`** | Required, and its sensor model is what makes pointer, touch and keyboard dragging share one code path. |
| **Tailwind v3** | Required; the design tokens live as CSS custom properties so light/dark is a class swap rather than a second stylesheet. |

## Accessibility and performance decisions

- **Route-level code splitting.** Each page is a `React.lazy` chunk behind one
  `<Suspense>` with a real skeleton. Recharts (~406 kB) only loads on
  `/analytics`; the login screen ships none of it.
- **Memoisation where it changes something.** `TaskCard` is `memo`ised because a
  drag re-renders the board on every pointer move and 30 cards should not
  re-render with it; chart data is derived in a single `useMemo`; the drag
  handlers are `useCallback`s so `DndContext` does not resubscribe mid-drag.
  Nothing else is memoised by reflex.
- **Fixed-height loading states.** Skeletons mirror the shape and row count of
  what replaces them, which is what took the dashboard's layout shift down.
- **Keyboard paths for every interaction**: guarded routes, listbox select,
  focus-trapped modal and drawer with Escape to close and focus restored on
  exit, a dedicated drag handle so Enter can start a drag while Enter on the
  title opens the task, and dnd-kit announcements naming the target column.
- **Motion respects the OS.** `usePrefersReducedMotion` disables chart animation
  and a global media query neutralises transitions.
