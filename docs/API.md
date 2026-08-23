# SprintDesk API reference

Two kinds of interface are documented here: the **external HTTP endpoints** the
app calls, and the **internal service layer** every feature goes through to reach
data.

> **Format note.** This is written as markdown tables rather than an OpenAPI
> document. The app owns no server: it consumes two public APIs whose contracts
> belong to their vendors, and its own "API" is a set of TypeScript functions
> whose types are already checked at build time. A hand-maintained spec for
> someone else's endpoints would be a second source of truth that nothing
> validates, so the tables below link to the real types instead.

---

## 1. External endpoints

### 1.1 DummyJSON — authentication

Base URL `https://dummyjson.com`. No API key. Implemented in
[`src/features/auth/services/authApi.ts`](../src/features/auth/services/authApi.ts).

#### `POST /auth/login`

Exchanges credentials for a token pair.

**Request**

| Field | Type | Notes |
| ----- | ---- | ----- |
| `username` | `string` | Demo account: `xyz` |
| `password` | `string` | Demo account: `abc` |
| `expiresInMins` | `number` | Access-token lifetime. `1` in development, `60` in a production build |

```json
{ "username": "abc", "password": "XYX", "expiresInMins": 1 }
```

**Response `200`**

```json
{
  "id": 1,
  "username": "emilys",
  "email": "emily.johnson@x.dummyjson.com",
  "firstName": "Emily",
  "lastName": "Johnson",
  "image": "https://dummyjson.com/icon/emilys/128",
  "accessToken": "eyJhbGciOiJIUzI1NiIs…",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs…"
}
```

**Errors** — `400` with `{ "message": "Invalid credentials" }`. The UI maps both
`400` and `401` to a single "Invalid username or password." message so the form
never leaks which half was wrong.

**Client handling** — `accessToken` goes into the non-persisted Zustand auth
slice (memory only). `refreshToken` goes to `localStorage` under
`sprintdesk.session` together with an expiry stamp (30 days with "remember me",
otherwise 12 hours).

#### `POST /auth/refresh`

Spends a refresh token for a new pair. Called from the HTTP client's 401 handler
and once on app boot to restore a session.

**Request**

| Field | Type | Notes |
| ----- | ---- | ----- |
| `refreshToken` | `string` | The persisted token |
| `expiresInMins` | `number` | Same lifetime rule as login |

**Response `200`**

```json
{ "accessToken": "eyJhbGciOiJIUzI1NiIs…", "refreshToken": "eyJhbGciOiJIUzI1NiIs…" }
```

Both tokens are rotated: the new refresh token replaces the stored one. On any
failure the stored session is cleared and the app returns to `/login` without
retrying.

#### `GET /auth/me`

**Request headers** — `Authorization: Bearer <accessToken>` (added by the client
for requests marked `auth: true`).

**Response `200`** — the user object shown above, plus profile fields the app
ignores. Used to rehydrate `authStore.user` after a silent refresh.

**Response `401`** — triggers exactly one refresh-and-replay; if that refresh
fails, auth state is cleared.

### 1.2 JSONPlaceholder — notification feed

Base URL `https://jsonplaceholder.typicode.com`. No API key. Implemented in
[`src/features/notifications/services/notificationsApi.ts`](../src/features/notifications/services/notificationsApi.ts).

#### `GET /posts?_start={offset}&_limit=5`

**Query parameters**

| Parameter | Type | Notes |
| --------- | ---- | ----- |
| `_start` | `number` | Offset held in the notification store; advances by 5 each poll and wraps to `0` past 100 |
| `_limit` | `number` | Always `5` |

**Response `200`**

```json
[
  { "userId": 1, "id": 6, "title": "dolorem eum magni eos aperiam quia", "body": "ut aspernatur…" }
]
```

**Polling strategy.** A fixed `?_limit=5` returns the same five records forever,
so "a new post id is a new notification" would fire once and never again. Paging
the offset makes each poll surface ids the client has not seen, which is what
turns this endpoint into a plausible activity feed. Details:

| Aspect | Behaviour |
| ------ | --------- |
| Interval | 20 s, via TanStack Query `refetchInterval` |
| Tab hidden | Polling stops (`refetchInterval: false`, `refetchIntervalInBackground: false`) and resumes when visible |
| Mapping | `post.id` → notification id, `title` → title, `body` → message, `type: "system"`, `read: false`, `createdAt` stamped on arrival |
| Duplicates | Ids already in the store are dropped, so re-fetches and wrap-around are idempotent |
| Toasts | One toast per poll, not one per item: a single arrival shows its title, several show "N new notifications". The first response of a session and anything that arrives while the panel is open are silent |
| Storage | Newest 100 kept in `localStorage` under `sprintdesk.notifications`, along with the next offset |

