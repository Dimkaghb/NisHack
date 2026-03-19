# LocationIQ — Product & Implementation Plan

> AI-powered commercial real estate finder for Almaty, Kazakhstan.  
> Stack: FastAPI · Supabase · LangGraph · Redis · Celery · Anthropic API

---

## Что такое Aimaq

Aimaq — это multi-agent AI-система, которая помогает предпринимателям в вашем городе находить оптимальные коммерческие помещения для аренды или покупки. Вместо того чтобы тратить дни на ручной просмотр Krisha.kz, прогулки по улицам и звонки риэлторам, вы указываете тип бизнеса и бюджет — а система в течение 60 секунд выдает ранжированные рекомендации локаций с понятными пояснениями.

### The problem it solves

Choosing a commercial location in your city is one of the most consequential decisions a small business makes. A cafe in the wrong district fails not because the food is bad, but because no one walks past. An office on the wrong street loses employees who can't get there by bus. Most entrepreneurs rely on gut feeling, a broker's incentives, or whatever happens to be listed that week.

Aimaq убирает «угадайку» и опирается на данные: пешеходный трафик, плотность конкурентов, доступность транспорта — всё взвешивается под конкретный тип бизнеса, который вы запускаете.

### How it works

1. **User inputs** — business type (fastfood, cafe, office, retail, pharmacy), district preference, budget in KZT, and how many competitors they're willing to tolerate nearby
2. **Fetcher agent** — pulls commercial listings from Krisha.kz and OLX.kz, deduplicates by coordinates and area
3. **Three enrichment agents run in parallel:**
   - *Footfall agent* — estimates pedestrian traffic using 2GIS anchor POI density, OSM walkability data, and per-district commercial activity scores
   - *Competitor agent* — queries 2GIS Places API for same-category businesses within a configurable radius
   - *Transit agent* — counts bus stops within 300m via OpenStreetMap Overpass API, adds metro proximity bonus
4. **Scoring engine** — applies a weighted formula unique to each business type (a fastfood cares 40% about footfall; an office cares 50% about transit)
5. **Explanation agent** — calls Claude API to generate a plain Russian explanation of why each top location fits, with specific numbers
6. **Contact agent** — on request, generates a professional Russian draft message to the landlord

### What makes it different from just browsing Krisha

A стандартный поиск по недвижимости показывает объявления, отсортированные по цене или «свежести». Aimaq ранжирует локации по тому, насколько они подходят **именно вашему бизнесу**, и добавляет письменное объяснение логики подбора. Вам не нужно разбираться в цифрах — вы читаете готовое пояснение: *"Это место на 34% превосходит второе по трафику. В пятницу днём здесь проходит около 800 человек. Ближайший конкурент — 620 метров."*

Then, with one click, they have a ready-to-send letter to the landlord in Russian.

---

## Technology Stack

| Layer | Choice | Reason |
|---|---|---|
| API Framework | FastAPI (Python 3.11+) | Async-first, Pydantic v2, auto OpenAPI docs |
| Database & Auth | Supabase (PostgreSQL 15) | RLS, real-time, auth, storage in one platform |
| Agent Orchestration | LangGraph | Graph-based state machine — parallel enrichment nodes, fault tolerance, checkpointing |
| LLM | Claude API (`claude-sonnet-4-20250514`) | Best Russian output quality, structured explanations |
| Task Queue | Celery + Redis | Async pipeline execution, periodic scraping |
| HTTP Client | httpx (AsyncClient) | Async-first, replaces requests everywhere |
| Validation | Pydantic v2 | Strict typing on all inputs and outputs |
| Linting | Ruff | Fast, replaces black + isort + flake8 |
| Logging | structlog | JSON structured logs, no print() |

### External APIs — Almaty-specific

| API | Purpose | Notes |
|---|---|---|
| 2GIS Places API | Competitor density, POI search | Best CIS city coverage — more accurate than Google for Almaty side streets |
| Google Places API | Secondary POI, Popular Times proxy | Used where 2GIS has gaps |
| OSM Overpass API | Bus stops, metro stations, parking | Free, no rate limit, well-mapped in Almaty |
| Yandex Maps | Fallback geocoding | Better than Google for Almaty suburbs |
| Krisha.kz (scraper) | Primary listings source | No official API — async httpx + BeautifulSoup |
| OLX.kz (scraper) | Secondary listings source | Supplements Krisha, same scraper pattern |

