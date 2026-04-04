# System Guide

This document describes the system as implemented in the current codebase.

Use it for:

- onboarding new engineers and marketers
- explaining how the app behaves end to end
- planning future features without losing the current workflow model

## 1. Module Map

### Product Entry Points

| Area | Purpose | Key Files |
| --- | --- | --- |
| Public landing | Product overview and entry into login | `src/app/page.tsx` |
| Login | Session creation for seeded or real users | `src/app/(auth)/login/page.tsx`, `src/server/actions/auth.ts` |
| App shell | Shared navigation, breadcrumbs, profile menu, mobile drawer | `src/app/(dashboard)/layout.tsx`, `src/components/layout/shell-chrome.tsx`, `src/components/layout/sidebar-nav.tsx`, `src/lib/constants.ts` |

### Main Product Modules

| Module | Purpose | Main Pages | Main Services / Actions |
| --- | --- | --- | --- |
| Overview | Shows queue health, trends, recommendations, and recent activity | `src/app/(dashboard)/dashboard/page.tsx` | `src/lib/dashboard/service.ts` |
| Brand / Knowledge | Stores company profile, offers, audiences, products, goals, compliance, and guardrails | `src/app/(dashboard)/knowledge/page.tsx` | `src/server/actions/knowledge.ts` |
| Trend watch | Refreshes and displays local/global trend signals with explanation | `src/app/(dashboard)/trends/page.tsx` | `src/lib/engines/trends/service.ts`, `src/server/actions/trends.ts` |
| Content lab | Generates ideas and drafts, supports proactive and trend-adaptive workflows | `src/app/(dashboard)/content/page.tsx` | `src/lib/engines/content/service.ts`, `src/lib/engines/content/strategy.ts`, `src/lib/engines/content/prompt-builder.ts`, `src/server/actions/content.ts` |
| Content detail | Edits a single idea or draft, shows context, reviews, and activity | `src/app/(dashboard)/content/[id]/page.tsx` | `src/server/actions/content.ts`, `src/lib/audit/service.ts` |
| Workflow | Moves content through review, revision, approval, scheduling, publishing, and archive states | `src/app/(dashboard)/workflow/page.tsx` | `src/server/actions/content.ts`, `src/server/actions/publishing.ts` |
| Calendar | Shows scheduled content and balance warnings | `src/app/(dashboard)/calendar/page.tsx` | `src/lib/calendar/service.ts` |
| Publishing | Publishes immediately, runs due jobs, syncs performance, prepares WhatsApp content | `src/app/(dashboard)/publishing/page.tsx` | `src/lib/publishing/service.ts`, `src/server/actions/publishing.ts` |
| Library | Reuses and repurposes published content | `src/app/(dashboard)/library/page.tsx` | `src/lib/repository/service.ts`, `src/server/actions/library.ts` |
| Analytics | Aggregates performance snapshots into insights | `src/app/(dashboard)/analytics/page.tsx` | `src/lib/analytics/service.ts` |
| Recommendations | Builds next-best ideas and answers planning questions | `src/app/(dashboard)/recommendations/page.tsx` | `src/lib/engines/recommendations/service.ts`, `src/server/actions/recommendations.ts` |

### Cross-Cutting System Modules

| Layer | Responsibility | Key Files |
| --- | --- | --- |
| Auth | Session cookie, sign-in/out, capability checks | `src/lib/auth/session.ts`, `src/lib/auth/access.ts`, `src/lib/auth/roles.ts` |
| Persistence | Prisma client and database schema | `src/lib/db.ts`, `prisma/schema.prisma` |
| Seed / bootstrap | Demo users and demo business data | `prisma/seed.ts`, `scripts/db-init.mjs` |
| Audit | Traceability for key mutations | `src/lib/audit/service.ts` |
| Notifications | Slack workflow/publishing alerts | `src/lib/notifications/service.ts` |
| Jobs / automation | Cron auth and daily maintenance workflows | `src/lib/jobs/auth.ts`, `src/lib/jobs/service.ts`, `src/app/api/jobs/*/route.ts`, `vercel.json` |
| Shared UI | Reusable cards, badges, buttons, chart | `src/components/ui/*`, `src/components/charts/performance-chart.tsx`, `src/app/globals.css` |

### Data Model Map

| Entity | Purpose |
| --- | --- |
| `User` | Team member identity, role, profile info |
| `BusinessProfile` | Core brand and strategy configuration |
| `CompanyValue` | Brand values used for messaging alignment |
| `Product` | Loan products and service priorities |
| `AudienceSegment` | Target audiences and messaging angles |
| `ComplianceRule` | Compliance guardrails for content and review |
| `GuardrailTerm` | Prohibited or risky terms and review triggers |
| `Offer` | Current active promotions or offers |
| `StrategicGoal` | Business priorities that shape recommendations |
| `TrendSignal` | Stored local/global trend opportunities |
| `ContentItem` | The core content object from idea through archive |
| `ContentReview` | Structured review events and notes |
| `Publication` | Publishing history and delivery state |
| `PerformanceSnapshot` | Performance metrics over time |
| `Recommendation` | Stored ranked recommendation records |
| `ActivityLog` | Operational audit trail |

