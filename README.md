# SprintDesk

A single-page sprint management dashboard: sign in, work a Kanban board of sprint
tasks with drag-and-drop, open tasks in a detail drawer to edit them and discuss
them, watch a notification bell for new activity, and review sprint analytics on a
dedicated charts page.

Built with React 19 + TypeScript (strict) on Vite, TanStack Query v5 for server
state, Zustand for client state, Tailwind CSS v3 for styling, React Router v6,
Recharts, `@dnd-kit`, and Vitest + React Testing Library.

- **Architecture and state ownership:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **API reference (external endpoints + internal service layer):** [`docs/API.md`](docs/API.md)

---

## Quick start

Requires Node 20 or newer (developed on Node 25).

```bash
npm install
npm run dev          # http://localhost:5173
```

Sign in with the DummyJSON demo account:

| Username | Password     |
| -------- | ------------ |
| `emilys` | `emilyspass` |

### Environment variables

**There are none, and no `.env` file is needed.** Both external APIs used here —
DummyJSON (authentication) and JSONPlaceholder (the notification feed) — are
public and unauthenticated, so there are no keys or secrets to configure or to
keep out of version control. The only environment-dependent behaviour is derived
from Vite's built-in `import.meta.env.DEV`/`MODE`:

| Behaviour                | Development             | Production build |
| ------------------------ | ----------------------- | ---------------- |
| Access-token lifetime    | 1 minute                | 60 minutes       |
| Simulated service latency| 260–480 ms              | 260–480 ms (0 in tests) |

The one-minute token in development is deliberate: it means the silent-refresh
path is exercised within a minute of signing in rather than once an hour, so the
401 → refresh → retry flow is easy to observe (watch the network panel for
`POST /auth/refresh`).

## Scripts

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Vite dev server                                     |
| `npm run build`    | `tsc -b` (strict typecheck) then a production build |
| `npm run preview`  | Serve the production build locally                  |
| `npm test`         | Run the Vitest suite once                           |
| `npm run test:watch` | Vitest in watch mode                              |
| `npm run lint`     | oxlint                                              |

## Tests

```bash
npm test     # 40 tests across 5 files — all passing
```

The three required suites, plus two more that cover logic worth pinning down:

| Suite | File | Covers |
| ----- | ---- | ------ |
| `useToast` *(required)* | `src/hooks/useToast.test.ts` | queueing, variants, auto-dismiss timing, manual dismiss cancelling a pending timer, stable callback identity |
| Board store *(required)* | `src/features/board/store/boardStore.test.ts` | add / move / delete, seeding and reconciliation, index clamping, undo bookkeeping |
| Auth interceptor *(required)* | `src/lib/http.test.ts` | bearer attachment, 401 → refresh → single replay, one shared refresh for concurrent 401s, failure path, untouched unauthenticated 401s |
| Analytics derivation | `src/features/analytics/hooks/useBoardAnalytics.test.ts` | charts derive from the board arrangement rather than the stored status; timezone-safe completion trend |
| Password strength (bonus) | `src/features/auth/passwordStrength.test.ts` | the hand-rolled scoring heuristic |

`src/test/setup.ts` installs an in-memory `Storage` polyfill: the jsdom build
shipped with this Vitest version exposes a `localStorage` object without the
Storage methods, which otherwise breaks anything persisted through Zustand.

## What is implemented

**Authentication** — DummyJSON login; access token held **in memory only** (a
non-persisted Zustand slice); refresh token persisted to localStorage; a fetch
client that attaches the bearer token, refreshes once on a 401 and replays the
original request, sharing a single in-flight refresh between concurrent
failures; `<ProtectedRoute>` / `<PublicOnlyRoute>` guards; a full-screen loading
state while the session is validated on boot; session survives a hard refresh;
logout clears auth state and the query cache.

**Board** — four columns seeded from the first 30 tasks in `mock-data.json` through
the service layer; arrangement owned by a persisted Zustand store; pointer,
touch and keyboard drag-and-drop, with the columns becoming a swipeable
snap-scrolling strip on phones so a card only travels one screen to the next
column; cards showing priority, resolved assignee and due date (overdue dates
called out); detail drawer with inline editing and comments; new-task flow;
delete behind a confirmation dialog; live column counts.

**Analytics** — sprint velocity, task status, priority breakdown and completion
trend, all derived live from the board arrangement plus the task entities, fully
responsive, with entry animations that respect `prefers-reduced-motion`.