### Why LangGraph over CrewAI or AutoGen

The pipeline has a fixed, deterministic structure — not a free-form conversation between agents. LangGraph's graph-based state machine is the right fit: explicit parallel branching (three enrichment nodes via `Send()` API), typed shared state, built-in checkpointing for fault tolerance, and clean Python without framework magic. CrewAI would force a sequential flow; AutoGen is optimized for conversational multi-agent patterns, which this is not.

---

## Almaty-Specific Context

### District footfall classification

Almaty has 8 administrative districts. When API footfall data is unavailable, the scoring engine falls back to these hardcoded commercial activity scores:

| District | Score | Notes |
|---|---|---|
| Almaly | 95 | City center, Zhibek Zholy — highest foot traffic |
| Medeu | 80 | Dostyk corridor, Mega mall, premium offices |
| Bostandyk | 75 | Rozybakiev, active residential + retail mix |
| Alatau | 60 | Growing commercial strips, Samal area |
| Auezov | 55 | Bazaars, local markets, dense residential |
| Zhetysu | 50 | Eastern districts, residential-heavy |
| Turksib | 45 | Industrial + residential mix |
| Nauryzbai | 40 | Outskirts, lowest walkability |

### Transit specifics

- **Metro:** 1 line, 9 stations (Raimbek Batyr → Moscow). Within 800m adds +15 to transit score flat
- **Key bus corridors** (extra +10 to transit score): Al-Farabi Ave, Dostyk Ave, Seifullin Ave, Rozybakiev St
- **Bus stop data:** OSM has well-mapped ONAY card stop locations for Almaty — queried via Overpass API

### Language and currency

- All user-facing Claude output is in **Russian** — enforced in every system prompt
- All prices stored in **KZT** (Kazakhstani Tenge), displayed as `500 000 ₸/мес`
- Addresses normalized to Russian format: `ул. Достык, 1`

---

## Scoring Engine

Each listing receives a normalized 0–100 score computed as a weighted sum of sub-scores. Weights vary by business type:

| Factor | Fastfood / Cafe | Office | Retail | Pharmacy |
|---|---|---|---|---|
| Footfall | 40% | 5% | 35% | 30% |
| No competitors | 25% | 5% | 20% | 20% |
| Transit access | 10% | 50% | 15% | 25% |
| Price efficiency | 20% | 30% | 20% | 15% |
| Area fit | 5% | 10% | 10% | 10% |

### Sub-score normalization

- **Footfall:** min-max normalization across all listings in the current batch
- **Competitor:** inverted sigmoid — 0 competitors = 100, `competitor_tolerance` competitors = 50, 2× tolerance = 0
- **Transit:** bus stops within 300m (capped at 10) → mapped 0–100. Metro within 800m adds flat +15
- **Price efficiency:** `(budget - ask_price) / budget × 100`, clamped 0–100. Uses district median if no budget set
- **Area fit:** penalty for deviation from ideal area per business type, normalized

---

## Project Structure