## 2. Workflow Diagram In Text

### A. Knowledge Setup Workflow

1. User logs in with a role that can manage knowledge.
2. User opens `/knowledge`.
3. User updates business profile, values, products, audiences, offers, goals, compliance rules, and guardrails.
4. Server actions validate and upsert records.
5. Audit logs are written.
6. Related pages are revalidated so content generation and recommendations use the latest business context.

Flow:

`User -> Knowledge UI -> Server Action -> Prisma -> Activity Log -> Revalidate Content/Recommendations`

### B. Trend Discovery Workflow

1. User or cron triggers trend refresh.
2. Trend service fetches RSS items from configured local and global sources.
3. The service removes stale, irrelevant, duplicated, unsafe, or brand-risky topics.
4. Remaining signals are scored for freshness, relevance, and brand fit.
5. Signals are saved to `TrendSignal`.
6. Recommendations are refreshed from the new trend set.

Flow:

`Refresh Trigger -> Source Registry -> RSS Fetch -> Safety Filter -> Scoring -> TrendSignal -> Recommendations Refresh`

### C. AI Content Idea Workflow

1. User opens `/content`.
2. User picks objective, channel, tone, generation mode, optional content lane, optional occasion, and optional product/audience/trend.
3. Content service loads company context plus recent content history.
4. Strategy module calculates proactive opportunities and content-balance guidance.
5. Prompt builder assembles a structured AI prompt.
6. OpenAI is used if configured; otherwise fallback generation is used.
7. Ideas are stored as `ContentItem` records in the `IDEA` stage.

Flow:

`Content Form -> Content Service -> Knowledge + Trends + Balance Context -> AI/Fallback -> IDEA Records`

### D. Drafting Workflow

1. User can generate a draft directly or convert an idea into a draft.
2. Content service reuses product, audience, trend, and brand context.
3. Draft output includes title, copy, CTA, hashtags, summary, and theme label.
4. The content item moves into `DRAFT`.
5. User edits the content in the detail workspace.

Flow:

`Idea or Draft Request -> Context Load -> AI/Fallback Draft -> ContentItem(DRAFT) -> Manual Edit`

### E. Review And Approval Workflow

1. Creator assigns a reviewer and submits the item for review.
2. Content stage changes to `IN_REVIEW`.
3. A `ContentReview` record is created.
4. Reviewer approves or sends back for revision.
5. Approval sets stage to `APPROVED`.
6. Revision sends item to `NEEDS_REVISION` and increments the revision loop.

Flow:

`Draft -> Submit For Review -> IN_REVIEW -> Approve or Revise -> APPROVED / NEEDS_REVISION`

### F. Scheduling And Publishing Workflow

1. Approved content is either published immediately or scheduled.
2. Publishing service builds a final message from draft/final copy + CTA + hashtags.
3. If channel is Facebook and credentials exist, it posts to the Meta Graph API.
4. If channel is WhatsApp and credentials plus destination exist, it posts through WhatsApp Cloud API.
5. If credentials are missing, the system creates simulated publication history instead of failing silently.
6. Every attempt creates a `Publication` row.
7. Successful or simulated publishing updates the source content to `PUBLISHED`.

Flow:

`APPROVED/SCHEDULED -> Publish Action or Job -> Channel Adapter -> Publication Record -> ContentItem(PUBLISHED)`

### G. Performance Monitoring Workflow

1. Facebook publications can be synced for recent metrics.
2. Metrics are stored as `PerformanceSnapshot`.
3. Analytics service aggregates totals, themes, channels, products, trend-linked results, and best posting windows.
4. Analytics surfaces those results on `/analytics`.

Flow:

`Published Content -> Sync Metrics -> PerformanceSnapshot -> Analytics Aggregation -> Insights`

### H. Recommendation Workflow

1. Recommendation refresh loads trend signals, business profile, recent content, analytics, and calendar state.
2. Strategy layer builds proactive opportunities and content-balance guidance.
3. Recommendation service ranks trend-led ideas, proactive ideas, and rebalance ideas.
4. Results are stored in `Recommendation`.
5. Planning assistant answers user questions using the same context.

Flow:

`Trends + Knowledge + Performance + Calendar -> Recommendation Service -> Ranked Recommendations + Planner Answer`

### I. Reuse And Repurposing Workflow

1. User opens `/library`.
2. Repository service filters previously published items.
3. User either:
   - duplicates a published item into a new draft, or
   - repurposes it into a variant for another channel.
4. Audit logs are written and content re-enters the active workflow.

Flow:

`Published Repository -> Reuse / Repurpose -> New DRAFT -> Review/Publish Cycle`

