# SprintDesk

A sprint management dashboard. Sign in, work a Kanban board with drag-and-drop,
open a task in a side drawer to edit it or comment on it, and check sprint
analytics on a separate page. There's a notification bell that polls for new
activity.

Built with React 19, TypeScript (strict), Vite, TanStack Query v5, Zustand,
Tailwind v3, React Router v6, Recharts, `@dnd-kit`, and Vitest + Testing Library.

---

## Getting started

Node 20.19+ or 22.12+ (Vite 8 requires it).

```bash
npm install
npm run dev
```

Sign in with either of these:

| Username | Password | Team member |
| --- | --- | --- |
| `emilys` | `emilyspass` | Emily Johnson |
| `michaelw` | `michaelwpass` | Michael Williams |

These are DummyJSON's public demo accounts, not secrets — the full list is at
[dummyjson.com/users](https://dummyjson.com/users). Those two are the ones whose
names match a team member in the seed data, so they're the pair to use if you
want to try the cross-user notifications: move a task assigned to Michael while
signed in as Emily, then sign in as Michael and check the bell.

No `.env` file and no keys. Both external APIs (DummyJSON for auth,
JSONPlaceholder for the notification feed) are public.

One thing to know about dev mode: access tokens are issued with a 1-minute
lifetime instead of 60, so the silent-refresh path fires while you're watching
rather than an hour later. Look for `POST /auth/refresh` in the network panel.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Typecheck, then production build |
| `npm run preview` | Serve the production build |
| `npm test` | Run the tests once |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | oxlint |

## Tests

```bash
npm test     # 54 tests, 8 files
```

The three required suites are `useToast`, the board store, and the auth
interceptor. The rest cover things I got wrong at least once and wanted pinned
down: the analytics derivation, the notification polling cadence, per-member
notification inboxes, the local data service, and the password strength scorer.

`src/test/setup.ts` installs an in-memory `Storage` polyfill. The jsdom build
that ships with this Vitest version has a `localStorage` object without the
Storage methods on it, which breaks anything persisted through Zustand.

## What's in it

**Auth.** DummyJSON login. The access token stays in memory (a non-persisted
Zustand slice); only the refresh token is written to localStorage. The fetch
client attaches the bearer token, and on a 401 it refreshes once and replays the
original request. Concurrent 401s share a single refresh rather than firing one
each. Route guards both ways, a full-screen loader while the session is
validated on boot, and the session survives a hard refresh.

**Board.** Four columns, seeded from the first 30 tasks in `mock-data.json`.
Column arrangement lives in a persisted Zustand store. Drag with a pointer,
touch, or the keyboard. On phones the columns become a swipeable snap-scrolling
strip so a card only travels one screen to reach the next column. Cards show
priority, assignee and due date, with overdue dates called out. Task drawer with
inline editing and comments, a new-task flow, delete behind a confirmation, and
live column counts.

**Analytics.** Velocity, status distribution, priority breakdown and completion
trend. All of it is derived from the board arrangement plus the task records, so
moving a card updates the charts straight away.

**Notifications.** Polling that pauses when the tab is hidden, an unread badge, a
paged panel with read state, persisted to localStorage, and a toast when
something arrives while the panel is closed.

**Design system.** Button, Input/Textarea, Select, Modal, Toast, DataTable,
Skeleton, Badge, Avatar, Spinner. All hand-built with Tailwind and used across
the app rather than restyled per screen.

**Look and feel.** The theme is called "Field Notes" — ruled paper, tasks as
pinned index cards with a colour-coded priority tab, columns as corkboard lanes.
Caveat for headings and figures, Source Serif 4 for body copy, JetBrains Mono for
labels and dates. Tokens are CSS custom properties in `src/index.css`, aliased to
Tailwind's `surface`/`content`/`line` scales.

### Bonus features

- Remember me (30 days when ticked, 12 hours otherwise)
- Password strength meter, hand-rolled, no library
- Undo for the last drag
- Board filters by priority and assignee
- Keyboard drag-and-drop with a custom dnd-kit coordinate getter, so Left/Right
  crosses columns (the built-in one only walks the column you started in)
- Team activity notifications — assigning or moving a task notifies the
  **assignee**, not you. This one goes past the brief; see the note below.
- Custom date range on the completion trend chart
- PNG export of the analytics view, no extra dependency

## A few decisions worth explaining

**Refresh token in localStorage.** The brief asks for it and that's what this
does, but it isn't what I'd ship. Any XSS on the page can read it. In production
it belongs in an httpOnly, SameSite cookie, with the access token still in memory
like it is here.

**The polling endpoint doesn't change.** `GET /posts?_limit=5` returns the same
five records every time, so "treat new post ids as new notifications" would fire
once and never again. I kept the five-post window but slide it forward by one
post per poll, so exactly one id is new each tick. Sliding by a whole page was
my first attempt and it was a firehose — five notifications every twenty seconds
and the badge at 100 inside seven minutes.

**Team activity notifications go past the brief.** Task 05 scopes notifications
to the poll, so I'm flagging this rather than slipping it in. The seed
notifications in `mock-data.json` are all interpersonal ("You have been assigned
to…", "A review has been requested for…"), which describes teammates notifying
each other — but nothing in the polled feed ever produces that. So assigning or
moving a task now raises activity addressed to the assignee. You're never
notified about your own action, and each member has a separate inbox.

There's no backend, so delivery is simulated inside one browser: sign in as
`emilys`, move a task assigned to Michael Williams, sign out, sign in as
`michaelw`. Two browsers will never sync.

**Column membership has one owner.** The Zustand board store owns it. The task
record's `status` field is a projection that gets written through on drop, which
is also what stamps `completedAt` for the trend chart. Longer version in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#why-the-arrangement-lives-in-zustand).

## Deployment

Static build, deployed on Netlify. `netlify.toml` has the build command, publish
directory, a pinned Node version, and the SPA redirect that stops a refresh on
`/board` returning a 404.

## Checks

Beyond the test suite, I verified in a real browser:

- Sign-in, hard refresh restoring the session through silent refresh, and
  localStorage holding only the refresh token — never the access token.
- Pointer and keyboard drag across columns, undo, drawer editing, comments, task
  creation, delete, filters, notification read state, and the charts reflecting
  board changes.
- No horizontal page scroll at 320, 360 and 390px. The board's lane strip scrolls;
  the page doesn't.
- Contrast in both themes, computed rather than eyeballed. Tightest pair is muted
  text on a lane at 4.56:1, against the 4.5:1 AA needs. One token from the design
  spec measured 4.07:1 and was darkened until it cleared.

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture, data flow, state ownership
- [`docs/API.md`](docs/API.md) — endpoints and the service layer