```
locationiq-backend/
├── app/
│   ├── main.py                  # FastAPI app factory + lifespan + CORS
│   ├── config.py                # Pydantic BaseSettings — all env vars
│   ├── api/
│   │   └── v1/
│   │       └── routers/
│   │           ├── search.py    # POST /search, GET /search/{id}
│   │           ├── listings.py  # GET /listings browse
│   │           ├── auth.py      # Supabase auth routes
│   │           └── webhooks.py
│   ├── agents/
│   │   ├── graph.py             # StateGraph wiring — all nodes connected here
│   │   ├── state.py             # PipelineState TypedDict
│   │   └── nodes/
│   │       ├── fetcher.py       # Krisha + OLX listings fetch
│   │       ├── footfall.py      # Footfall scoring node
│   │       ├── competitor.py    # 2GIS competitor density node
│   │       ├── transit.py       # OSM bus stops + metro proximity
│   │       ├── scoring.py       # Weighted score computation
│   │       ├── explainer.py     # Claude API — Russian explanations
│   │       └── contact.py       # Claude API — draft landlord message
│   ├── scrapers/
│   │   ├── base.py              # Abstract BaseScraper with rate limiting
│   │   ├── krisha.py            # Krisha.kz commercial listings
│   │   └── olx.py              # OLX.kz listings
│   ├── integrations/
│   │   ├── gis2.py              # 2GIS Places API client
│   │   ├── google_places.py     # Google Places API client
│   │   ├── osm.py               # Overpass API — bus stops, metro
│   │   └── yandex.py            # Yandex Maps fallback geocoding
│   ├── services/
│   │   ├── scoring.py           # Weight matrix + normalization
│   │   ├── cache.py             # Redis helpers
│   │   └── deduplication.py     # Cross-source listing dedup
│   ├── models/
│   │   ├── listing.py           # Listing, ScoredListing, ContactRequest
│   │   └── user.py              # User, SearchSession
│   ├── db/
│   │   ├── client.py            # Singleton Supabase async client
│   │   └── queries.py           # Typed query helpers — no raw SQL in routers
│   └── tasks/
│       ├── scraping.py          # Celery Beat periodic scrape tasks
│       └── pipeline.py          # Async agent pipeline task
├── tests/
│   ├── test_scoring.py
│   ├── test_nodes.py
│   ├── test_scrapers.py
│   └── test_rls.py              # RLS tests with Supabase anon client
├── CLAUDE.md                    # Claude Code rules — read before every session
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── pyproject.toml
└── requirements.txt
```

---

## Database Schema

| Table | Key Columns | Notes |
|---|---|---|
| `listings` | id, source, external_id, address, lat, lng, price_tenge, area_sqm, type, raw_data JSONB, scraped_at | Deduplicated by `(external_id, source)`. JSONB for source-specific fields |
| `enriched_listings` | listing_id FK, footfall_score, competitor_count, competitor_score, transit_score, transit_stops_nearby JSONB | Re-computed on each scrape cycle |
| `search_sessions` | id, user_id FK, business_type, district, budget, weights_override JSONB, status, created_at | Status: pending / running / complete / failed |
| `search_results` | session_id FK, listing_id FK, total_score, score_breakdown JSONB, explanation, rank | One row per listing per session |
| `contact_drafts` | id, session_id FK, listing_id FK, draft_ru, draft_en, created_at | Generated lazily on user request only |
| `users` | id (Supabase auth UUID), email, plan, searches_used_this_month | Mirrors Supabase auth.users. RLS: users read own rows only |

---

## API Endpoints

| Method + Path | Purpose |
|---|---|
| `POST /api/v1/search` | Start search session. Triggers pipeline via Celery. Returns `session_id` immediately. |
| `GET /api/v1/search/{session_id}` | Poll status and results. Returns `top_listings` when complete. |
| `GET /api/v1/search/{session_id}/listing/{listing_id}` | Full detail for one listing including score breakdown. |
| `POST /api/v1/search/{session_id}/contact` | Trigger ContactNode for a listing. Returns Russian draft message. |
| `GET /api/v1/listings` | Browse cached listings without running the AI pipeline. |
| `GET /api/v1/health` | Returns DB, Redis, Celery status. |
| `GET /api/v1/user/me` | Current user profile and usage stats. |

---

## Implementation Plan

Build in this exact order. Each phase is independently testable and deployable. Do not start Phase 2 until Phase 1 has 200+ real listings in the database.

---

### Phase 1 — Data Foundation
**Duration:** ~3 days  
**Goal:** 200+ real Almaty commercial listings sitting in Supabase before any agents exist.

- Create `listings` table migration with full schema (source, external_id, address, lat/lng, price_tenge, area_sqm, type, raw_data JSONB)
- Build `scrapers/base.py` — abstract class with 2s minimum delay, httpx.AsyncClient, rotating User-Agent list (5 entries), 3 retries with exponential backoff
- Build `scrapers/krisha.py` — parse Krisha.kz commercial section, filter by type (offices, retail, cafes, pharmacies)
- Upsert logic on `(external_id, source)` — no duplicates ever written
- Wire Celery Beat task in `tasks/scraping.py` — runs every 6 hours
- Manually run scraper, verify 200+ rows in Supabase dashboard before moving on