---

## 2. Internal service layer

[`src/services/data/localData.ts`](../src/services/data/localData.ts) — the only
module that imports `mock-data.json`. Every function is async, returns
structured clones and pays 260–480 ms of simulated latency (0 in tests). Writes
update a session dataset mirrored to `localStorage` under `sprintdesk.dataset`,
so the simulated backend survives a refresh the way a real one would.

Types are in [`src/types/index.ts`](../src/types/index.ts).

| Function | Signature | Returns / effect |
| -------- | --------- | ---------------- |
| `listUsers` | `() => Promise<User[]>` | The six team members |
| `listSprints` | `() => Promise<Sprint[]>` | The three sprints |
| `listTasks` | `() => Promise<Task[]>` | Every task in the session dataset: the first 30 from the seed, plus anything created since |
| `listComments` | `(taskId: number) => Promise<Comment[]>` | Comments for one task, oldest first |
| `listSeedNotifications` | `() => Promise<Notification[]>` | Seed activity, written into the store on a first visit only |
| `createTask` | `(input: NewTaskInput) => Promise<Task>` | New task with a fresh id, `status: "backlog"`, `completedAt: null` |
| `updateTask` | `(id: number, patch: Partial<TaskEditableFields>) => Promise<Task>` | Updated task; bumps `updatedAt`. Rejects if the id is unknown |
| `updateTaskStatus` | `(id: number, status: TaskStatus) => Promise<Task>` | Write-through for a drag: sets `completedAt` when entering Done, clears it when leaving |
| `deleteTask` | `(id: number) => Promise<{ id: number }>` | Removes the task and its comments |
| `createComment` | `({ taskId, authorId, message }) => Promise<Comment>` | New comment stamped with the current time |

### Entity shapes

```ts
interface Task {
  id: number
  title: string
  description: string
  status: 'backlog' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  assigneeId: number | null
  dueDate: string        // YYYY-MM-DD
  sprintId: number
  order: number          // seed order within its status
  createdAt: string      // ISO 8601, UTC
  completedAt: string | null
  updatedAt: string
}

interface User    { id: number; name: string; email: string; avatar: string }
interface Sprint  { id: number; name: string; startDate: string; endDate: string }
interface Comment { id: number; taskId: number; authorId: number; message: string; createdAt: string }
interface Notification {
  id: number
  title: string
  message: string
  type: 'task' | 'review' | 'system'
  read: boolean
  createdAt: string
}
```

### Hooks over the service layer

Components call these, never the service functions directly.

| Hook | Query key | Notes |
| ---- | --------- | ----- |
| `useTasks()` | `['tasks']` | The board's source of task entities |
| `useUsers()` / `useSprints()` | `['users']` / `['sprints']` | `staleTime: Infinity` — reference data |
| `useComments(taskId)` | `['comments', taskId]` | Disabled until a task is open |
| `useCreateTask()` | — | Writes the new task into `['tasks']` and adds its id to the board store |
| `useUpdateTask()` | — | Replaces the task in `['tasks']` |
| `useMoveTaskStatus()` | — | Status write-through after a drag |
| `useDeleteTask()` | — | Drops the task from `['tasks']`, its comments from the cache, and its id from the board store |
| `useAddComment(taskId)` | — | Appends to `['comments', taskId]` |

### HTTP client

[`src/lib/http.ts`](../src/lib/http.ts) — `createHttpClient(baseUrl)` returns
`{ get, post }`. Options: `{ method, body, headers, signal, auth }`.

| Behaviour | Detail |
| --------- | ------ |
| Bearer token | Added when `auth: true` and a token is in memory |
| 401 handling | One silent refresh, then the original request is replayed once with the new token |
| Concurrency | Simultaneous 401s share one in-flight refresh promise |
| Refresh failure | `onRefreshFailure` clears auth state; the caller gets `HttpError(401)`; no retry loop |
| Errors | Rejects with `HttpError { status, message, body }`, message taken from the API's `message` field when present |
| Retries | 4xx is never retried by TanStack Query; 5xx is retried twice |
