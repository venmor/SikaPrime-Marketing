# Roadmap

## Phase 1: Team-Ready Web Platform

Status: implemented foundation with workflow-aligned operations

Goals:

- Web dashboard for marketers
- Trend ingestion and scoring
- AI-assisted idea generation and drafting with proactive and trend-adaptive modes
- Business knowledge base with compliance and guardrails
- Workflow, approvals, scheduling, publishing, and archives
- Publishing queue and content calendar
- Analytics, recommendations, and planning assistant support
- Vercel-ready cron automation, live Facebook sync, optional WhatsApp delivery, and optional Slack alerts

## Phase 2: Channel Expansion

Next priorities:

- Add Instagram and LinkedIn adapters
- Improve Facebook result ingestion
- Add reusable campaign templates
- Add richer comments and collaboration threads

## Phase 3: Creative Expansion

Planned capabilities:

- AI image generation workflows
- Asset library and approval pipeline
- Content bundles by campaign theme
- Landing page and ad creative kits

## Phase 4: Intelligence Expansion

Planned capabilities:

- Better trend classification and clustering
- Audience-specific recommendation paths
- Conversion attribution and deeper performance analytics
- Stronger experimentation support for copy variants

## Phase 5: Mobile App Readiness

Longer-term plan:

- Expose service-layer logic behind API boundaries
- Reuse authentication, workflow, and analytics models
- Build mobile-first views for approvals, queue monitoring, and quick publishing

## Planning Notes

When the team extends the platform, prioritize work in this order:

1. Strengthen business data quality in the knowledge base
2. Improve analytics feedback loops
3. Expand channels only after workflow reliability is solid
4. Add automation gradually so compliance remains visible

## Workflow Alignment

Current workflow coverage in the product:

1. Company knowledge setup
   Implemented through the Knowledge Base with business profile, products, audiences, offers, goals, compliance rules, and guardrail terms.
2. Trend discovery and analysis
   Implemented through the Trends module with freshness, relevance, brand-fit scoring, lifecycle classification, local/global separation, and safety filtering.
3. AI content idea generation
   Implemented through the Content Lab idea generator with reusable campaign objectives, proactive occasion support, balance-aware guidance, and safe trend-aware inputs.
4. Content drafting
   Implemented through direct draft generation and idea-to-draft conversion.
5. Content review and approval
   Implemented through reviewer assignment, review history, revision states, and approval actions.
6. Facebook auto-posting
   Implemented with live integration support and simulated fallback for development and staged rollout.
7. WhatsApp content preparation
   Implemented with WhatsApp-ready message generation and publishing workspace support.
8. Content calendar and scheduling
   Implemented with calendar view, schedule warnings, and posting-window guidance.
9. Published content management
   Implemented with the Library module for filtering, reuse, repurposing, and performance-aware review.
10. Performance monitoring and insight
   Implemented with analytics dashboards for themes, products, timing, channels, and trend-linked performance.
11. Smart recommendation
   Implemented with scored recommendations and planning-question support.
12. Multi-user collaboration
   Implemented with role-based access, review routing, publishing control, and activity logging.
13. System learning and scalability
   Implemented in modular services with clear extension points for channels, analytics, AI providers, and future mobile APIs.