**Claude Code prompt:**
```
We're building LocationIQ, an AI location finder for Almaty. CLAUDE.md has all rules.

Start Phase 1: create the Supabase listings table migration, then build 
scrapers/base.py and scrapers/krisha.py to scrape commercial listings from Krisha.kz.

Constraints from CLAUDE.md:
- BaseScraper with 2s delay, httpx.AsyncClient, rotating UA
- Upsert on (external_id, source) — no duplicates
- All models Pydantic v2
- structlog for all logging, no print()
```

---

### Phase 2 — Enrichment Layer
**Duration:** ~4 days  
**Goal:** Each listing in the DB has footfall_score, competitor_count, and transit_score written to `enriched_listings`.

- Build `integrations/gis2.py` — 2GIS Places API nearby search for competitor businesses by category
- Build `integrations/osm.py` — Overpass API query: `highway=bus_stop` within 300m of each listing
- Hardcode `DISTRICT_FOOTFALL` dict in `services/scoring.py` as API fallback (Almaly=95 … Nauryzbai=40)
- Hardcode Almaty metro station coordinates (9 stations) for metro proximity calculation
- Create `enriched_listings` table with FK to listings
- Write enrichment runner script: iterate all listings, call 2GIS + OSM, store results
- Add metro proximity bonus: +15 if listing is within 800m of any metro station
- All integration clients use async context manager pattern, 10s timeout, tenacity retries

**Claude Code prompt:**
```
Phase 2: build the enrichment layer.

Create integrations/gis2.py (2GIS Places API nearby search) and 
integrations/osm.py (Overpass API bus stop query within 300m radius).

Then write an enrichment runner that iterates all listings from the DB,
calls both APIs per listing, and writes results to enriched_listings table.

Hardcode the DISTRICT_FOOTFALL dict and Almaty metro station coords 
(9 stations) for fallback scoring. All clients follow the pattern in CLAUDE.md:
httpx.AsyncClient, 10s timeout, tenacity 3 retries.
```

---

### Phase 3 — Scoring Engine
**Duration:** ~2 days  
**Goal:** Given enriched listings and a business_type, produce a ranked list with normalized 0–100 scores and a score_breakdown per listing.

- Implement `services/scoring.py` with full `WEIGHTS` dict for all 4 business types
- Footfall normalization: min-max across the current batch
- Competitor normalization: inverted sigmoid with `competitor_tolerance` param
- Transit normalization: bus stop count (capped at 10) → 0–100, metro bonus +15 flat
- Price efficiency: `(budget - ask) / budget × 100`, clamp 0–100, use district median if no budget
- Area fit: penalty for deviation from ideal area, normalized
- **Write `tests/test_scoring.py` with at least 5 unit tests before moving to Phase 4**

**Claude Code prompt:**
```
Phase 3: build services/scoring.py — the weighted scoring engine.

Use the WEIGHTS dict from CLAUDE.md:
- fastfood: footfall 40%, competitor 25%, transit 10%, price 20%, area 5%
- office: footfall 5%, competitor 5%, transit 50%, price 30%, area 10%

Normalizers:
- Footfall: min-max across batch
- Competitor: inverted sigmoid, competitor_tolerance param (0 competitors = 100, tolerance = 50, 2× = 0)
- Transit: bus stop count capped at 10 → 0–100, metro within 800m adds +15 flat
- Price: (budget - ask) / budget × 100, clamp 0–100

Write tests/test_scoring.py with at least 5 unit tests before considering done.
```

---

### Phase 4 — FastAPI Search Endpoint (Sync)
**Duration:** ~2 days  
**Goal:** `POST /api/v1/search` returns top 5 scored listings as JSON — synchronous, no Celery yet.

- Create `app/main.py` with FastAPI app factory, lifespan, CORS middleware
- Create `app/config.py` with Pydantic BaseSettings loading all env vars
- Build `api/v1/routers/search.py` — POST handler with Pydantic request/response models, `response_model=`, `status_code=` explicit on all routes
- Build `db/client.py` singleton Supabase async client and `db/queries.py` typed helpers
- Call scoring service directly in the route handler for now (no agents, no async pipeline)
- Test manually: `POST /api/v1/search {"business_type": "fastfood", "district": "Almaly"}` should return ranked listings

