# Busso Events Architecture

## 1. Project overview

Busso Events is a full-stack TypeScript application for aggregating local events, enriching them with scraped details, enabling semantic discovery, and notifying subscribed users by email.

The system has two main runtime halves:

- **Frontend SPA**: React + Vite application in `src/`
- **Backend platform**: Convex functions, database, auth, scheduling, and async jobs in `convex/`

At a high level, the product loop is:

1. Admin configures event sources
2. Source pages are scraped for candidate events
3. New events are stored in Convex
4. Each event is scraped again for richer event details
5. Event embeddings are generated for semantic search/matching
6. Active subscriptions are matched against future events
7. Matches are added to an email queue
8. Email jobs send batched notifications to users

## 2. Technology stack

### Frontend

- **React 19**
- **Vite 6**
- **Mantine** for UI components, notifications, forms, and dates
- **type-route** for client-side routing
- **react-i18next** for internationalization

### Backend / platform

- **Convex** for database, queries, mutations, actions, scheduled functions, and HTTP auth routes
- **@convex-dev/auth** for authentication
- **@convex-dev/workpool** for bounded async background work
- **convex-helpers** for admin-protected wrappers

### External integrations

- **OpenAI** for:
  - event extraction from scraped content
  - event detail extraction
  - text embeddings
- **Jina Reader API** for page-to-markdown scraping
- **Resend** for email delivery

### Tooling

- **TypeScript**
- **Vitest** for tests
- **ESLint**
- **Prettier**
- **Cloudflare Wrangler** for static frontend deployment config

## 3. Repository layout

```text
busso-events/
├── convex/                 # Backend logic, schema, auth, jobs
│   ├── events/             # Event APIs and async processing
│   ├── eventSources/       # Source CRUD, scheduling, test scraping
│   ├── scraping/           # Jina + OpenAI scraping pipeline
│   ├── embeddings/         # Embedding generation
│   ├── subscriptions/      # Subscription CRUD and matching
│   ├── emails/             # Email queueing and delivery
│   ├── _generated/         # Convex generated types/APIs
│   ├── auth.ts             # Convex Auth config
│   ├── schema.ts           # Database schema
│   ├── crons.ts            # Periodic cleanup jobs
│   ├── http.ts             # HTTP router + auth routes
│   └── convex.config.ts    # Workpool component registration
├── src/                    # React frontend
│   ├── components/         # Shared and admin pages
│   ├── events/             # Event UI and debug pages
│   ├── subscriptions/      # Subscription UI and debug pages
│   ├── locales/            # Translation files (en.json, zh.json)
│   ├── utils/              # Frontend utilities
│   ├── i18n.ts            # i18n configuration
│   ├── App.tsx
│   ├── Routes.tsx
│   └── router.ts
├── shared/                 # Shared TypeScript helpers
├── public/                 # Static assets
├── setup.mjs               # Convex Auth setup helper for dev
├── wrangler.jsonc          # Static asset deployment config
└── TESTING_REQUIREMENTS.md # Testing strategy and expectations
```

## 4. Frontend architecture

The frontend is a single-page application.

### Bootstrap

- `src/main.tsx` creates the `ConvexReactClient` using `VITE_CONVEX_URL`
- The app is wrapped with:
  - `ConvexAuthProvider`
  - `MantineProvider`
  - `Notifications`

### Routing

Routing is centralized in `src/router.ts` and rendered by `src/Routes.tsx`.

#### Public routes

- `/` home page
- `/login`
- `/event/:eventId`

#### Authenticated user routes

- `/subscriptions`
- `/subscriptions/create`
- `/subscriptions/:subscriptionId`

#### Admin routes

- `/admin`
- `/admin/sources`
- `/admin/sources/add`
- `/admin/sources/:sourceId`
- `/admin/event/:eventId/debug`
- `/admin/subscriptions/debug`
- `/admin/workpools/:workpoolType/debug`

### Access control in UI

- `AuthRequired` protects signed-in routes
- `AdminRequired` protects admin routes
- `AuthenticatedPageLayout` provides the signed-in shell/layout

### Frontend responsibility boundaries

The frontend is mostly a thin client over Convex:

- reads state through Convex queries
- triggers workflows through mutations/actions
- relies on backend authorization and orchestration

