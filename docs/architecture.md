# Architecture

## Product Shape

The platform is designed as a modular web application with a shared business knowledge layer.

Core principle:
Every intelligent feature should depend on structured company context, not ad hoc prompts.

## Layers

### 1. Interface Layer

Located in `src/app` and `src/components`.

Responsibilities:

- Render the dashboard, trend boards, content lab, workflow views, calendar, publishing queue, library, analytics, recommendations, and knowledge base
- Collect form input for server actions
- Keep the product responsive and web-first for later mobile parity

### 2. Server Action Layer

Located in `src/server/actions`.

Responsibilities:

- Own user-triggered mutations
- Validate and move form data into service functions
- Revalidate the right routes after updates
- Keep page components thin

### 3. Domain Service Layer

Located in `src/lib`.

Responsibilities:

- Auth and role capability checks
- Trend source ingestion and scoring
- AI prompt building and fallback generation
- Calendar analysis and schedule balancing
- Recommendation construction
- Published-content repository queries
- Publishing adapters
- Notification adapters
- Analytics aggregation
- Audit logging
- Dashboard data composition

This is the layer most likely to be reused by a mobile client or future APIs.

### 4. Persistence Layer

Prisma schema in `prisma/schema.prisma`.

Main entities:

- `BusinessProfile`
- `CompanyValue`
- `Product`
- `AudienceSegment`
- `ComplianceRule`
- `GuardrailTerm`
- `Offer`
- `StrategicGoal`
- `TrendSignal`
- `ContentItem`
- `ContentReview`
- `Publication`
- `PerformanceSnapshot`
- `Recommendation`
- `ActivityLog`
- `User`

## Data Flow

### Trend Flow

1. RSS sources are defined in `src/lib/engines/trends/source-registry.ts`
2. The trend service fetches and filters fresh items
3. Trend scoring combines:
   - freshness
   - relevance
   - brand fit
4. Top signals are stored in `TrendSignal`
5. Recommendations can refresh from the updated trend set

### Content Flow

1. A marketer fills the generator form in `/content`
2. `generateContentAction` passes the request to the content service
3. The content service loads:
   - business profile
   - active offers
   - goals
   - compliance rules
   - optional product
   - optional audience segment
   - optional trend
4. The service builds an AI prompt or uses the fallback generator
5. Idea generation stores reusable `ContentItem` records in the `IDEA` stage
6. Draft generation stores draft-ready `ContentItem` records
7. The item moves through review, scheduling, publishing, and archive stages

### Publishing Flow

1. Approved content enters the publishing queue
2. Immediate publishing uses a server action
3. Scheduled publishing can run through `/api/jobs/publish-due`, or as part of the combined `/api/jobs/daily-maintenance` cron on free-plan Vercel deployments
4. Live publishing supports:
   - Facebook Page feed publishing
   - WhatsApp Cloud API text delivery when configured
   - safe simulation fallback when credentials or destinations are missing
5. Every attempt creates a `Publication` record
6. Recent Facebook publications can be synced back into `PerformanceSnapshot`
7. Published content contributes to analytics and recommendations

### Calendar and Repository Flow

1. Approved and scheduled content is read by the calendar service
2. The calendar service groups posts by day and checks:
   - repeated themes
   - repeated products
   - promotional streaks
   - platform imbalance
   - stale or saturated trends
3. Published content is indexed by the repository service
4. The library module exposes reuse and repurposing actions without modifying original published records

### Analytics and Recommendation Flow

1. Publication metrics are stored in `PerformanceSnapshot`
2. Analytics service aggregates:
   - total impressions
   - clicks
   - leads
   - theme performance
   - channel performance
3. Recommendation service blends:
   - current trend signals
   - product priorities
   - goals
   - top historical themes
   - content calendar gaps
4. Planning-assistant answers explain why a recommendation is being suggested instead of only returning a ranked list

### Knowledge and Guardrail Flow

1. Admin users maintain business profile data, offers, products, audiences, compliance rules, and guardrail terms
2. Guardrail terms are injected into AI generation prompts and fallback generation context
3. Reviewers and managers use the same shared context during approval and publishing decisions

### Audit Flow

1. Important mutations create `ActivityLog` records
2. Dashboard and content-detail views expose these records for traceability
3. This gives the team operational accountability without requiring a separate monitoring tool

## Role Model

- `ADMIN`
  Full access
- `STRATEGIST`
  Can manage knowledge, generate content, approve, schedule, and publish
- `CREATOR`
  Can generate and edit content
- `REVIEWER`
  Can review and approve content
- `ANALYST`
  Best suited for analytics and recommendations

## Extension Points

### New Social Platforms

Add a new adapter in `src/lib/publishing` and extend the UI channel options.

### Notifications

Slack alert delivery currently lives in `src/lib/notifications/service.ts` and can be extended to email or other channels later.

### New AI Providers

Add provider logic in `src/lib/engines/content/service.ts` or split providers into a dedicated folder.

### Mobile App

The current server action and service boundaries can be wrapped by future API routes for a mobile client.

### Multilingual Content

Add language fields to `ContentItem`, audience preferences, and generator inputs.

### Advanced Analytics

Add more `PerformanceSnapshot` ingestion sources and attribution models without changing content workflow primitives.