**Claude Code prompt:**
```
Phase 4: build the FastAPI search endpoint — synchronous for now, no Celery yet.

Create app/main.py (factory pattern with lifespan), app/config.py (Pydantic BaseSettings),
api/v1/routers/search.py (POST /search handler), db/client.py (Supabase async singleton),
and db/queries.py (typed query helpers).

POST /api/v1/search takes a SearchRequest (business_type, district, budget_tenge, 
area_sqm_min, competitor_tolerance) and returns top 5 scored listings synchronously
by calling the scoring service from Phase 3.

All rules from CLAUDE.md apply: async def routes, Pydantic v2 models, 
no logic in routers, HTTPException with dict detail.
```

---

### Phase 5 — Claude Explainer Node
**Duration:** ~2 days  
**Goal:** Each top listing gets a plain Russian explanation of why it's a good fit, generated by Claude.

- Build `agents/nodes/explainer.py` — calls `claude-sonnet-4-20250514` with `AsyncAnthropic` client
- System prompt: Russian language, деловой тон, конкретные цифры, без воды
- Prompt includes: business_type, score_breakdown dict, footfall vs competitors comparison, district name
- Test with 10 real Almaty listings from the DB — tune prompt until output sounds natural and specific
- Add `explanation` field to search response model
- Limits: `max_tokens=1500`, always `AsyncAnthropic` — never sync client, never called from router

**Claude Code prompt:**
```
Phase 5: build agents/nodes/explainer.py — the Claude explanation node.

It receives the top 5 scored listings from state["scored_listings"][:5] and
calls claude-sonnet-4-20250514 to generate a Russian explanation for each.

System prompt must specify:
- Ответь на русском языке
- Деловой, но дружелюбный тон
- Используй конкретные цифры из score_breakdown
- Без общих фраз и воды

Use AsyncAnthropic client only. max_tokens=1500.
Follow the node signature pattern from CLAUDE.md exactly: 
async def, return only updated keys, never raise.
```

---

### Phase 6 — LangGraph Pipeline + Async API
**Duration:** ~3 days  
**Goal:** Pipeline becomes a proper LangGraph graph. POST returns session_id immediately, GET polls results.

- Build `agents/state.py` with full `PipelineState` TypedDict
- Convert fetcher, footfall, competitor, transit, scoring, explainer into proper node functions following the CLAUDE.md signature pattern exactly
- Wire `agents/graph.py` — `fetcher` → parallel `Send()` to `[footfall, competitor, transit]` → all three converge to `scoring` → `explainer`
- Build `tasks/pipeline.py` — Celery task that runs `pipeline.ainvoke(state)`, writes result to `search_results`
- Update `POST /search` to return `session_id` immediately and trigger Celery task
- Build `GET /search/{session_id}` polling endpoint — returns status + results when complete
- Create `search_sessions` and `search_results` tables

**Claude Code prompt:**
```
Phase 6: wire the full LangGraph pipeline and make the API async.

Create agents/state.py with PipelineState TypedDict (all fields from CLAUDE.md).

Convert the existing scoring + enrichment logic into node functions.
Every node follows the CLAUDE.md pattern exactly:
- async def node_name(state: PipelineState) -> dict
- Return only the keys you update
- Never raise — catch all errors, append to state["errors"], return partial result
- Log with structlog: node name, item count, duration_ms

Wire agents/graph.py: fetcher → parallel Send() to [footfall, competitor, transit]
→ all three converge to scoring → explainer → finish.

Update POST /search to return session_id immediately and dispatch Celery task.
Build GET /search/{session_id} that polls search_sessions status and returns
top_listings + explanations when status = "complete".
```

---

### Phase 7 — Auth, RLS, Rate Limiting
**Duration:** ~2 days  
**Goal:** Users sign in with Google, own their search history, free accounts limited to 10 searches/hour.