This keeps business logic concentrated in `convex/`, not in React components.

### Internationalization (i18n)

Internationalization is implemented using **react-i18next** with the following structure:

- **Configuration**: `src/i18n.ts` initializes i18next with `LanguageDetector` from `i18next-browser-languagedetector`
- **Translation files**: `src/locales/en.json` (English) and `src/locales/zh.json` (Chinese)
- **Language detection order**: localStorage -> browser preference -> fallback to English
- **Language switcher**: Implemented as a dropdown menu in the Header (authenticated) and floating Header (public pages)
- **Translated pages**: HomePage, LoginPage, EventDetailPublic, Header, EventGallery, EventDetailPage, SearchBar, DateFilter, SignInForm

## 5. Backend architecture

The backend is organized by domain under `convex/`.

### 5.1 Auth

Auth is configured in `convex/auth.ts` using Convex Auth.

Current state:

- **Google provider is enabled**
- `Password` is imported but not active

`convex/http.ts` adds auth HTTP routes to the Convex router.

User-facing auth state is read through queries such as:

- `convex/auth.ts` -> `loggedInUser`
- `convex/users.ts` -> `current`, `isCurrentUserAdmin`

### 5.2 Admin authorization

Admin authorization is implemented with `adminQuery`, `adminMutation`, and `adminAction` in `convex/utils.ts`.

The admin check is based on `users.isAdmin === true`.

This means:

- frontend route guards improve UX
- Convex admin wrappers are the actual enforcement boundary

### 5.3 Domain modules

#### Events

Files under `convex/events/` handle:

- public event listing and search
- event retrieval
- admin operations
- async scrape/embedding/matching orchestration
- workpool status/debug support

#### Event sources

Files under `convex/eventSources/` handle:

- source CRUD
- test scrapes
- scheduled re-scraping
- source-level scrape bookkeeping

#### Scraping

Files under `convex/scraping/` handle:

- Jina fetch
- content sanitization
- OpenAI prompt-based extraction
- separate flows for source pages and event detail pages

#### Embeddings

Files under `convex/embeddings/` handle:

- generic embedding generation
- event description embeddings
- subscription prompt embeddings
- batch generation for missing embeddings

#### Subscriptions

Files under `convex/subscriptions/` handle:

- user CRUD
- subscription validation
- queue-aware subscription retrieval
- event/subscription matching
- email workpool scheduling

#### Emails

Files under `convex/emails/` handle:

- email queue reads/writes
- queue cleanup
- delivery through Resend
- admin email operations

## 6. Data model

The schema is defined in `convex/schema.ts` and combines Convex Auth tables with application tables.

### 6.1 `events`

Stores normalized event records.

Important fields:

- `title`, `description`, `eventDate`, `imageUrl`, `url`
- `sourceId`
- `lastScraped`
- `scrapedData` with extracted metadata such as location, organizer, price, category, tags, registration URL
- `descriptionEmbedding`
- workpool tracking fields for scrape, embedding, and subscription matching

Indexes:

- by date
- by URL
- full-text search on title
- full-text search on description
- vector index on embedding

### 6.2 `eventSources`

Stores source websites to crawl.

Important fields:

- `name`
- `startingUrl`
- `isActive`
- `dateLastScrape`
- next scheduled scrape ID/time

### 6.3 `testScrapes`

Tracks admin-triggered test scrape runs.

Fields include:

- URL
- status
- progress stage/message
- result payload
- timestamps

### 6.4 `subscriptions`

A discriminated union with two variants:

#### Prompt subscription

- `kind: "prompt"`
- `prompt`
- `promptEmbedding`
- activity and email scheduling fields

#### All-events subscription

- `kind: "all_events"`
- no prompt text
- same activity and email scheduling fields

Both variants include:

- `userId`
- `isActive`
- `lastEmailSent`
- `nextEmailScheduled`
- `emailFrequencyHours`
- email workpool tracking

### 6.5 `emailQueue`

Stores pending or sent event notifications per subscription.

Fields:

- `subscriptionId`
- `eventId`
- `matchScore`
- `matchType`
- `queuedAt`
- `emailSent`
- `emailSentAt`

### 6.6 `jobs`