### J. Daily Automation Workflow

1. Vercel cron calls `/api/jobs/daily-maintenance`.
2. Job auth validates `CRON_SECRET`.
3. Trends + recommendations refresh in one lane.
4. Due publications + recent performance sync run in parallel.
5. Results return as one maintenance summary payload.

Flow:

`Daily Cron -> Auth Check -> Trends/Recommendations Refresh + Due Publishing/Sync -> JSON Result`

## 3. Role-Permission Matrix

Current permission model is implemented mostly in capability checks from `src/lib/auth/access.ts` and workflow page logic.

| Capability | Admin | Strategist | Creator | Reviewer | Analyst |
| --- | --- | --- | --- | --- | --- |
| Sign in and view dashboard | Yes | Yes | Yes | Yes | Yes |
| View recommendations | Yes | Yes | Yes | Yes | Yes |
| View analytics | Yes | Yes | No | No | Yes |
| Manage business knowledge | Yes | Yes | No | No | No |
| Generate ideas and drafts | Yes | Yes | Yes | No | No |
| Edit content drafts | Yes | Yes | Yes | No | No |
| Submit content for review | Yes | Yes | Yes | No | No |
| Approve content | Yes | Yes | No | Yes | No |
| Send content back for revision | Yes | Yes | No | Yes | No |
| Schedule content | Yes | Yes | Limited by workflow role | Yes | No |
| Publish content | Yes | Yes | No | Yes | No |
| Run due publications job from UI | Yes | Yes | No | Yes | No |
| Sync performance manually | Yes | Yes | No | Yes | No |
| Reuse or repurpose published content | Yes | Yes | Yes | No | No |
| Generate invite links | Yes | No | No | No | No |
| Generate password reset links | Yes | No | No | No | No |
| Revoke sessions or suspend users | Yes | No | No | No | No |

Practical interpretation:

- `ADMIN`: full operational access
- `STRATEGIST`: almost full marketing control
- `CREATOR`: creation and editing, but workflow visibility is scoped to owned items
- `REVIEWER`: approval and publishing gatekeeper, without analytics access
- `ANALYST`: best aligned to analytics and planning review

## 4. Current Gaps Vs Future Roadmap

| Area | Current State | Gap / Limitation | Best Next Step |
| --- | --- | --- | --- |
| Trend intelligence | RSS-driven with keyword scoring and safety filter | Not true real-time social listening yet | Add Google Trends, Meta inputs, or approved social listening APIs |
| Recommendation quality | Strong rules + historical context + proactive opportunities | Not yet personalized by audience segment behavior | Add audience-specific recommendation weighting |
| Publishing channels | Facebook live, WhatsApp live/manual-ready | No Instagram, LinkedIn, or TikTok adapters | Phase 2 channel expansion |
| Asset handling | Text-first workflow with asset reference fields | No real asset library, upload flow, or image approval | Build asset library and creative pipeline |
| Collaboration | Reviewer assignment + review records + audit trail | No threaded comments, mentions, or task ownership model | Add collaboration threads and approval notes UI |
| Analytics | Snapshot aggregation with good summaries | Limited attribution and conversion depth | Add richer sync sources and attribution models |
| Experimentation | Manual content variation through reuse/repurpose | No formal A/B or variant testing workflow | Add copy variant experiments and comparison views |
| Mobile readiness | Service layer is reusable, app shell is responsive | No public API layer tailored for mobile clients | Expose stable API routes for mobile consumption |
| Compliance operations | Rules and guardrails exist in knowledge base | No explicit legal approval workflow or policy versioning | Add approval checkpoints and policy history |
| Observability | Audit logs and some Slack alerts | No full incident or delivery observability layer | Add deployment monitoring, publish error reporting, and job health alerts |
| Auth maturity | Cookie-based auth with invite links, admin-issued reset links, rate limiting, session revocation, and admin re-auth freshness checks | No MFA, email delivery, or enterprise SSO yet | Add mail delivery, MFA, and enterprise auth |
| Data governance | Strong core structured model | Still dependent on disciplined admin data quality | Add validation rules, completeness scoring, and profile health prompts |

## 5. Recommended Planning Priorities

Recommended order for the next major cycles:

1. Strengthen the knowledge base and analytics loop.
2. Improve recommendation quality using better performance and audience signals.
3. Expand channels only after publishing reliability and review clarity are stable.
4. Add asset workflow before major creative automation.
5. Add API boundaries before starting a true mobile client.

## 6. Short Executive Summary

The system already works as a structured marketing operations platform, not just an AI prompt screen.

Its strongest traits today are:

- shared reusable business context
- proactive + trend-adaptive content generation
- end-to-end workflow state management
- publishing history and analytics feedback
- recommendation-driven planning

Its biggest next opportunities are:

- stronger live trend intelligence
- richer analytics attribution
- more collaboration depth
- more channels and creative asset support
- API-first readiness for mobile