- Enable Supabase Google OAuth, build `api/v1/routers/auth.py`
- Create `users` table mirroring `auth.users`, with `plan` (free/pro) and `searches_used_this_month`
- Write RLS policies: users can SELECT/INSERT their own rows only on `search_sessions` and `contact_drafts`
- Build rate limiting FastAPI middleware using Redis counter keyed on `user_id` — 10/hour free, 100/hour pro
- Write `tests/test_rls.py` — verify anon client receives empty result from `search_sessions`
- Add auth dependency (`Depends(get_current_user)`) to all search and contact routes

**Claude Code prompt:**
```
Phase 7: add auth, RLS, and rate limiting.

Enable Supabase Google OAuth in app/main.py lifespan.
Build api/v1/routers/auth.py for the OAuth callback flow.
Create users table (mirrors auth.users, adds plan + searches_used_this_month).

Write Supabase RLS policies:
- search_sessions: user_id = auth.uid() for SELECT and INSERT
- contact_drafts: accessible via session_id join only

Build a FastAPI middleware that reads the user's plan from Redis/DB
and enforces rate limits: 10 searches/hour (free), 100/hour (pro).

Write tests/test_rls.py — use Supabase anon key client (not service key)
and verify it gets [] from search_sessions.
```

---

### Phase 8 — Contact Agent
**Duration:** ~1 day  
**Goal:** User selects a listing and receives a ready-to-send Russian letter to the landlord.

- Build `agents/nodes/contact.py` — Claude generates professional Russian inquiry letter
- Letter includes: business type, area needed, budget range, availability question, polite contact request
- Expose `POST /search/{session_id}/contact` route — lazy, only runs when user explicitly requests
- Store result in `contact_drafts` table with `session_id` + `listing_id` FK
- Return both Russian and English versions, `max_tokens=800`

**Claude Code prompt:**
```
Phase 8: build the contact agent — final phase.

Create agents/nodes/contact.py that generates a professional Russian letter
to a commercial landlord. The letter should include:
- What type of business the user is opening
- Required area and budget range
- Request to confirm availability and schedule a viewing
- Polite, professional tone (деловой стиль)

Expose POST /api/v1/search/{session_id}/contact as a lazy endpoint.
Store the draft in contact_drafts table.
Return both draft_ru and draft_en in the response.
max_tokens=800, AsyncAnthropic only.
```

---

## Development Rules (Summary)

These rules are in `CLAUDE.md` in full. Never violate them.

| Rule | Detail |
|---|---|
| Async routes | Every FastAPI route handler is `async def` — no exceptions |
| No sync Supabase | Always `create_async_client`, never the sync client |
| Pydantic v2 | `model_config = {}` — never `class Config: orm_mode = True` |
| No logic in routers | Routers call services or tasks only. Logic lives in `services/` |
| Node error contract | Nodes never raise. Catch all, append to `state["errors"]`, return partial |
| Claude API location | Only in `explainer.py` and `contact.py` — never in routers or services |
| Russian output | Every Claude call for user-facing text specifies Russian in the system prompt |
| No scraping on request | Krisha + OLX only via Celery Beat — never triggered by a user API call |
| No raw SQL in routers | All DB access through `db/queries.py` typed helpers |
| structlog everywhere | Never `print()` — always `log.info(...)` with key=value pairs |
| httpx not requests | `httpx.AsyncClient` everywhere — `requests` library is banned |
| Test RLS with anon | RLS tests use Supabase anon key, not service key |

---

## Common Mistakes to Avoid

| Wrong | Right |
|---|---|
| `import requests` | `import httpx` |
| `os.environ["KEY"]` | `settings.key` from `config.py` |
| `def route():` in FastAPI | `async def route():` |
| `class Config: orm_mode` | `model_config = {"from_attributes": True}` |
| `print("debug")` | `log.debug("event", key=val)` |
| Raising inside a node | Append to `state["errors"]`, return partial result |
| Claude API in router | Claude API only in agent nodes |
| Sync Supabase client | Always `create_async_client` |
| Logic in router | Logic in `services/` |
| Scraping on user request | Scraping only via Celery Beat every 6h |
| Building Phase 2 without Phase 1 data | Verify 200+ listings in DB first |

---

*LocationIQ · Almaty MVP · v1.0*  
*FastAPI + Supabase + LangGraph · Built for Kazakhstan*