**Visual language — "Field Notes."** A warm analog notebook: the page is ruled
paper (a line every 34px), tasks are index cards on card stock with a hard
offset shadow and a colour-coded sticky tab — red high, kraft medium, green low
— and each card is pinned at a degree and a half, straightening and lifting
when you reach for it. Board columns are corkboard lanes; dashboard stats are
tags torn from the pad rather than stat panels. Three faces each have one job:
Caveat is the handwriting and appears only on greetings, section heads, the
wordmark and stat figures; Source Serif 4 carries body and card copy; JetBrains
Mono carries every label, date, badge and table header. Tokens live in
`:root` in `src/index.css` under the names the design spec uses, aliased to the
Tailwind `surface` / `content` / `line` scales so existing markup picked up the
theme without learning new class names.

One token was adjusted: the spec's `--muted: #8C7A62` measures 4.07:1 on card
stock and 3.27:1 on a lane, under the 4.5:1 this brief requires for body text.
It is darkened to `#746350`, the minimum that clears AA on the tighter ground.
The kraft priority tab sits at 2.21:1 against card stock and is left as
specified: it is `aria-hidden` decoration, and priority is carried in text by
the badge beside it.

**Design system** — Button, Input/Textarea, Select, Modal, Toast, DataTable,
Skeleton, plus Badge, Avatar and Spinner, all hand-built with Tailwind and used
throughout the features rather than re-styled per screen.

**Notifications** — polling with pause-on-hidden, unread badge, panel with
paging and read state, persisted to localStorage, toast on arrival only while
the panel is closed.

### Bonus features (all clearly marked in code)

- **Remember me** — 30-day persistence when ticked, 12 hours when not.
- **Password strength indicator** — own heuristic, no library (`src/features/auth/passwordStrength.ts`).
- **Undo** for the last drag-and-drop move, which also writes the status back.
- **Board filters** by priority and assignee, with "3 of 8" counts on filtered columns.
- **Keyboard drag-and-drop** — a custom dnd-kit coordinate getter
  (`src/features/board/components/keyboardCoordinates.ts`), because dnd-kit's
  default sortable getter only walks the column the drag started in and would
  never cross columns. Left/Right move between columns, Up/Down within one, and
  dnd-kit's screen-reader announcements are customised to name the column.
- **Team activity notifications** *(beyond the brief — see the note below)* —
  assigning or moving a task raises a notification in the **assignee's** inbox,
  never your own. Requires per-member inboxes, so each signed-in member sees
  only their own list and read state.
- **Custom date range** on the completion trend chart.
- **PNG export** of the analytics view — no extra dependency: each chart's SVG is
  serialised and composed onto a canvas, and the HTML legends are redrawn from
  the `data-legend-*` attributes the legend component emits.

## Interpretation notes

**The JSONPlaceholder polling strategy.** `GET /posts?_limit=5` returns the same
five records on every call, so polling it verbatim can never produce a genuinely
new id after the first response — "treat new post ids as new notifications"
would fire exactly once, ever. SprintDesk keeps the five-post window and slides
it forward instead: each poll requests `_start=n&_limit=5` and advances `n` by
**one**, so four of the five results are already known and exactly one id is
new. Sliding by a whole page was the first cut and it behaved like a firehose —
five notifications and a toast every twenty seconds, the badge at 100 inside
seven minutes. One per tick reads like real activity, and the window stops at
the end of the collection rather than wrapping round to re-announce ids that
were only forgotten because the store is capped. The offset is persisted with
the notification store, so paging continues across reloads rather than
restarting.

The feed query's `staleTime` matches the poll interval for the same reason: the
React Query default would refetch on every mount, so a route change or a dev
HMR reload used to inject an extra page of notifications the instant the bell
remounted. `src/features/notifications/notificationPolling.test.tsx` pins the
cadence, the pause-on-hidden behaviour and both of those regressions.

**Team activity notifications go beyond Task 05, deliberately.** The brief
scopes notifications to the JSONPlaceholder poll, and §7.1 asks for scope
discipline, so this is called out rather than slipped in. The reason it exists:
the seed activity in `mock-data.json` is all *interpersonal* — "You have been
assigned to…", "A review has been requested for…" — which describes a system
where teammates notify each other, but nothing in the polled feed ever produces
that. Assigning or moving a task now raises activity addressed to the task's
assignee, using the seed's own vocabulary. Two rules keep it honest: you are
never notified about your own action (you watched it happen, and the toast
already confirmed it), and each member has a separate inbox, so read state is
theirs alone.