Tracks batch job progress for scrape-related operations.

### 6.7 `users`

Extends auth users with app-specific fields, especially `isAdmin`.

## 7. Runtime data flows

## 7.1 Source ingestion flow

1. Admin creates or activates an `eventSource`
2. `performSourceScrape` fetches `startingUrl` through Jina
3. OpenAI extracts candidate events from the scraped markdown
4. Each extracted event is deduplicated by URL
5. New events are inserted into `events`
6. `updateLastScrapeTime` records the scrape and schedules the next scrape

Important behavior:

- source rescraping is **per-source scheduled work**, not a cron fanout
- next scrape is typically scheduled for about **3 days later**
- scheduling metadata is stored on the source row to avoid orphaned jobs

## 7.2 Event enrichment flow

When a new event is created:

1. `createInternal` inserts the base event
2. event scraping is enqueued in `eventScrapeWorkpool`
3. `performEventScrape` scrapes the event page itself
4. scraped details are normalized into `scrapedData`
5. description and image may be updated from the detailed scrape
6. the scrape completion handler enqueues embedding generation
7. the same completion handler also enqueues delayed subscription matching

Important behavior:

- subscription matching is delayed by about **8 hours** after scrape completion
- if detailed scraping fails, the system still schedules embedding generation fallback and matching

## 7.3 Search flow

There are two search styles in the system.

### Basic search

`convex/events/events.ts` -> `search`

- full-text search on title and description
- optional date filtering
- results sorted by event date

### Enhanced search

`convex/events/events.ts` -> `enhancedSearch`

- generates an embedding for the search term
- runs `ctx.vectorSearch` against `events.by_embedding`
- combines semantic and text matches
- deduplicates and date-filters the result set

This is the main semantic discovery path for the app.

## 7.4 Subscription matching flow

There are two matching contexts:

### Actual background matching for queued emails

`convex/subscriptions/subscriptionsMatching.ts`

For each future event:

1. load all active subscriptions
2. for `all_events`, match automatically
3. for prompt subscriptions:
   - if both embeddings exist, compute cosine similarity directly
   - otherwise fall back to keyword matching on title/description
4. matched items are inserted into `emailQueue`

This means the real notification pipeline **does support semantic matching** when embeddings exist.

### Preview/search helper path

Some helper queries such as `searchEventsByEmbedding` currently return an empty array because Convex vector search is not performed there.

Impact:

- preview-style subscription matching paths are partially implemented
- the main background notification path still works because it uses direct cosine similarity between stored embeddings instead of that placeholder query

## 7.5 Email queue and delivery flow

1. A matched event is added to `emailQueue`
2. Queue insertion deduplicates on `(subscriptionId, eventId)`
3. If needed, `ensureEmailWorkpoolJobScheduled` schedules one email job for that subscription
4. Delay is based on `emailFrequencyHours`
5. `performSubscriptionEmail` calls `sendSubscriptionEmailInternal`
6. Resend sends the email in production
7. Queue items are marked sent
8. `lastEmailSent` and `nextEmailScheduled` are updated

Important behavior:

- email jobs are **subscription-centric**, not global batch sends
- only one active email workpool job is kept per subscription
- in development mode (`IS_PROD != "true"`), the app skips the actual Resend call but still processes the queue as if the send succeeded

## 8. Async processing model

The system uses two different async mechanisms.

### 8.1 Workpools

Registered in `convex/convex.config.ts`, but the real concurrency limits are applied where the pools are instantiated.

Current workpools:

- `eventScrapeWorkpool` -> max parallelism 1
- `eventEmbeddingWorkpool` -> max parallelism 2
- `subscriptionMatchWorkpool` -> max parallelism 1
- `subscriptionEmailWorkpool` -> max parallelism 2

These are used to:

- bound third-party API pressure
- serialize sensitive steps where useful
- support status inspection and cancellation

### 8.2 Scheduled functions / crons

Used for:

- per-source next scrape scheduling
- periodic cleanup of stale `emailQueue` entries every 3 hours

## 9. External service boundaries

### Jina

Used as the raw content acquisition layer.

Requirements:

- `JINA_API_KEY`

### OpenAI

Used in two roles:

- chat completion for extracting structured event data from markdown
- embeddings for semantic search and subscription matching

Requirements:

- `OPENAI_API_KEY`

### Resend

Used to send subscription emails.

Requirements:

- `RESEND_API_KEY`
- optional `EMAIL_FROM_ADDRESS`

### Site URL

Used in email templates:

- `CONVEX_SITE_URL`

## 10. Deployment and environments

### Local development

`npm run dev` runs frontend and backend together.

Notable behavior from `package.json`:

- `predev` runs Convex setup steps first
- `setup.mjs` helps initialize Convex Auth environment setup
- `convex dashboard` is opened during the startup flow

### Frontend deployment

`wrangler.jsonc` indicates the frontend is built as static assets from `dist/` with SPA routing fallback.

So the frontend deployment model is effectively:

- build static SPA with Vite
- serve static assets via Cloudflare-compatible hosting

### Backend deployment

Convex hosts backend functions and data separately from the static frontend.

## 11. Testing posture

Visible repository testing is centered on scraping logic.

Current signals:

- `convex/scraping/scraping.test.ts` exists
- `TESTING_REQUIREMENTS.md` documents a behavior-driven testing style
- external services are expected to be mocked in tests

Testing philosophy emphasizes:

- descriptive behavior names
- mocking Jina/OpenAI/fetch
- success and failure paths
- high coverage for scraping code

From the current repository shape, automated tests appear stronger around scraping than around the full end-to-end notification pipeline.

## 12. Strengths of the current architecture

- Clear domain separation under `convex/`
- Business logic stays mostly on the backend, not in the UI
- Good use of Convex indexes and vector search for event discovery
- Explicit async orchestration for scrape -> embed -> match -> email
- Workpool-based concurrency control for external API safety
- Admin tooling exists for inspecting sources, events, subscriptions, and workpools

## 13. Important implementation gaps and quirks

These are worth knowing when working on the project:

1. **Subscription preview semantic search is incomplete**
   - `searchEventsByEmbedding` is currently a placeholder returning `[]`
   - this affects preview/helper paths more than the actual queued notification path

2. **Embedding stats are partially placeholder-based**
   - `getEmbeddingStats` contains placeholder counts rather than a full implementation

3. **Development-mode email behavior is optimistic**
   - the app skips the real send but still marks queued items as sent and advances schedule state
   - useful for local workflow, but not equivalent to a delivery dry-run

4. **Search and matching use different semantic mechanisms**
   - app search uses Convex vector index search
   - background subscription matching uses direct cosine similarity between stored embeddings

5. **A lot of operational visibility depends on debug/admin pages**
   - those pages are important for observing workpool and queue state during development

## 14. Mental model for future changes

When changing this codebase, it helps to think in these layers:

- **UI layer**: navigation, forms, list/detail pages, admin dashboards
- **API layer**: Convex public queries/mutations/actions
- **Domain layer**: internal queries/mutations/actions inside each module
- **Async orchestration layer**: workpools, scheduled functions, queue state
- **Integration layer**: Jina, OpenAI, Resend
- **Persistence layer**: Convex schema and indexes

Most meaningful product changes will touch at least two of these layers, but the cleanest place for business rules is usually the Convex domain layer, not the React layer.

## 15. Key files to read first

For orientation, these are the most useful entry points:

- `package.json`
- `src/main.tsx`
- `src/Routes.tsx`
- `src/router.ts`
- `convex/schema.ts`
- `convex/auth.ts`
- `convex/utils.ts`
- `convex/events/events.ts`
- `convex/events/eventsInternal.ts`
- `convex/eventSources/eventSourcesInternal.ts`
- `convex/scraping/scrapingInternal.ts`
- `convex/embeddings/embeddingsInternal.ts`
- `convex/subscriptions/subscriptions.ts`
- `convex/subscriptions/subscriptionsInternal.ts`
- `convex/subscriptions/subscriptionsMatching.ts`
- `convex/emails/emailsInternal.ts`
- `convex/crons.ts`

## 16. One-sentence summary

This project is a Convex-centered event aggregation system where React is the thin client, Convex owns the data and workflows, and the main architecture is built around asynchronous ingestion, enrichment, semantic matching, and delayed subscription email delivery.