There is no backend, so delivery is simulated within one browser: sign in as
`emilys`, move a task assigned to Michael Williams, sign out, sign in as
`michaelw`, and the notification is waiting. Two browsers will never sync —
`localStorage` is the only store there is. Those two accounts are the workspace
members reachable through `useCurrentMember`, which matches the DummyJSON
account to a seed member by full name; the other four DummyJSON users do not
match a seed name and fall back to the first member.

**Refresh-token storage.** Keeping the refresh token in localStorage is required
by the brief and is what this app does, but it is not what I would ship: any XSS
on the page can read it. In production it belongs in an httpOnly, `SameSite`
cookie that page scripts cannot touch, with the access token still living only
in memory as it does here.

**Task status has one owner.** Column membership is owned by the Zustand board
store; the task record's `status` field is a server-side projection that is
written through on drop (which is also what stamps `completedAt` for the
completion-trend chart). The reasoning is in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#why-the-arrangement-lives-in-zustand).

## Verification

Measured against the production build (`npm run build && npm run preview`) with
Lighthouse 12 driving a real Chrome. The protected routes were audited through a
Lighthouse user flow that signs in first, since the CLI cannot log in on its own.

| Route        | Performance | Accessibility | Best practices |
| ------------ | ----------- | ------------- | -------------- |
| `/login`     | 99          | 100           | 100            |
| `/dashboard` | 96          | 100           | 100            |
| `/board`     | 99          | 100           | 100            |
| `/analytics` | 90          | 100           | 100            |

Performance moves a point or two between runs on the same machine; accessibility
and best practices have been 100 on every run since the fixes below.

Three things that audit flagged were fixed rather than explained away: a
sub-3:1 brand link colour in dark mode, a heading-order skip on the board, and
a large layout shift on the dashboard (the table now renders a fixed-height
slice whose skeleton reserves exactly the space the loaded rows need).

Also verified in a real browser, not only in tests:

- Sign-in, hard refresh restoring the session through silent refresh, and
  `localStorage` containing only the refresh token — never the access token.
- Pointer **and** keyboard drag across columns, undo, drawer editing, comments,
  task creation, delete-with-confirmation, filters, notification read state, and
  the analytics page reflecting board mutations (the donut matched the board's
  counts after a drag, a delete and a create).
- Every route at a 375px viewport: `document.scrollWidth` stays at 375, and the
  charts measure and render correctly at that width.

## Limitations and known gaps

- **The "backend" is a local module.** `src/services/data/localData.ts` mutates an
  in-memory dataset mirrored to localStorage, so board data survives a refresh
  but is per-browser and never shared. Swapping in a real API means rewriting
  that one file; nothing above it changes. Clearing site data resets the board
  to the shipped seed.
- **The board is one sprint's worth of work.** The seed is the first 30 tasks
  from `mock-data.json`; the session dataset grows from there as tasks are
  created. That bound belongs to the seed, not to every read — capping each
  fetch at 30 instead meant a created task was written to storage and then
  sliced off by the next fetch, so it vanished on refresh
  (`src/services/data/localData.test.ts` covers it). Everything loads in a
  single page: there is no pagination or virtualisation, which is fine at this
  size but would need windowing at a few hundred cards.
- **PNG export captures the charts, not the whole page.** The header, filters and
  card chrome are not in the image; each chart plus its legend is. The export was
  verified by capturing and inspecting the produced image — headless Chrome
  cancels blob downloads, so the final browser-side "save" step is only
  exercisable in a normal browser.
- **Rotating refresh tokens have an inherent edge.** If a refresh response is lost
  (tab closed mid-flight), the stored token has already been spent and the next
  visit lands on the login screen. Handling that properly needs server-side
  refresh-token families, which DummyJSON does not offer.
- **Not attempted:** Storybook stories and automated `axe-core` testing (both
  listed as bonuses). Accessibility was instead checked with Lighthouse's axe
  rules on all four routes and by driving every flow from the keyboard.
- **Comment authorship is inferred.** The signed-in DummyJSON account is matched
  to a seed team member by name (the demo user, Emily Johnson, matches user 1),
  falling back to the first member, since the two datasets are unrelated.
