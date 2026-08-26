// System Design — the SYNTHESIS discipline: turning a product requirement into
// an architecture, where every component on the whiteboard is *paid for* by a
// requirement or a number. Companion to the Cloud Architecture & Distributed
// Systems course: that course proves the principles (CAP, replication, quorums,
// tail latency); this one composes them into real systems under a demanding
// design-review rubric.
//
// The organizing idea: a design is a DERIVATION, not a pattern collage.
//   requirements → numbers → binding constraint → component that relieves it
//   → failure analysis → repeat.
// Anything on the diagram that this chain did not force is decoration — and
// the gates penalize decoration as hard as they penalize a missing cache.
//
// Running example (cohesion rule 4): **Lens**, a photo-sharing social network,
// scoped honestly at 100k DAU in unit 1 and grown to 100M DAU by the closing
// units. Each unit re-enters Lens where its material bites: its requirements
// and first capacity estimate in u1, its data model and shards in u2, its
// media/CDN read path in u3, its feed fan-out in u4 and u6, its DMs and
// presence in u7, its live migrations in u8.
//
// Units are inserted one at a time via scripts/insert-unit.mjs — never
// generated in one shot (see AUTHORING.md).
//
// Outline (8 units):
//   u1  The Method            — requirements & SLOs; capacity arithmetic; one machine first; the API contract
//   u2  Data                  — modeling for access patterns; choosing a store; partitioning in practice; the consistency you actually need
//   u3  The Read Path         — cache hierarchy & hit-ratio math; cache correctness; CDN & media pipeline; derived read models
//   u4  The Write Path        — queues & backpressure; delivery semantics & idempotency; fan-out economics; partitioned logs
//   u5  Canonical I: KV core  — unique ID generation; URL shortener; Dynamo-style KV store; rate limiter
//   u6  Canonical II: social  — news feed end-to-end; notification system; counters & top-k
//   u7  Canonical III: realtime — the connection problem; chat/messaging; presence
//   u8  Production            — failure-first design; observability & capacity; live migrations; the design review

export const systemDesign = {
  id: "system-design",
  title: "System Design",
  subject: "Software Architecture",
  difficulty: "Professional",
  description:
    "From requirements to architecture: capacity arithmetic, storage selection, read and write paths, and the canonical large-scale designs — KV stores, news feeds, chat, rate limiters — with every component paid for by a requirement or a number. Design judgment is graded against a principal engineer's design-review rubric.",
  overview:
    "Systems design is the discipline of turning a product requirement — *people can share photos with their followers* — into an architecture: a concrete arrangement of servers, databases, caches, queues, and connections that delivers the feature at the required scale, latency, and availability, and keeps delivering it when components fail. It is the layer of engineering above any single codebase, where the questions are not *how do I write this function* but *how many machines, holding what data, talking in what order — and what breaks first*.\n\nWithout this discipline, systems get designed by imitation: engineers copy the architecture of a company a thousand times their size, inherit its complexity without its necessity, and still fall over — because the copied diagram was never derived from *their* requirements. Mastery buys you the opposite: the ability to start from a vague product ask, extract quantified requirements, and derive the smallest architecture that meets them — then defend every box on the whiteboard when a skeptical reviewer asks *why is this here?*\n\nThe course is organized around one idea: **a design is a derivation, not a pattern collage**. Three load-bearing habits carry it. First, **arithmetic before architecture**: queries per second, bytes per day, and connection counts are computed before any component is drawn, because the numbers decide which constraint binds. Second, **every component is paid for**: a cache, queue, or shard enters the design only when a named requirement or number forces it. Third, **failure is part of the spec**: a design that only works when everything is up does not meet its availability requirement.\n\nThe units build in three phases. The first phase establishes the method itself — requirements, estimation, the single-machine baseline, and the API contract. The second phase builds the two halves of every large system: the data layer, the read path, and the write path. The third phase is synthesis: the canonical designs — key-value cores, social feeds, real-time messaging — worked end to end with the method, then hardened for production and defended in a design review.\n\nBy the end you should be able to take any system-design prompt, derive the architecture at a stated scale, and justify it quantitatively. The gates test exactly that: estimate the capacity, choose and defend the component, and produce full designs graded against a principal engineer's rubric. It pairs naturally with the Cloud Architecture & Distributed Systems course, which proves the underlying theory this course composes.",
  sources: [
    "Alex Xu — System Design Interview: An Insider's Guide, vols. 1–2 (ByteByteGo, 2020/2022) — the canonical design catalogue",
    "Martin Kleppmann — Designing Data-Intensive Applications (O'Reilly, 2017) — the data backbone",
    "Google — Site Reliability Engineering & The SRE Workbook (free at sre.google/books)",
    "Dean & Barroso — The Tail at Scale (CACM 56(2), 2013); Jeff Dean — 'Numbers Everyone Should Know' (LADIS 2009 keynote)",
    "J. D. C. Little — 'A Proof for the Queuing Formula L = λW' (Operations Research 9(3), 1961)",
    "Karger et al. — Consistent Hashing and Random Trees (STOC 1997); DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store (SOSP 2007)",
    "Nishtala et al. — Scaling Memcache at Facebook (NSDI 2013); Bronson et al. — TAO: Facebook's Distributed Data Store for the Social Graph (USENIX ATC 2013)",
    "Jay Kreps — 'The Log: What every software engineer should know about real-time data's unifying abstraction' (LinkedIn Engineering, 2013); Kreps, Narkhede & Rao — Kafka (NetDB 2011)",
    "Raffi Krikorian — Timelines at Scale (QCon 2012) — Twitter's fan-out numbers; Twitter Engineering — Announcing Snowflake (2010)",
    "Instagram Engineering — Sharding & IDs at Instagram (2012)",
    "Brandur Leach — Designing Robust and Predictable APIs with Idempotency (Stripe Engineering, 2017)",
    "Werner Vogels — Eventually Consistent (CACM 52(1), 2009)",
    "Discord Engineering — How Discord Stores Billions of Messages (2017); Rick Reed — Scaling to Millions of Simultaneous Connections (WhatsApp, Erlang Factory 2012)",
  ],
  grader:
    "You are a principal engineer running a demanding design review. The candidate's job is to DERIVE the design: extract quantified requirements, do the capacity arithmetic in the open, identify the binding constraint, and pay for every component with a requirement or a number. Reward: explicit assumptions, order-of-magnitude arithmetic shown step by step, designs sized to the stated scale rather than maximal, named failure modes with mitigations, and honest trade-offs between alternatives. Penalize: box-and-arrow architectures with no numbers, components that answer no stated requirement (cargo-culted queues, caches, or microservices), ignoring the write path or the failure story, buzzwords in place of mechanisms, and one-size answers that would not change if the requirements changed. An answer that names the right technology without deriving why it is needed at this scale scores low. Accept any coherent alternative that meets the requirements — grade the derivation, not conformity to the reference.",
  units: [
    {
      "id": "u1",
      "title": "The Method",
      "summary": "Requirements and SLOs, capacity arithmetic, the single-machine baseline, and the API contract — the derivation loop every later unit runs.",
      "intro": "The course opens with the method itself, because systems design fails at the start far more often than at the end: a design built on unstated requirements is wrong no matter how elegant its components. This unit builds the derivation loop the rest of the course runs on every system it designs. First, requirements — extracting the functional spec and the quantified non-functional targets (scale, latency percentiles, availability, consistency, durability) that every later decision answers to. Second, arithmetic — turning those targets into queries per second, bytes per day, and concurrent connections, the numbers that decide which constraint binds. Third, the single-machine baseline — what one modern server actually does, and the honest test for whether the numbers force distribution at all. Fourth, the contract — the API surface, pagination, and idempotency rules that outlive every implementation behind them. Along the way you will meet **Lens**, the photo-sharing social network this course designs and redesigns at growing scale through every unit. The gate asks you to run the whole loop on a system you have not seen: extract, estimate, decide, and defend.",
      "references": [
        "Alex Xu — System Design Interview vol. 1, chs. 1–3 (scale from zero, back-of-envelope, the framework)",
        "Jeff Dean — 'Numbers Everyone Should Know' (LADIS 2009 keynote); Dean & Barroso — The Tail at Scale (CACM 2013)",
        "J. D. C. Little — 'A Proof for the Queuing Formula L = λW' (Operations Research 9(3), 1961)",
        "Google SRE — Service Level Objectives (sre.google/sre-book/service-level-objectives)",
        "Brandur Leach — Designing Robust and Predictable APIs with Idempotency (Stripe Engineering, 2017)"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u1l1",
          "title": "Requirements Are the Design",
          "estMinutes": 24,
          "content": [
            {
              "type": "text",
              "heading": "The design happens before the first box",
              "body": "Hand the same prompt — *design a photo-sharing app* — to two competent engineers and you can get two wildly different systems, both defensible. One builds a single Postgres instance behind a small API server; the other builds a sharded, cache-fronted, queue-buffered platform spanning three regions. Neither is wrong *in general*. Each is wrong *for some set of requirements* — and the entire difference between them is which requirements they assumed.\n\nThat is the first lesson of systems design, and it is the one most often skipped: **the load-bearing decisions are made during requirement extraction, not during architecture drawing**. A cache is not a good idea or a bad idea; it is an answer to a specific read-latency or read-volume requirement. Sharding is not \"what serious systems do\"; it is what systems whose dataset or write rate exceeds one machine do. Until the requirements are explicit and quantified, every component you draw is a guess wearing a diagram.\n\nSo the method this course teaches begins deliberately slowly: before any architecture, we extract two kinds of requirements, attach numbers to the second kind, and only then let the numbers tell us what the system must be."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Functional and non-functional requirements",
              "statement": "The **functional requirements** of a system are the behaviors it must exhibit: the operations users can perform, the data those operations read and write, and the rules relating them (\"users upload photos; followers see them in reverse-chronological order\"). The **non-functional requirements** are the qualities the system must maintain while exhibiting those behaviors, under load and under failure:\n\n• **Scale** — how many users, how many operations per second, how much data, and the growth rate.\n• **Latency** — how fast responses must be, stated at percentiles (p50/p99), not averages.\n• **Availability** — the fraction of time (or of requests) the system must succeed, e.g. 99.9%.\n• **Consistency** — how quickly and how uniformly readers must observe writes.\n• **Durability** — what data, once acknowledged, must never be lost.\n• **Cost** — the budget envelope the rest must fit inside.\n\nA non-functional requirement is usable only when **quantified**. \"Fast\" is not a requirement; \"p99 feed load under 500 ms\" is."
            },
            {
              "type": "text",
              "heading": "The interrogation",
              "body": "Requirement extraction is an interrogation of the prompt (or the product manager), and the questions are stable across almost every system. Who uses this, and how many of them are active daily? What are the two or three operations that dominate — and for each, how often does an active user perform it? What is the size of the objects involved — a 140-byte post, a 2 MB photo, a 100 MB video? What is the **read/write ratio** — for every write, how many reads happen? How fresh must reads be — must a follower see a photo the instant it is uploaded, or is a ten-second lag invisible? What happens if a request fails — is a retried upload annoying or catastrophic? What is the growth expectation over one to three years?\n\nTwo disciplines make the answers useful. First, **write the answers down as numbers**, even when you have to invent them — an invented, stated assumption (\"assume 1 in 10 daily users posts one photo per day\") can be checked and corrected; an unstated one silently shapes the whole design. Second, **rank the requirements**: every design trades qualities against each other, and you cannot make the trade until you know that, say, feed latency outranks feed freshness for this product. The ranked, quantified list is the actual specification. The prompt was just its compressed form."
            },
            {
              "type": "example",
              "heading": "Worked example: scoping Lens",
              "body": "Meet **Lens**, the running example of this course: a photo-sharing social network we will design at launch scale here and grow to a hundred million users by the closing units.\n\n**Functional requirements** (v1, extracted and deliberately trimmed): users upload photos with a caption; users follow other users; each user sees a reverse-chronological feed of photos from accounts they follow; users can like a photo. Explicitly deferred: comments, search, direct messages, stories.\n\n**Non-functional requirements**, interrogated into numbers: launch target **100,000 DAU**, product projection **1 M DAU within a year** — we design for 1 M and note the 100 k starting point. Assume 1 in 10 active users posts one photo per day (100 k photos/day at 1 M DAU), and each active user opens the feed 5 times a day, pulling ~20 photos per load. Photos average **2 MB** stored (after server-side compression), served as ~200 KB feed renditions. Latency: **p99 feed load < 500 ms**; upload may take seconds. Availability: **99.9%** (about 8.8 hours of downtime a year — honest for a v1). Consistency: a follower seeing a new photo **within ~10 seconds** is fine; like-counts may be approximate in real time; but an acknowledged upload must be **durable** — losing a user's photo is unacceptable. Ranked: durability > feed latency > availability > freshness.\n\nNotice how much design this paragraph already did: the 10-second freshness allowance will later permit asynchronous feed delivery; the durability ranking will force replicated storage before anything else scales; the 200 KB rendition figure will drive the entire bandwidth calculation."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "SLI, SLO, and percentile targets",
              "statement": "A **service level indicator (SLI)** is a measured quantity of service behavior — e.g. the fraction of feed requests answered successfully in under 500 ms over a rolling window. A **service level objective (SLO)** is a target for an SLI — e.g. \"99.9% of feed requests succeed within 500 ms over 30 days.\" Latency SLIs are stated at **percentiles**: p99 = 500 ms means 99% of requests complete within 500 ms. Percentiles are used because latency distributions are heavy-tailed — a mean of 80 ms is compatible with 1% of users waiting 4 seconds, and at 5 feed loads per day those users hit the tail weekly. The SLO is the contract the architecture must be derived against; \"as fast as possible\" derives nothing."
            },
            {
              "type": "text",
              "heading": "The read/write ratio is the first fork",
              "body": "Of all the numbers extracted, one does the most immediate work: the **read/write ratio**, because it tells you which half of the system to optimize and which half can afford to be expensive. Run it for Lens at 1 M DAU: writes are 100 k photo uploads plus perhaps 500 k likes and 50 k follows per day — order 650 k writes. Reads are 5 feed loads × 20 photos × 1 M users — order 100 M photo-views per day, plus profile visits. The ratio is roughly **150 reads per write**. Lens is overwhelmingly read-dominated, so the read path (feed assembly, photo delivery) is where latency work and, later, caching and precomputation will pay; the write path can afford heavier machinery per operation — synchronous replication for durability, image processing — because it runs 150× less often.\n\nContrast two other profiles you will meet in the canonical-design units. A group-chat system runs near **1:1** — every sent message is read by a handful of recipients, once — so neither path dominates and delivery latency rules both. A metrics/telemetry pipeline is **write-dominated**, thousands of writes per read, so its design centers on cheap, batched, append-only ingestion and its read path can be slow and analytical. Same method, three different systems — because the ratio forked them apart at the first junction."
            },
            {
              "type": "example",
              "heading": "Worked example: three prompts, three profiles",
              "body": "Practice the extraction on three classic prompts, ending each with the profile that will drive its design.\n\n**\"Design a URL shortener.\"** Functional: create short link → long URL; redirect on hit. Non-functional interrogation: assume 100 M new links/month (~40 writes/s) but 10 B redirects/month (~4,000 reads/s) — **100:1 read-dominated**; redirect latency must be low (it sits in front of every click, p99 < 100 ms); links must never resolve wrongly (correctness over freshness — a new link may take seconds to propagate); tiny objects (~500 bytes). Profile: enormous read QPS on tiny immutable objects → screams *cache aggressively, replicate widely*.\n\n**\"Design a group-chat app.\"** Functional: send message to conversation; members receive promptly; history persists. Non-functional: delivery latency is the product (< 1 s perceived); read/write near **1:1**; strict per-conversation ordering matters; presence/typing are ephemeral. Profile: latency- and connection-dominated → the hard part is delivering to online devices, not storing bytes.\n\n**\"Design a metrics pipeline.\"** Functional: services emit counters/gauges; engineers query dashboards and alerts. Non-functional: **10,000:1 write-dominated** (millions of points/s in, a few dashboard queries/s out); per-point loss tolerable, aggregate fidelity required; reads can lag by a minute. Profile: batched append-only ingestion, aggressive compression, precomputed rollups.\n\nThree prompts, one interrogation, three architectures already half-decided — before a single box was drawn."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Unstated requirements are still requirements — you just find out about them in production.** If Lens photos are private to followers, every later delivery decision changes: public CDN URLs become signed URLs, cacheability drops, and the feed must check authorization per item. Ask the awkward scoping questions (privacy? deletion? abuse? regulation?) during extraction, when the answer costs a sentence — not after launch, when it costs a migration."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "You now have the first stage of the method: interrogate the prompt into a functional list and a quantified, *ranked* non-functional list, compute the read/write ratio, and state every invented assumption out loud. Lens has its specification — 1 M DAU, 100 k uploads/day, 150:1 reads, p99 500 ms, 99.9% availability, durability above all. What the specification does not yet say is what any of this *costs* in machines, bytes, and bandwidth. Turning requirements into those numbers is the next lesson, *The Arithmetic of Scale* — the estimation discipline that decides which constraint binds first."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "You are handed the prompt \"design a ticketing system for concerts.\" Write the interrogation: list six questions whose answers would most change the architecture, and for each, say in one sentence *how* the answer changes it.",
                  "solution": "Strong answers include: (1) How many tickets go on sale at once, and how synchronized is demand? — an on-sale spike of 500 k users in one minute is a completely different system from steady trickle sales (queueing/waiting-room tier vs a plain web app). (2) Can we oversell and reconcile, or is overselling forbidden? — forbidden overselling forces strongly consistent inventory decrement, ruling out eventual consistency on the hot path. (3) What is the read/write ratio around an on-sale? — thousands of seat-map reads per purchase suggests aggressive caching of availability with a strict check at purchase time. (4) Are seats assigned or general admission? — assigned seats create per-seat contention (fine-grained locks/reservations); GA is a single counter. (5) What hold/timeout semantics apply to a cart? — reservations with TTL introduce expiry machinery and reclaim logic. (6) What are the latency and availability targets during the spike vs off-peak? — if on-sale availability is the product, capacity must be provisioned for the spike, or a queue must smooth it. Each question binds a specific component decision; that is what makes it worth asking.",
                  "hint": "Ask what happens at the worst minute of the system's life, and which failures the business can tolerate."
                },
                {
                  "prompt": "A document-collaboration product reports: 200 k DAU; each active user opens 4 documents/day and makes 60 edits/day; each open pulls the full document (~50 KB); each edit is ~200 bytes. Compute the read/write ratio by operation count and by bytes, and say which path (read or write) each ratio suggests optimizing.",
                  "solution": "Operations: reads = 200k × 4 = 800 k opens/day; writes = 200k × 60 = 12 M edits/day. Ratio ≈ 800k : 12M = **1:15 — write-dominated by count**. Bytes: read volume = 800k × 50 KB = 40 GB/day; write volume = 12M × 200 B = 2.4 GB/day — **~17:1 read-dominated by bytes**. Interpretation: the system handles far more write *operations* (so the edit-ingest path — accepting, ordering, and persisting many tiny edits — must be cheap per operation, likely batched/append-only), while *bandwidth* is dominated by document loads (so snapshotting/compaction to keep opens cheap matters). The two ratios disagree, and that disagreement is the insight: optimize the write path per-operation and the read path per-byte.",
                  "hint": "Compute the ratio twice — once counting operations, once counting bytes — and don't assume they agree."
                },
                {
                  "prompt": "Rewrite each vague requirement as a quantified SLO or target: (a) \"the feed should feel instant\", (b) \"the service should basically always be up\", (c) \"users shouldn't lose their drafts\", (d) \"it should handle a lot of users\".",
                  "solution": "(a) \"99% of feed requests complete in < 300 ms, 99.9% in < 1 s, measured server-side over 30 days\" — percentiles, threshold, window. (b) \"99.95% of requests succeed over a rolling 30 days\" (~22 minutes of full downtime/month) — availability as a request-success SLO with an explicit window. (c) \"An acknowledged draft save is durable across the loss of any single machine; drafts autosave every 5 s, so at most 5 s of typing is at risk\" — durability stated as a failure the data must survive plus a bounded loss window. (d) \"Support 2 M DAU at launch and 3× growth within 18 months without re-architecture; peak 5,000 requests/s\" — scale as numbers plus a growth envelope. The pattern each time: a measurable quantity, a threshold, and a window or failure scope.",
                  "hint": "Each rewrite needs a number, a unit, and a measurement window — 'fast' becomes a percentile, 'always up' becomes nines over a window."
                },
                {
                  "prompt": "For Lens as scoped in this lesson, the product team adds: \"photos can be deleted, and deletion must be effective immediately for legal takedowns.\" Which non-functional requirements does this create or change, and name one place in the eventual architecture where this requirement will fight another one.",
                  "solution": "It adds a **consistency/propagation requirement on deletes** that is much stricter than the 10-second eventual freshness we accepted for feed *inserts*: a takedown must stop being served promptly everywhere. It also adds a durability-adjacent requirement in reverse — provable *removal*, including from backups and derived copies, on a legal timescale. The fight: this collides with **caching and CDN delivery** on the read path. Feed renditions cached at edges for hours (great for the 150:1 read ratio) can keep serving a deleted photo after the origin removed it; meeting the takedown requirement means short TTLs, cache invalidation/purge machinery, or signed URLs with short expiry — all of which reduce cache efficiency. This is a textbook case of one quantified requirement (takedown latency) taxing the mechanism that another requirement (read latency at scale) depends on; the ranking between them is a product decision you must extract, not invent.",
                  "hint": "Deletion is a write that must propagate — ask which read-path optimizations assume content never changes."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u1l1-i1",
              "front": "Functional vs non-functional requirements — what's the difference?",
              "back": "Functional = the behaviors the system must exhibit (operations, data, rules). Non-functional = the qualities it must maintain under load and failure: scale, latency, availability, consistency, durability, cost — and they're only usable when quantified."
            },
            {
              "id": "u1l1-i2",
              "front": "Why state latency targets as percentiles rather than averages?",
              "back": "Latency distributions are heavy-tailed: a good mean can hide a terrible p99, and frequent users hit the tail regularly. p99 < 500 ms bounds the experience; a mean bounds almost nothing."
            },
            {
              "id": "u1l1-i3",
              "front": "What is an SLI vs an SLO?",
              "back": "SLI = a measured indicator of service behavior (e.g. fraction of requests under 500 ms). SLO = the target set on that indicator over a window (e.g. 99.9% over 30 days)."
            },
            {
              "id": "u1l1-i4",
              "front": "What does the read/write ratio decide in a design?",
              "back": "Which path to optimize: read-dominated systems (e.g. 150:1 like Lens) spend on the read path (caching, precomputation) and can afford expensive writes; write-dominated systems need cheap batched ingestion; ~1:1 systems (chat) are ruled by delivery latency."
            },
            {
              "id": "u1l1-i5",
              "front": "Why must invented assumptions be stated explicitly during scoping?",
              "back": "A stated assumption ('1 in 10 users posts daily') can be checked and corrected; an unstated one silently shapes the whole design and surfaces as a production surprise."
            }
          ]
        },
        {
          "id": "u1l2",
          "title": "The Arithmetic of Scale",
          "estMinutes": 26,
          "builds_on": [
            "u1l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "From requirements to load",
              "body": "*Requirements Are the Design* ended with Lens specified — 1 M DAU, 100 k uploads a day, 150 reads per write — but a specification is not yet a load. Before we can decide whether Lens needs one machine or a hundred, the requirements must become **rates and volumes**: queries per second, bytes stored per day, bits per second on the wire, requests in flight at once. This lesson is that translation, and it is deliberately unglamorous: multiplication, division, and aggressive rounding.\n\nThe purpose of the arithmetic is not precision — every input is an estimate — but **order of magnitude**. The design changes when a number crosses a power of ten: 50 requests/s and 80 requests/s are the same design; 50 and 5,000 are not. An estimate within 2–3× of reality, produced in two minutes with stated assumptions, is worth more than a spreadsheet of false precision, because it is *checkable*: every step is visible, so a reviewer can attack the assumption rather than the conclusion."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The capacity quantities",
              "statement": "Given DAU (daily active users), per-user action rates, and object sizes, the standard derived quantities are:\n\n• **Average QPS** for an action = (DAU × actions per user per day) / 86,400 s ≈ (DAU × actions) / 10⁵.\n• **Peak QPS** = average QPS × **peak factor** — the ratio of the busiest sustained period to the daily average; 2–3× for diurnal products, 5–10× for event-driven ones. Capacity is provisioned against peak, not average.\n• **Storage rate** = writes/day × object size; cumulative storage = rate × retention horizon (with growth factored in).\n• **Bandwidth** = (reads/day × bytes served per read) / 86,400, in bytes/s — multiply by 8 for bits/s on the wire.\n• **Working set** — the fraction of data that receives most of the reads (often approximated \"20% of data takes 80% of reads\"); it sizes caches, and it is usually *time-defined*: today's content is hot, last year's is cold."
            },
            {
              "type": "decision",
              "heading": "Latency numbers every designer carries (order of magnitude)",
              "rows": [
                [
                  "L1 cache reference",
                  "~0.5 ns"
                ],
                [
                  "Main-memory reference",
                  "~100 ns"
                ],
                [
                  "Read 1 MB sequentially from RAM",
                  "~0.25 ms"
                ],
                [
                  "SSD random read (4 KB)",
                  "~100 µs"
                ],
                [
                  "Read 1 MB sequentially from SSD",
                  "~1 ms"
                ],
                [
                  "Magnetic disk seek",
                  "~10 ms"
                ],
                [
                  "Round trip within a datacenter",
                  "~0.5 ms"
                ],
                [
                  "Round trip cross-continent (e.g. CA ↔ NL)",
                  "~150 ms"
                ],
                [
                  "Compress 1 KB (fast codec)",
                  "~2–10 µs"
                ]
              ]
            },
            {
              "type": "text",
              "heading": "Why those nine numbers matter",
              "body": "The table (descended from Jeff Dean's famous list, rounded for 2020s hardware) is not trivia — it is the physics your designs obey, and three gaps in it do most of the work. **Memory is ~1,000× faster than SSD random access, which is ~100× faster than a disk seek**: this single gradient explains why caching exists, why databases fight to keep indexes in RAM, and why an architecture that adds one extra disk-bound lookup per request just spent its entire latency budget. **A cross-continent round trip (~150 ms) is 300× a within-datacenter one (~0.5 ms)**: this is why a p99 of 500 ms allows exactly zero synchronous cross-region hops on the hot path, and why geo-distribution is a latency decision before it is an availability one. And **sequential beats random by orders of magnitude on every storage tier**: the deep reason (as Kleppmann develops at length) why write-heavy systems converge on append-only structures. Carry the table; every estimate in this course leans on it.\n\nOne more constant pulls its weight daily: **a day is 86,400 seconds ≈ 10⁵**. Dividing daily counts by 10⁵ turns them into per-second rates with one mental shift of the decimal point — the error (−14%) is far below the noise in your inputs."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "Little's Law",
              "statement": "For any system in steady state — arrivals balancing departures over the long run — the average number of items in the system L, the average arrival rate λ, and the average time each item spends in the system W satisfy\n\n  **L = λ × W.**\n\nThe law holds regardless of arrival distribution, service discipline, or internal structure; it needs only stationarity.",
              "proof": "Watch the system over a long interval of length T and count *item-seconds*: the total accumulated time-in-system summed over all items, call it A. Count it two ways.\n\n(1) By items: about λT items arrive during T (rate × time), and each spends on average W seconds inside, so A ≈ (λT) × W. Edge items that straddle the interval's boundaries contribute an error that stays bounded while A grows linearly in T, so the error vanishes in the ratio as T → ∞.\n\n(2) By time: at each instant t there are N(t) items inside, each accruing one item-second per second, so A = ∫₀ᵀ N(t) dt; dividing by T gives the time-average occupancy, A/T = L.\n\nEquating the two counts of the same quantity: L = A/T = λW. ∎\n\nThe design consequence: **concurrency = throughput × latency**. A service handling λ = 4,000 requests/s at W = 50 ms average holds L = 4,000 × 0.05 = 200 requests in flight at any moment — and that number, not QPS by itself, is what sizes thread pools, connection pools, and per-server memory for in-flight state."
            },
            {
              "type": "example",
              "heading": "Worked example: Lens by the numbers",
              "body": "Run the full estimate for Lens at the 1 M-DAU design point, using the assumptions stated in *Requirements Are the Design*.\n\n**Write path.** 1 in 10 active users posts daily → 100 k uploads/day → 100k / 10⁵ = **1 upload/s average, ~3/s peak** (diurnal factor 3). At 2 MB stored per photo: 100k × 2 MB = **200 GB/day of new media** → ~73 TB/year, call it **~100 TB/year** allowing growth headroom. Metadata is a rounding error beside it: 100 k rows/day of ~1 KB is 100 MB/day.\n\n**Read path.** 5 feed loads × 1 M users = 5 M feed requests/day → **~50 request/s average, ~150/s peak**. Each load renders 20 photos at ~200 KB → 5M × 20 × 200 KB = **20 TB/day of media egress** → 20 TB / 10⁵ s ≈ 200 MB/s average ≈ **1.6 Gbit/s sustained, ~5 Gbit/s peak**.\n\n**Working set.** If the hot content is roughly the last 3 days of uploads in feed rendition: 300 k photos × 200 KB ≈ **60 GB** — comfortably cacheable in the RAM of one large box.\n\nThree conclusions fall out before any architecture is drawn: request rates are *tiny* (hundreds/s peak — a fraction of one server); media *bytes* dominate everything (bandwidth and storage are the real load); and the hot working set is small. The shape of Lens v1 — small compute, serious storage, cache-friendly reads — was decided by ten lines of arithmetic."
            },
            {
              "type": "example",
              "heading": "Worked example: from QPS to servers",
              "body": "Now scale Lens to its unit-6 future — 100 M DAU — and size the feed-API fleet, to see how peak QPS becomes a machine count.\n\nFeed requests: 5 × 100 M = 500 M/day → 5,000/s average → **15,000/s peak** (factor 3). Suppose the feed endpoint's average service time is 50 ms. By **Little's Law**, peak in-flight requests L = λW = 15,000 × 0.05 = **750 concurrent requests** across the fleet.\n\nSuppose one application server comfortably sustains 100 concurrent requests before latency degrades (worker pool, memory, downstream connection limits). Then the fleet needs 750 / 100 ≈ 8 servers at full utilization. Nobody runs at full utilization: at a 60% target (headroom for spikes, deploys, and failures), 750 / (100 × 0.6) ≈ 12.5 → **13 servers**, and an N+2 policy for failure tolerance says **15**.\n\nRun the same logic on the database connections those servers hold: 15 servers × 100 workers = 1,500 potential concurrent DB conversations — which is why connection pooling (and eventually a shared pooler) appears in real deployments long before raw QPS looks scary. Note what did *not* size this fleet: average QPS. Peak concurrency did — throughput × latency, Little's Law, every time."
            },
            {
              "type": "text",
              "heading": "The estimation discipline",
              "body": "Good estimators follow a visible ritual, and reviewers grade the ritual as much as the result. **State assumptions first**, as numbers, before deriving anything — they are the part most worth attacking. **Round brutally**: powers of ten, one significant figure; 86,400 → 10⁵; 73 TB → 100 TB. Precision beyond one figure is noise laundering. **Carry units through every line** — QPS, GB/day, Gbit/s; the moment units go implicit, a ×8 (bytes vs bits) or ×86,400 error slips in unseen. **Sanity-check against a known anchor**: our 20 TB/day of Lens egress — is that plausible? A mid-size CDN customer, yes; if the arithmetic had said 20 PB/day, an assumption is broken, and the anchor catches it. **Then say what the numbers mean**: an estimate ends with a sentence like \"bandwidth dominates, compute is trivial\" — the arithmetic exists to name the binding constraint, which is the next lesson's subject."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Provision for peak, and know which peak.** The diurnal factor (2–3×) is the *floor* of peak thinking. Launches, marketing pushes, and virality produce 10× spikes; a ticket on-sale or a World Cup final produces 100× for minutes. Ask which of these the product must survive — surviving them is a requirement with a price tag, and 'the site was down during our biggest moment' is the most expensive sentence in the business."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A video platform expects 50 M DAU; each active user watches 30 videos/day; average video streamed is 50 MB after adaptive encoding. Estimate average and peak (×2) egress bandwidth in Gbit/s, showing every step.",
                  "solution": "Views: 50M × 30 = 1.5 B views/day. Bytes: 1.5B × 50 MB = 75 PB/day. Per second: 75 PB / 10⁵ s ≈ 750 GB/s average. In bits: 750 GB/s × 8 = **6 Tbit/s average**, peak ×2 ≈ **12 Tbit/s**. (Sanity anchor: this is small-national-ISP scale, which is plausible for a 50 M-DAU video product and is exactly why video platforms live behind massive CDNs — no origin serves this.) The step everyone forgets: ×8 for bits.",
                  "hint": "Daily bytes ÷ 10⁵ gives bytes/s; multiply by 8 for bits/s."
                },
                {
                  "prompt": "A messaging service has 20 M DAU sending 40 messages/day each, average message 100 bytes plus 200 bytes of metadata. Estimate: (a) average and peak (×3) write QPS; (b) storage for 5 years of messages. One significant figure throughout.",
                  "solution": "(a) Messages: 20M × 40 = 800 M/day → 800M / 10⁵ = **8,000 writes/s average**, peak ≈ **25,000/s** (8k × 3, rounded). (b) Per message stored: ~300 bytes. Daily: 800M × 300 B = 240 GB/day ≈ 250 GB/day. Five years: 250 GB × 365 × 5 ≈ 250 GB × 1,800 ≈ **450 TB** (one significant figure: ~500 TB). Observation worth stating: unlike Lens, here *row count* (800 M/day, ~1.5 T rows over 5 years) is as much of a problem as raw bytes — table and index design will bind before disk space does.",
                  "hint": "Storage = rate × horizon; 5 years ≈ 1,800 days."
                },
                {
                  "prompt": "An API fleet must sustain 24,000 requests/s at peak with an average service time of 120 ms. Each server degrades beyond 150 concurrent requests, and you target 60% utilization. Using Little's Law, compute the required server count (before redundancy).",
                  "solution": "In-flight requests: L = λW = 24,000 × 0.12 = **2,880 concurrent**. Per-server usable concurrency at 60% of 150 = 90. Servers: 2,880 / 90 = **32 servers**. (With an N+2 failure allowance you'd deploy 34.) The lesson embedded in the numbers: at 120 ms of service time, concurrency is 2.4× what it would be at 50 ms — latency on the hot path costs machines linearly, which is why shaving W is a capacity strategy, not just a UX one.",
                  "hint": "L = λW gives fleet-wide concurrency; divide by usable per-server concurrency."
                },
                {
                  "prompt": "Your monitoring shows a service holding a steady 600 requests in flight while serving 3,000 requests/s. The team claims p50 latency is 40 ms. Are the three numbers consistent? What exactly can you conclude, and what can't you?",
                  "solution": "Little's Law gives the *average* time in system: W = L/λ = 600 / 3,000 = **200 ms**. That is consistent with a p50 of 40 ms only if the distribution has a heavy tail — e.g. most requests at ~40 ms and a small fraction taking many seconds, dragging the mean to 200 ms. So the numbers don't contradict the p50 claim, but they *prove* the mean is 200 ms, and a mean 5× the median is a red flag for a severe tail (p99 likely in seconds). What you can't conclude: any specific percentile — Little's Law is distribution-free and yields only the average. Next diagnostic step: pull the latency histogram; the tail, not the median, is where the 160 ms is hiding.",
                  "hint": "Little's Law gives W as an average. Compare the implied average to the claimed median."
                },
                {
                  "prompt": "Lens at 1 M DAU stores 200 GB/day of new media. The product adds 30-second videos: assume 1 in 50 active users posts one 25 MB video daily. Recompute daily media storage and state whether video changes the binding constraint identified in this lesson.",
                  "solution": "Videos: 1M / 50 = 20 k/day × 25 MB = **500 GB/day**, versus photos' 200 GB/day — video is instantly 2.5× the entire photo product, from a fiftieth of the users. New total ≈ **700 GB/day ≈ 250 TB/year**. Egress moves the same way if videos are watched (a single feed autoplay of even a fraction of views multiplies the 20 TB/day figure). The binding constraint doesn't change in *kind* — bytes already dominated compute — but it hardens by ~3.5×, which pulls forward every consequence: dedicated blob storage, CDN offload, and transcoding-pipeline capacity stop being 'later' items. The general lesson: media features move the numbers by multiples, not percents; re-run the arithmetic on every feature that changes object size.",
                  "hint": "Compare the new daily video bytes to the existing 200 GB/day before concluding anything."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u1l2-i1",
              "front": "Average QPS from DAU and per-user daily actions — the formula?",
              "back": "QPS ≈ (DAU × actions per user per day) / 10⁵ (a day is 86,400 s ≈ 10⁵). Multiply by a peak factor (2–3× diurnal, 5–10× event-driven) for provisioning."
            },
            {
              "id": "u1l2-i2",
              "front": "Little's Law — statement and the design quantity it yields",
              "back": "L = λW: average items in system = arrival rate × average time in system. Design form: concurrency = throughput × latency — it sizes thread pools, connection pools, and fleets; holds for any arrival/service distribution in steady state."
            },
            {
              "id": "u1l2-i3",
              "front": "Roughly how do RAM, SSD random read, and disk seek latencies compare?",
              "back": "RAM reference ~100 ns; SSD random read ~100 µs (≈1,000× RAM); disk seek ~10 ms (≈100× SSD). This gradient is why caches and in-RAM indexes exist."
            },
            {
              "id": "u1l2-i4",
              "front": "Cross-continent vs within-datacenter round trip — magnitudes?",
              "back": "~150 ms cross-continent vs ~0.5 ms in-DC (≈300×). A sub-second latency SLO permits no synchronous cross-region hops on the hot path."
            },
            {
              "id": "u1l2-i5",
              "front": "What is the working set and what does it size?",
              "back": "The fraction of data receiving most reads (often time-defined: recent = hot). It sizes caches — e.g. Lens's last-3-days renditions ≈ 60 GB, cacheable in one box's RAM."
            },
            {
              "id": "u1l2-i6",
              "front": "The four habits of a defensible estimate?",
              "back": "State assumptions as numbers first; round to one significant figure / powers of ten; carry units on every line; sanity-check against a known anchor — then name the binding constraint."
            }
          ]
        },
        {
          "id": "u1l3",
          "title": "One Machine First",
          "estMinutes": 22,
          "builds_on": [
            "u1l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The null hypothesis of systems design",
              "body": "*The Arithmetic of Scale* left Lens quantified: hundreds of requests per second at peak, 200 GB of new media a day, a 60 GB hot set. The next move in the method is a test most designs skip, to their cost: **assume one machine, and let the numbers falsify it**. The single server is the null hypothesis; distribution must reject it with evidence.\n\nThe reason is not aesthetic minimalism. Every machine boundary you introduce converts function calls into network calls — which can fail independently, arrive out of order, or time out ambiguously — and converts one consistent memory into several inconsistent ones. That complexity is *paid for continuously*: in engineering time, in failure modes, in debugging difficulty. Modern hardware makes the null hypothesis embarrassingly strong: a commodity server in the 2020s carries dozens of cores, hundreds of gigabytes to terabytes of RAM, NVMe storage serving hundreds of thousands of random IOPS, and a 10–100 Gbit NIC. Entire successful companies run on a handful of such boxes. The question is never *could we distribute this* — it is *which number forces us to*."
            },
            {
              "type": "decision",
              "heading": "What one commodity server does (order of magnitude, 2020s)",
              "rows": [
                [
                  "CPU cores",
                  "32–128"
                ],
                [
                  "RAM",
                  "256 GB – 2 TB"
                ],
                [
                  "NVMe storage",
                  "10–100 TB, ~10⁵–10⁶ random IOPS"
                ],
                [
                  "Network",
                  "10–100 Gbit/s"
                ],
                [
                  "Static HTTP serving (nginx-class)",
                  "~10⁵ requests/s"
                ],
                [
                  "Relational DB, simple indexed queries",
                  "~10⁴–5×10⁴ transactions/s"
                ],
                [
                  "In-memory KV (Redis-class)",
                  "~10⁵ ops/s per core"
                ],
                [
                  "Concurrent open connections",
                  "~10⁵–10⁶ with an event-driven server"
                ]
              ]
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Binding constraint",
              "statement": "For a system under a stated load, the **binding constraint** is the resource that saturates first as load approaches its target: CPU, memory, storage capacity, storage IOPS, network bandwidth, connection count — or an external limit such as availability or geographic latency that no amount of one machine's resources can satisfy. The design move of this course is always: *identify the binding constraint, add the smallest component that relieves it, then recompute* — because relieving one constraint exposes the next. A component that relieves no binding constraint is decoration."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "Redundancy arithmetic (why availability forces two machines)",
              "statement": "Let a single machine be available a fraction a of the time (its uptime probability at any moment), and let a second, identical machine fail **independently**. A pair where either machine can serve (failover) has availability\n\n  A = 1 − (1 − a)² ,\n\nso two 99% machines yield 99.99%, and in general redundancy multiplies *unavailabilities*: n-way redundancy gives 1 − (1 − a)ⁿ.",
              "proof": "The pair is unavailable only when both machines are simultaneously down. Machine 1 is down with probability (1 − a); independently, machine 2 is down with probability (1 − a); by independence the joint probability is their product, (1 − a)². Availability is the complement: A = 1 − (1 − a)². For a = 0.99: A = 1 − (0.01)² = 1 − 0.0001 = 0.9999. The n-machine case is identical: all n down has probability (1 − a)ⁿ, so A = 1 − (1 − a)ⁿ. ∎\n\nThe caveat is as important as the formula: the proof *consumed* independence. Machines sharing a rack, a power feed, a bad deploy, or a poisoned config do not fail independently, and correlated failure collapses the product — two 99% machines that always fail together are a 99% pair. Real availability engineering is mostly the pursuit of independence (separate racks, zones, deploy waves), with the multiplication as the reward."
            },
            {
              "type": "example",
              "heading": "Worked example: Lens v1 refuses to be distributed (mostly)",
              "body": "Apply the test to Lens at launch scale, 100 k DAU (a tenth of the design-point numbers from *Lens by the numbers*): ~15 feed requests/s peak, ~0.3 uploads/s, 20 GB/day of new media, 2 TB/year, hot set ~6 GB.\n\n**Compute?** 15 QPS against a server that handles tens of thousands: idle. **Memory?** The 6 GB hot set fits in RAM 50 times over. **IOPS?** Hundreds of lookups/s against ~10⁵ NVMe IOPS: idle. **Bandwidth?** Peak media egress ~500 Mbit/s against a 10 Gbit NIC: fine. The load numbers reject nothing — Lens v1 is, computationally, a small system.\n\nTwo requirements *do* reject the single box, and neither is throughput. **Availability 99.9%**: one machine with OS patches, disk failures, and deploys realistically delivers ~99–99.5%; the redundancy theorem says a failover pair of 99% machines reaches 99.99% — so the SLO, not the load, pays for the second server and a replicated database. **Durability**: acknowledged photos must survive a disk failure, so media goes to storage that is itself replicated — a blob/object store (three copies or erasure coding) rather than the app server's disk; and at 2 TB/year, local disk would also fill within a few years, making the object store the growth answer too.\n\nLens v1, honestly derived: two app servers behind a load balancer, a primary database with one replica, an object store for media. Perhaps five boxes — every one paid for by a named requirement, none by fashion."
            },
            {
              "type": "diagram",
              "kind": "graph",
              "directed": true,
              "height": 300,
              "caption": "Lens v1 — every component paid for: the LB and second app server by the 99.9% SLO, the DB replica by the same SLO plus durability, the object store by media durability and growth. No caches, no shards, no queues — nothing in the arithmetic paid for them yet.",
              "nodes": [
                {
                  "id": "c",
                  "label": "Clients",
                  "x": 6,
                  "y": 50,
                  "tone": "gold"
                },
                {
                  "id": "lb",
                  "label": "LB",
                  "x": 24,
                  "y": 50
                },
                {
                  "id": "a1",
                  "label": "App 1",
                  "x": 42,
                  "y": 30
                },
                {
                  "id": "a2",
                  "label": "App 2",
                  "x": 42,
                  "y": 70
                },
                {
                  "id": "db",
                  "label": "DB primary",
                  "x": 66,
                  "y": 30,
                  "tone": "sage"
                },
                {
                  "id": "dbr",
                  "label": "DB replica",
                  "x": 88,
                  "y": 30,
                  "tone": "sage"
                },
                {
                  "id": "obj",
                  "label": "Object store (media ×3)",
                  "x": 66,
                  "y": 74,
                  "tone": "sage"
                }
              ],
              "edges": [
                {
                  "from": "c",
                  "to": "lb",
                  "label": "HTTPS"
                },
                {
                  "from": "lb",
                  "to": "a1"
                },
                {
                  "from": "lb",
                  "to": "a2"
                },
                {
                  "from": "a1",
                  "to": "db",
                  "label": "SQL"
                },
                {
                  "from": "a2",
                  "to": "db"
                },
                {
                  "from": "db",
                  "to": "dbr",
                  "label": "replication",
                  "dashed": true
                },
                {
                  "from": "a1",
                  "to": "obj",
                  "label": "media",
                  "bold": true
                },
                {
                  "from": "a2",
                  "to": "obj"
                }
              ]
            },
            {
              "type": "example",
              "heading": "Worked example: the design review that says no",
              "body": "A B2B analytics SaaS — 5,000 customer accounts, 200 requests/s peak, 800 GB dataset growing 300 GB/year, 99.9% SLO — proposes: six microservices, Kafka between them, a Redis cluster, and a sharded database, \"so we're ready to scale.\"\n\nRun the method against the proposal. 200 QPS peak: ~1% of one database server's capacity. 800 GB: fits in the *RAM* of a large box, let alone its disk; +300 GB/year means a decade of headroom on one NVMe drive. Hot set: fits in the database's own buffer pool, which is a cache the team gets for free — the Redis cluster relieves no measured constraint. Kafka between six services: the services exist only because the diagram did; at this scale, module boundaries inside one deployable give the same separation with function calls, one deploy, and one debugger. Sharding: relieves a dataset/write constraint that is twenty years away at current growth.\n\nWhat the numbers *do* pay for: the 99.9% SLO → two app servers and a DB replica with failover (the redundancy theorem again); backups and a tested restore for durability; and — the honest scaling story — a clean modular monolith whose seams *could* become services if a number someday binds. The review's verdict is one sentence: **name the constraint each component relieves, and every component that has no answer comes off the diagram.**"
            },
            {
              "type": "callout",
              "tone": "danger",
              "body": "**Premature distribution is not a conservative bet — it is a purchase of guaranteed complexity against a speculative need.** Every network boundary adds partial-failure modes (timeouts, retries, inconsistency) that a function call does not have, and those costs are paid every day whether or not the anticipated scale ever arrives. Meanwhile the *actual* v1 risks — a bad deploy, a lost disk, no tested restore — are availability and durability problems that redundancy and backups fix for a fraction of the cost. Scale out when a number binds; until then, the boring architecture is the strong one."
            },
            {
              "type": "text",
              "heading": "The forcing functions, named",
              "body": "What is now established: the single machine (plus its redundant twin) is the baseline, and exactly four forcing functions justify leaving it, each detectable in the arithmetic of the previous lesson. **Throughput** — sustained load beyond what one box serves (the first true scale-out force, answered by stateless app tiers behind load balancers). **Dataset** — data or IOPS beyond one box's storage (answered by partitioning, unit 2). **Availability** — SLOs beyond one box's uptime, the force that already fired for Lens (answered by redundancy and replication). **Latency/geography** — users too far from the machine for the SLO's round-trip budget (answered by edge caching in unit 3 and, in the extreme, multi-region designs). Every architecture in this course is some subset of answers to these four forces; when the next lessons add components, each will arrive stamped with the force that paid for it. First, though, one more piece of v1 must be fixed while it is still cheap to fix: the API contract — the next lesson."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A single machine offers 99.5% availability. (a) What availability does an independent failover pair achieve? (b) How many independent 99.5% machines are needed to exceed 99.999%? (c) The two machines share one top-of-rack switch with 99.9% availability — what is the pair's availability now?",
                  "solution": "(a) A = 1 − (0.005)² = 1 − 0.000025 = **99.9975%**. (b) Need (0.005)ⁿ < 10⁻⁵: n = 2 gives 2.5×10⁻⁵ (not enough); n = 3 gives 1.25×10⁻⁷ → **three machines** (99.9999875%). (c) The switch is a serial dependency: everything works only if the switch works AND the pair works: 0.999 × 0.999975 ≈ **99.897%** — the shared switch drags the pair below its own 99.9%, erasing almost all the redundancy gain. Moral: availability multiplies through *independent parallel* paths but is capped by every *shared serial* dependency; the switch must be made redundant too (and this is why 'independent' means separate racks, power, and network paths).",
                  "hint": "Parallel independent redundancy: 1 − ∏(1−aᵢ). Serial dependency: multiply availabilities."
                },
                {
                  "prompt": "Using the single-server capacity table, decide for each load whether one machine (plus a failover twin) plausibly suffices, naming the resource that binds or clears: (a) 3,000 indexed reads/s on a 100 GB dataset; (b) 40,000 writes/s of 1 KB events with 2-year retention; (c) 500 requests/s where each request scans ~1 GB of data.",
                  "solution": "(a) 3,000 QPS vs ~10⁴–5×10⁴ DB capacity: clears with margin; 100 GB fits in RAM. **One machine suffices**; nothing binds. (b) 40 k writes/s is at/above the ~10⁴–5×10⁴ transactional ceiling — marginal on QPS — but compute storage: 40k × 1 KB = 40 MB/s ≈ 3.5 TB/day ≈ **2.5 PB for 2 years**, vs ~100 TB max per box. **Storage capacity binds** long before write QPS; this forces partitioning (unit 2) regardless of how fast one box ingests. (c) Bandwidth of the scans: 500 × 1 GB = 500 GB/s of data movement — two orders of magnitude beyond RAM bandwidth (~tens of GB/s) and three beyond NVMe. **Memory/storage bandwidth binds catastrophically**; no single machine, and honestly no naive fleet, serves this — the design must change the *work* (precompute, index, or aggregate) rather than add machines. Part (c)'s lesson: sometimes the arithmetic rejects not the machine but the algorithm.",
                  "hint": "For each: compute the implied IOPS, bytes, and bandwidth, then compare row by row against the capacity table."
                },
                {
                  "prompt": "Your team proposes adding a Redis cache in front of the database for a service doing 800 reads/s with a p99 of 45 ms against a 200 ms SLO, dataset 50 GB, database CPU at 15%. Argue for or against, using this lesson's method.",
                  "solution": "Against. Run the test: which binding constraint does the cache relieve? Latency: p99 45 ms is 4× inside the 200 ms SLO — no latency requirement is unmet. Throughput: 800 QPS at 15% DB CPU means ~5× headroom before the database even breathes hard — and the 50 GB dataset likely sits in the DB's buffer pool already (a free in-RAM cache). The cache relieves nothing measured; it *adds* an invalidation problem (stale reads after writes), a new failure mode (cache down → thundering herd on the DB, or serving stale data), operational surface, and a second copy of truth. Verdict: decoration — remove it, and write down the trigger that would change the answer ('cache when p99 approaches the SLO or DB CPU passes ~60% at peak'), so the future decision is made by a number, not a mood.",
                  "hint": "Ask what number is currently violated or near violation. If none, what does the component cost?"
                },
                {
                  "prompt": "Lens's product team decides launch is Europe-only, but 20% of expected users are in Australia (~280 ms round trip). The p99 feed SLO is 500 ms, and a feed load makes 1 HTTPS request for the feed page plus parallel fetches of 20 image renditions. Does geography force distribution for these users? Show the latency budget.",
                  "solution": "Budget one Australian feed load: TLS+TCP setup to Europe costs multiple round trips even with modern stacks (say 1 RTT with TLS 1.3 resumption, more cold), then 1 RTT for the feed request ≈ 280 ms, leaving ~220 ms of the 500 ms budget. The 20 image fetches run in parallel over the warm connection, but each still pays the 280 ms base RTT: total ≈ 280 (feed) + 280 (parallel images) + server time ≈ **600+ ms p50, worse at p99** — the SLO is unmeetable from Europe alone; physics, not load, binds. The forced component is **latency/geography relief for static media**: an edge cache/CDN serving renditions from Australia (~20–30 ms RTT) collapses the image term; the dynamic feed request itself (280 ms) still fits inside 500 ms. So: CDN for media now; full multi-region app/data comes only if the *dynamic* path's budget breaks. This is forcing function four firing on exactly one component class — and a preview of unit 3.",
                  "hint": "Count round trips on the critical path; multiply by 280 ms; compare to 500 ms. Which requests can an edge serve without the origin?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u1l3-i1",
              "front": "What is the 'one machine first' test?",
              "back": "The single server is the null hypothesis; distribution must be justified by a number that falsifies it. Every network boundary buys partial-failure complexity that is paid continuously — so each component must relieve a named binding constraint."
            },
            {
              "id": "u1l3-i2",
              "front": "Binding constraint — definition and the design move it drives",
              "back": "The resource that saturates first as load approaches target (CPU, RAM, storage bytes/IOPS, bandwidth, connections — or availability/geography). Move: relieve it with the smallest component, then recompute; the next constraint surfaces."
            },
            {
              "id": "u1l3-i3",
              "front": "Availability of n independent machines each available a?",
              "back": "A = 1 − (1−a)ⁿ — redundancy multiplies unavailabilities. Two 99% machines → 99.99%. Only holds under independent failure: shared racks, switches, deploys, or config collapse the product."
            },
            {
              "id": "u1l3-i4",
              "front": "The four forcing functions that justify leaving one machine?",
              "back": "Throughput (load beyond one box → stateless tier + LB), dataset (bytes/IOPS beyond one box → partitioning), availability (SLO beyond one box's uptime → redundancy/replication), latency-geography (users too far → edge/CDN, multi-region)."
            },
            {
              "id": "u1l3-i5",
              "front": "Which requirements forced Lens v1 off a single machine, and what did they pay for?",
              "back": "Not load (15 QPS peak). The 99.9% SLO paid for the second app server, LB, and DB replica; media durability + growth paid for the replicated object store. Five boxes, each named by a requirement."
            }
          ]
        },
        {
          "id": "u1l4",
          "title": "The Contract: APIs, Pagination, and Idempotency",
          "estMinutes": 24,
          "builds_on": [
            "u1l1",
            "u1l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The part of v1 you cannot cheaply change",
              "body": "*One Machine First* settled Lens v1's shape: five boxes, each paid for. Everything inside those boxes — the framework, the schema, even the database — can be swapped later behind the walls. One thing cannot: the **API contract**, the surface that clients program against. Once a thousand mobile builds and three partner integrations depend on an endpoint's shape, changing it means coordinating strangers, and mistakes fossilize. So the method fixes the contract *before* scaling anything, while a breaking change costs one code review.\n\nA contract has to answer four questions precisely. What are the **resources and operations** — the nouns and verbs? How does a client **traverse large collections** — pagination? What happens when a client **retries** — because on a network, every client eventually retries? And how does the contract **evolve** — versioning? The first question is taste and convention; this lesson spends its rigor on the middle two, because retries and pagination are where correctness bugs live, and both have exact answers."
            },
            {
              "type": "text",
              "heading": "Resources, verbs, and error semantics",
              "body": "The dominant convention — resource-oriented HTTP — models the system as nouns with standard verbs: `GET` reads, `POST` creates, `PUT`/`PATCH` replaces or amends, `DELETE` removes. Its virtue is not elegance but **predictability under the semantics clients assume**: `GET` and `PUT` and `DELETE` are conventionally *safe to retry*, `POST` is not — and load balancers, proxies, and client SDKs are built on those assumptions, retrying and caching accordingly. Fighting the convention (mutating state in a `GET`) breaks invisible machinery.\n\nErrors carry the same discipline: `4xx` means *the client's request is wrong — do not retry unchanged* (400 malformed, 401/403 identity, 404 absent, 409 conflict, 422 semantically invalid); `5xx` means *the server failed — retrying may help*; and `429` means *slow down*, carrying a `Retry-After` hint. A client can be written against these semantics without reading any documentation — which is the point of semantics. Internal RPC systems (gRPC and kin) trade the uniform verb set for typed procedure calls and get the same benefits from status-code conventions; the design questions of this lesson — retries, pagination, evolution — apply identically there."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Idempotency and idempotency keys",
              "statement": "An operation is **idempotent** if performing it more than once has the same effect on system state as performing it exactly once: f(f(s)) = f(s) for every state s. `PUT /users/42/follows/7` (set a follow edge) and `DELETE /photos/9` are naturally idempotent; \"create a new photo\" and \"charge the card\" are not — each repetition creates a new effect.\n\nAn **idempotency key** converts a non-idempotent operation into an idempotent one: the client attaches a unique token (e.g. a UUID minted per logical attempt) to the request; the server remembers, per key, the outcome of the first execution and replays that stored outcome — without re-executing — for any subsequent request bearing the same key."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Retry safety (effectively-once from at-least-once)",
              "statement": "Suppose (1) the client retries a request, with the same idempotency key, until it observes a response; (2) the server, atomically with the operation's effect, records (key → result) — i.e. effect and record commit together or not at all; (3) any request whose key is already recorded returns the stored result without re-executing. Then no matter how many duplicate deliveries occur, the operation's effect is applied **exactly once**, and the client eventually observes its result.",
              "proof": "Existence (at least once): the client retries until it receives a response; a response is only produced either by executing the operation (recording the key) or by replaying a recorded result, and a result can only be recorded by an execution — so at least one execution occurs once any response is observed.\n\nUniqueness (at most once): suppose two requests with the same key both execute the operation. Each execution commits the (key → result) record atomically with its effect. Whichever commits first leaves the key recorded; by assumption (3), any later request with that key is served the stored result *instead of executing*. For the second execution to have occurred, the key must not have been recorded when it committed — but records are atomic with effects, so two commits of the same key cannot both find it absent unless the check-and-commit is not atomic, contradicting (2). (In practice (2) is a uniqueness constraint on the key inside the same transaction as the effect: the second commit aborts.) Hence exactly one execution's effect persists, and every response the client sees reports that one result. ∎\n\nThe assumptions are the engineering checklist: keys must be *per logical attempt* (a new key for a genuinely new upload), the record must be in the *same* transaction as the effect (a cache 'in front of' the database reintroduces the race), and records must be retained for the retry horizon."
            },
            {
              "type": "code",
              "heading": "The idempotent upload, end to end",
              "lang": "text",
              "code": "Client (per logical upload, mint ONE key, reuse it for every retry):\n\n  POST /v1/photos HTTP/1.1\n  Idempotency-Key: 7f3a9c2e-...-d41c\n  Content-Type: multipart/form-data\n  { caption, image bytes }\n\nServer handler (single transaction around effect + key record):\n\n  BEGIN;\n    row = SELECT * FROM idempotency_keys WHERE key = :key FOR UPDATE;\n    IF row EXISTS:\n      COMMIT; RETURN row.stored_response;        -- replay, no re-execution\n    photo_id = INSERT INTO photos(...);           -- the effect\n    INSERT INTO idempotency_keys(key, stored_response)\n      VALUES (:key, {201, photo_id});             -- atomic with the effect\n  COMMIT;\n  RETURN {201 Created, photo_id};\n\nFailure walk-through:\n  - response lost in transit → client retries same key → replay branch → same photo_id, no duplicate\n  - server crashes BEFORE commit → nothing recorded, nothing inserted → retry executes fresh\n  - server crashes AFTER commit → key recorded → retry replays stored 201\n  - two concurrent retries → row lock (FOR UPDATE) serializes them; second sees the record"
            },
            {
              "type": "text",
              "heading": "Pagination: why offset breaks",
              "body": "Every collection endpoint — Lens's feed above all — needs pagination, and the obvious design is the broken one. **Offset pagination** (`?offset=200&limit=20`) fails twice. First, *performance*: the database must walk and discard 200 rows to return 20; cost grows linearly with depth, and deep pages become accidental table scans — page 5,000 of a hot feed is a denial-of-service you built yourself. Second, *correctness under mutation*: offsets address *positions*, and positions move. If three photos arrive at the top of the feed between a client's page-1 and page-2 requests, rows 18–20 of the old page 1 are now at offsets 21–23 — page 2 re-serves them (duplicates); deletions shift the other way (items silently skipped).\n\n**Cursor (keyset) pagination** fixes both by addressing *values* instead of positions: each page returns an opaque cursor encoding the sort key of its last item (for Lens, `(created_at, photo_id)` — the id breaks ties); the next request says `?cursor=...&limit=20`, and the server runs `WHERE (created_at, photo_id) < (:t, :id) ORDER BY created_at DESC, photo_id DESC LIMIT 20` — an indexed seek, O(log n) regardless of depth, and stable under concurrent inserts and deletes because a value-anchor doesn't move when rows are added above it. The cursor is *opaque* (encoded, signed if needed) so clients cannot construct or manipulate positions the server didn't issue — which also keeps the server free to change the encoding later."
            },
            {
              "type": "example",
              "heading": "Worked example: the shifting feed, row by row",
              "body": "Lens's feed, newest first, currently: P20, P19, P18, … P1 (P20 newest). A client requests page 1, limit 5 → **P20 P19 P18 P17 P16**.\n\nBefore the next request, two new photos P21, P22 are posted.\n\n**Offset client** asks `offset=5&limit=5`. The collection is now P22 P21 P20 … — positions 0–4 are P22 P21 P20 P19 P18, so offset 5 yields **P17 P16 P15 P14 P13**: the client sees P17 and P16 *again* (duplicates at every page boundary where inserts occurred). Had two photos been *deleted* instead, offset 5 would skip two items the client never saw — invisible loss, the worse failure.\n\n**Cursor client** holds the cursor from page 1: `(P16.created_at, P16.id)`. It asks for items strictly older than that anchor → **P15 P14 P13 P12 P11**: no duplicates, no skips; the new P21/P22 simply don't disturb an anchor below them (the client can fetch *newer* items later with a reversed query from its top anchor).\n\nOne subtlety earns a sentence: the sort key must be **unique** — `created_at` alone collides when two photos share a timestamp, making 'strictly older' ambiguous and dropping one of the twins; appending the id `(created_at, photo_id)` restores a total order. This two-column tiebreak is load-bearing, and forgetting it is the classic cursor bug."
            },
            {
              "type": "example",
              "heading": "Worked example: the Lens v1 contract",
              "body": "The full v1 surface, with each choice annotated by the rule that made it:\n\n• `POST /v1/photos` + `Idempotency-Key` — creates are non-idempotent, so the key is *required*; returns `201` with the photo resource. Upload proceeds as metadata + a signed object-store upload URL, keeping multi-megabyte bodies off the API tier (the arithmetic of *Lens by the numbers*: bytes dominate).\n• `GET /v1/feed?cursor=&limit=` — cursor pagination on `(created_at, photo_id)`; limit capped at 50 server-side (an uncapped limit is an invitation to fetch the table).\n• `PUT /v1/users/{id}/follows/{target}` and `DELETE` of the same path — follow/unfollow as *state-setting* verbs: naturally idempotent, safely retried bare. Double-follow is impossible by construction, no key machinery needed.\n• `PUT /v1/photos/{id}/likes/me` / `DELETE` — same pattern; the like-count is derived state, never client-set.\n• Errors: `429` with `Retry-After` on rate limits; `409` for conflicting concurrent edits; every `5xx` safe to retry *because every mutating endpoint is idempotent* — the contract's retry story is uniform, which is the whole point.\n• `/v1/` in the path — versioning by URL: crude, visible, and sufficient; additive changes (new optional fields) don't bump it, breaking changes do, and the old version keeps working during a deprecation window measured in months.\n\nNotice the design pressure idempotency exerted on the *verbs*: where an operation could be phrased as 'set this state' (`PUT`) rather than 'append an event' (`POST`), the contract chose `PUT` and got retry-safety for free."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "Unit 1's method is now complete, and it is a loop you can run on any prompt: **interrogate** requirements into ranked numbers → **compute** rates, bytes, and concurrency → **test the single machine** and name what binds → **fix the contract** while it is cheap. The gate for this unit hands you an unfamiliar product and asks for exactly these four artifacts — and every unit after this one starts the loop where this unit leaves off, with a constraint the arithmetic says is binding."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Classify each operation as naturally idempotent, idempotent only with a key, or idempotent by re-phrasing (give the re-phrasing): (a) 'add item X to cart'; (b) 'set item X's quantity to 3'; (c) 'apply a $10 credit to the account'; (d) 'mark notification N as read'; (e) 'append a comment to a thread'.",
                  "solution": "(a) Not idempotent as stated (retry → duplicate cart line). Re-phrase to (b)-style: `PUT /cart/items/X {quantity: n}` — set-semantics, naturally idempotent. (b) **Naturally idempotent**: setting quantity to 3 twice leaves 3. (c) **Requires a key**: 'apply $10' is inherently additive; no set-phrasing preserves its meaning (setting balance is wrong under concurrency), so an idempotency key per credit event is the fix. (d) **Naturally idempotent**: read is a state, marking twice is once. (e) **Requires a key**: appends create new entities per call; the key (or a client-supplied comment id, which is the same idea) deduplicates retries. The pattern: *state-setting* survives retries bare; *additive/creative* operations need a key — and where the product allows, prefer phrasing mutations as state-setting.",
                  "hint": "Ask of each: does running it twice from the same start state end in the same state?"
                },
                {
                  "prompt": "A payments API records idempotency keys in Redis (checked before executing, written after the charge succeeds, 24 h TTL) while charges commit in Postgres. A customer was double-charged during an incident. Explain two distinct failure sequences this design permits, and state the fix.",
                  "solution": "Sequence 1 — *non-atomic record*: server executes the charge (Postgres commit) then crashes before writing the key to Redis. Client retries; Redis has no key; the charge executes again. The check and the effect live in different systems, so the proposition's assumption (2) — record atomic with effect — is violated. Sequence 2 — *racing duplicates*: two retries arrive concurrently; both check Redis, both find the key absent (neither has written yet), both charge. Check-then-act without atomicity is a classic TOCTOU race. (A third: Redis eviction or the 24 h TTL expiring under a longer retry horizon — the record must outlive retries.) Fix: move the key into **Postgres, in the same transaction as the charge**, with a uniqueness constraint on the key — the second committer aborts on the constraint, and concurrent duplicates serialize on the row. Redis may remain as a fast-path cache *in front of* the authoritative record, never as the record.",
                  "hint": "Compare the design against each assumption of the retry-safety proposition — which two are broken?"
                },
                {
                  "prompt": "A leaderboard API paginates by descending score with `?cursor=(score, user_id)`. Scores change frequently. A client paging through ranks 1–100 complains of seeing the same user on two pages and missing another entirely. Is this the offset bug again? Can cursor pagination fix it here — and if not, what can?",
                  "solution": "It is the same *phenomenon* (mutation during traversal) but not the same *bug*. Cursor pagination guarantees stability only when the **sort key of already-seen rows doesn't change**. Here the sort key (score) is itself volatile: a user seen on page 1 whose score drops below the cursor anchor reappears on page 3 (duplicate); a user whose score rises above the anchor after the client passed is never seen (skip). No cursor scheme over a mutating key can prevent this — the 'collection' being paged doesn't hold still. Fixes change the model, not the cursor: (a) page over a **snapshot** — materialize the leaderboard at time T (or query with snapshot semantics) and paginate that consistent version, refreshing between full traversals; or (b) accept and document the anomaly for casual browsing while offering a snapshot export where consistency matters. The transfer-lesson: cursor pagination's correctness proof leans on an immutable-ish sort key — check that assumption before prescribing it.",
                  "hint": "What did the cursor argument assume about the sort key of rows the client has already passed?"
                },
                {
                  "prompt": "Design the retry policy for Lens's mobile client uploading a photo on a flaky connection: state when it retries, how it backs off, when it gives up, and why the server's contract makes the policy safe. Then explain what one missing piece of the contract would do to your policy.",
                  "solution": "Policy: on timeout, connection reset, or any `5xx`/`429`: retry with the **same idempotency key**, exponential backoff with jitter (e.g. 1 s, 2 s, 4 s… capped at 60 s, ±50% jitter to avoid synchronized retry storms), honoring `Retry-After` on 429. On `4xx` (other than 429): stop — the request is wrong, retrying is spam. Give up after a horizon (say 24 h or explicit user cancel), keeping the upload queued locally; on giving up, surface state honestly ('not yet uploaded'). Safety: the retry-safety proposition guarantees duplicates collapse to one photo *because* the server records the key atomically with the insert — so the client may retry aggressively without double-posting, and an ambiguous timeout (did it commit?) is resolved by retrying, whose response replays the stored result. The missing piece: without idempotency keys (or with keys minted fresh per retry — the classic client bug), every ambiguous timeout is a fork: retry risks a duplicate photo, not retrying risks a lost upload. The client would be forced to choose between the two failure modes; with the key, the dilemma simply doesn't exist.",
                  "hint": "Ambiguous timeouts are the crux: the client cannot know whether the effect happened. What server property makes 'always retry' the correct resolution?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u1l4-i1",
              "front": "Idempotent operation — definition?",
              "back": "Performing it n≥1 times has the same effect on state as performing it once: f(f(s)) = f(s). PUT/DELETE (state-setting) are naturally idempotent; creates and additive ops are not."
            },
            {
              "id": "u1l4-i2",
              "front": "The three conditions that make idempotency keys give exactly-once effects?",
              "back": "(1) client retries with the SAME key per logical attempt; (2) server records key→result ATOMICALLY with the effect (same transaction, unique constraint); (3) recorded keys replay the stored result without re-executing, retained past the retry horizon."
            },
            {
              "id": "u1l4-i3",
              "front": "Two failure modes of offset pagination?",
              "back": "Performance: O(offset) rows walked and discarded per page — deep pages become scans. Correctness: offsets address positions, which shift under inserts (duplicates) and deletes (skipped items)."
            },
            {
              "id": "u1l4-i4",
              "front": "How does cursor (keyset) pagination work and what makes it correct?",
              "back": "Each page returns an opaque cursor of the last item's sort key; next page seeks WHERE key < cursor via index — O(log n) at any depth, stable under mutation because value-anchors don't move. Requires a UNIQUE sort key (append id as tiebreak) that doesn't change for seen rows."
            },
            {
              "id": "u1l4-i5",
              "front": "Retry semantics conventions: which HTTP responses invite retry?",
              "back": "5xx (server failed — retry with backoff) and 429 (slow down, honor Retry-After). 4xx means the request is wrong — don't retry unchanged. Uniform retryability requires mutating endpoints to be idempotent."
            }
          ]
        }
      ],
      "masteryCheck": {
        "id": "u1-check",
        "questions": [
          {
            "id": "u1q1",
            "type": "numeric",
            "prompt": "A social app has 20 M DAU; each active user performs 1 write per day on average. Using the 10⁵-seconds-per-day approximation and a peak factor of 4, what peak write QPS should the system be provisioned for?",
            "answer": 800,
            "tolerance": 40,
            "points": 1,
            "explanation": "Average: 20,000,000 × 1 / 10⁵ = 200 writes/s. Peak: 200 × 4 = 800 writes/s. The two-step habit — daily count ÷ 10⁵, then × peak factor — is the spine of every capacity estimate; provisioning against the 200 average instead of the 800 peak is the classic failure."
          },
          {
            "id": "u1q2",
            "type": "numeric",
            "prompt": "A service ingests 400,000 items/day, each 500 KB. Approximately how many terabytes accumulate over 5 years? (1 year ≈ 365 days; answer in TB.)",
            "answer": 365,
            "tolerance": 40,
            "points": 1,
            "explanation": "Daily: 400,000 × 500 KB = 200 GB/day. Five years ≈ 1,825 days → 200 GB × 1,825 = 365,000 GB = 365 TB (~1/3 PB). At ~100 TB per commodity box, this single line of arithmetic tells you partitioning becomes unavoidable within the horizon — which is exactly what storage estimates are for."
          },
          {
            "id": "u1q3",
            "type": "short",
            "prompt": "A B2B product has: 300 requests/s peak, 8 TB dataset growing 2 TB/year, and a 99.99% availability SLO. One commodity server handles ~10⁴ requests/s, stores ~100 TB, and realistically delivers ~99.5% uptime alone. Which single non-functional requirement forces this system beyond one machine *first*? (One word.)",
            "accept": [
              "availability",
              "the availability slo",
              "availability slo",
              "redundancy"
            ],
            "points": 1,
            "explanation": "Throughput (300/s vs ~10⁴) and dataset (8 TB vs ~100 TB, decades of headroom at +2 TB/yr) both clear the single machine easily. But one machine at ~99.5% can never meet 99.99% — the redundancy theorem (A = 1 − (1−a)ⁿ) makes independent duplication the only route to that SLO. Availability is the binding constraint, and it fires before any load number does."
          },
          {
            "id": "u1q4",
            "type": "mcq",
            "prompt": "A client is paging through a feed with offset pagination (`offset=40&limit=20`). Between its page-2 and page-3 requests, 5 new items are inserted at the top of the feed. What does the client observe on page 3?",
            "options": [
              "The last 5 items of page 2 appear again at the start of page 3",
              "5 items are silently skipped between page 2 and page 3",
              "Page 3 is unaffected — inserts at the top only shift page 1",
              "The request fails with a conflict because the collection changed"
            ],
            "answer": 0,
            "points": 1,
            "explanation": "Offsets address positions, and 5 top inserts shift every existing item's position down by 5 — so offsets 40–59 now begin with the items formerly at 35–39: the tail of page 2, re-served as duplicates. (Deletions cause the mirror failure: silent skips — option b confuses the two directions.) Option c is the intuition offset pagination falsely invites: *all* pages shift, not just page 1. Option d describes optimistic-concurrency behavior no plain offset API provides. Cursor pagination anchors on values, which don't move — that is the fix."
          },
          {
            "id": "u1q5",
            "type": "proof",
            "prompt": "A single machine is available a = 99% of the time. (a) Prove that a failover pair of such machines, failing independently, achieves 99.99% availability, deriving the general formula. (b) The two machines are then deployed in the same rack, sharing power and top-of-rack switch. Explain precisely which step of your proof breaks, and what that implies for how redundancy must be deployed.",
            "rubric": [
              "Derives pair availability as the complement of both machines being simultaneously down: A = 1 − (1−a)², explicitly invoking independence to multiply the two (1−a) failure probabilities",
              "Computes the numeric result correctly: 1 − (0.01)² = 0.9999 = 99.99%",
              "Identifies that the shared rack/power/switch breaks the independence assumption — the joint failure probability is no longer the product (1−a)², because a single shared cause downs both machines together",
              "Draws the correct deployment implication: redundancy only multiplies availability across failure-isolated units (separate racks/zones/power/deploy waves), and/or bounds it: with a shared dependency of availability s, the system cannot exceed s regardless of machine count"
            ],
            "solution": "(a) The pair fails only when both machines are down at once. P(machine down) = 1 − a = 0.01 for each. By independence, P(both down) = (1 − a)(1 − a) = (1 − a)². Availability is the complement: A = 1 − (1 − a)² = 1 − 0.0001 = 0.9999 = 99.99%. Generally, n independent machines give A = 1 − (1 − a)ⁿ: redundancy multiplies unavailabilities. (b) The multiplication step P(both down) = P(1 down)·P(2 down) is exactly where independence was consumed. With a shared rack, one event — power feed failure, switch failure — downs both machines simultaneously: P(both down) ≥ P(shared cause), which can approach P(single machine down from that cause) rather than its square. If the shared switch has availability s, the whole pair sits behind it in series: A_system ≤ s, no matter how many machines stand behind it. Implication: redundancy must be deployed across failure-isolated domains — separate racks, power, network paths, availability zones, and even deploy/config waves (a bad config push is a correlated failure too). The formula is a reward for engineering independence, not a property of buying two machines. ∎",
            "points": 3,
            "explanation": "The redundancy formula is one line of probability; the entire engineering content is the independence hypothesis it consumes. Availability work in real systems is dominated by hunting correlated failure domains — power, racks, switches, deploys, configuration — because any shared serial dependency caps the system below the multiplied figure."
          },
          {
            "id": "u1q6",
            "type": "open",
            "prompt": "Run unit 1's full method on this prompt: \"Design v1 of a podcast-hosting platform.\" Given: 200 k DAU listeners; each listener streams 2 episodes/day; average episode audio is 40 MB; 2,000 creators upload 1 episode/day each (same 40 MB); p99 stream-start < 400 ms; 99.9% availability; uploads must never be lost. Produce: (1) the capacity arithmetic (request rates, daily ingest and egress bytes, storage/year); (2) the single-machine verdict, naming the binding constraint(s) with numbers; (3) the v1 architecture, with every component justified by a requirement or number; (4) two API contract decisions with the reasoning of this unit.",
            "rubric": [
              "Arithmetic is shown and roughly correct: ~400 k streams/day ≈ 4/s average (≈10–15/s peak); creator ingest 2,000 × 40 MB = 80 GB/day (~30 TB/year); listener egress 400 k × 40 MB = 16 TB/day ≈ 160 MB/s ≈ 1.3 Gbit/s average (peak 3–5 Gbit/s) — units carried, rounding sensible",
              "Single-machine verdict derived from the numbers, not asserted: request rates are trivial; egress bandwidth is meaningful but survivable short-term; the binding constraints named are availability (99.9% forces redundancy) and durability of uploads (forces replicated object storage), with storage growth (~30 TB/yr) forcing blob storage within the horizon; bonus for noting stream-start latency pushes toward CDN/edge for audio bytes",
              "Every proposed component is paid for: LB + ≥2 app servers (availability), replicated DB for metadata (availability/durability), object store for audio (durability + growth), CDN or byte-range edge caching tied to the 400 ms stream-start p99 and egress offload — and NO unjustified components (a queue, cache cluster, or microservices split without a named constraint should be absent or explicitly deferred)",
              "API decisions use the unit's reasoning: e.g. upload as POST with a required Idempotency-Key (creators on flaky links must retry a 40 MB upload safely — effectively-once), episode lists/feeds with cursor pagination anchored on (published_at, id), signed upload/download URLs keeping bulk bytes off the API tier, PUT-style state-setting where possible — any two, each with its why",
              "Assumptions that were invented (peak factors, rendition/bitrate choices, retention) are stated explicitly rather than smuggled in"
            ],
            "solution": "(1) Arithmetic. Streams: 200k × 2 = 400 k/day → 400k/10⁵ = 4/s average; peak ×3 ≈ 12/s. Ingest: 2,000 × 40 MB = 80 GB/day → ~30 TB/year of creator audio (state retention assumption: keep forever). Egress: 400k × 40 MB = 16 TB/day → 16 TB/10⁵ s = 160 MB/s ≈ 1.3 Gbit/s sustained, ~4 Gbit/s peak. Metadata is negligible (thousands of rows/day). (2) Verdict. Compute is idle (tens of QPS vs ~10⁴ capacity); a 10 Gbit NIC survives 4 Gbit/s peak egress for now, but with zero growth headroom; storage at 30 TB/yr crosses a single box within ~2–3 years. What actually rejects one machine immediately: 99.9% availability (one box delivers ~99–99.5%; the redundancy theorem gives a 99% pair 99.99%) and upload durability (audio must survive disk loss → replicated object storage from day one). Latency: 400 ms p99 stream-start is comfortable same-continent but forces edge/CDN delivery if listeners are global — stated as an assumption to extract. (3) v1: LB → 2 stateless app servers (availability); Postgres primary + replica (metadata durability/availability); replicated object store for audio (durability + 30 TB/yr growth); CDN in front of audio with byte-range support (egress offload — 16 TB/day off the origin — and stream-start p99); direct-to-object-store signed uploads (keeps 40 MB bodies off the API tier). Explicitly absent: queues (no async work yet — transcoding would add one later, noted as the trigger), cache cluster (metadata QPS is trivial; DB buffer pool suffices), microservices (nothing binds). (4) Contract: POST /v1/episodes requires Idempotency-Key — a creator retrying a 40 MB upload over hotel Wi-Fi must get effectively-once publication (key recorded atomically with the episode row); GET /v1/shows/{id}/episodes?cursor= — keyset pagination on (published_at, episode_id), stable while new episodes publish; 5xx/429-retryable error semantics with Retry-After. Assumptions stated: peak factor 3, forever-retention, single-bitrate audio (transcoding deferred), listeners initially same-continent.",
            "points": 3,
            "explanation": "The gate's design questions are graded on derivation: the same five boxes justified by numbers score high; a fancier diagram with unpaid components scores low. Notice how the profile (tiny QPS, dominant bytes, hard durability) reproduces the Lens shape with different numbers — the method, not the answer, is what transfers."
          }
        ]
      }
    },
    {
      "id": "u2",
      "title": "Data",
      "summary": "Modeling for access patterns, choosing a storage engine, partitioning when a dataset outgrows one box, and mapping product features to the consistency they actually need.",
      "intro": "Unit 1 left Lens with a derived v1 — five boxes, a fixed contract — and an arithmetic verdict: compute is idle, but *bytes* are the load. Storage was also the forcing function with the longest fuse: 100 TB a year does not fit one machine forever, and 'the dataset outgrows the box' was one of the four named reasons to distribute. This unit takes up the data layer that verdict points at. It proceeds in the order the decisions are actually made: first model the data around the queries the product will run (not around the world's ontology); then choose the storage engine whose physics match the workload, which requires understanding what B-trees and LSM-trees each pay for; then partition when — and only when — the numbers say one machine's storage or write rate is the binding constraint; and finally decide, feature by feature, how stale a read is allowed to be, because replication and partitioning both put copies of the truth in more than one place. The gate asks you to run this chain on an unfamiliar workload: model it, pick its store, shard it, and defend its consistency map.",
      "references": [
        "Martin Kleppmann — Designing Data-Intensive Applications, chs. 2–3 (data models, storage engines), 5–6 (replication, partitioning)",
        "Karger et al. — Consistent Hashing and Random Trees (STOC 1997)",
        "O'Neil et al. — The Log-Structured Merge-Tree (Acta Informatica, 1996)",
        "Werner Vogels — Eventually Consistent (CACM 52(1), 2009)",
        "Terry et al. — Session Guarantees for Weakly Consistent Replicated Data (PDIS 1994)",
        "Instagram Engineering — Sharding & IDs at Instagram (2012)"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u2l1",
          "title": "Model the Queries, Not the World",
          "estMinutes": 24,
          "builds_on": [
            "u1l1",
            "u1l4"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Schema follows queries",
              "body": "There are two ways to design a schema. The ontological way asks *what things exist?* — users, photos, follows — and models them faithfully, trusting that any query can be assembled later. The operational way asks *what queries will run, how often, and with what latency budget?* — and shapes the data so the frequent queries are cheap. For small systems the two converge, because a relational database with good indexes makes almost any query cheap at small n. At scale they diverge sharply: the feed query that ran 150 times per write in *Requirements Are the Design* deserves a physical layout tuned for it, and the ontologically pure schema may be unable to provide one.\n\nThe method of this course says: **start ontological, normalized, relational — then denormalize exactly where a measured query cost forces it**. Normalization is the storage analogue of the single machine from *One Machine First*: the null hypothesis that must be falsified by a number. This lesson builds the vocabulary for both halves: what normalization buys, what indexes actually cost and deliver, and what controlled denormalization looks like when the numbers finally demand it."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Normalization and denormalization",
              "statement": "A schema is **normalized** when each fact is stored exactly once: entities in their own tables, relationships as foreign keys, derived values computed at read time. Its virtue is **update simplicity** — changing a user's name touches one row, and no stored copy can disagree with another.\n\n**Denormalization** deliberately stores a fact more than once, or stores a derived value (a count, a join result) materially, to make a frequent read cheap. Its price is paid on the write path and in correctness: every copy must be updated on change, and the copies can transiently or permanently disagree. Denormalization is therefore a *purchase* — read latency bought with write cost and a consistency liability — and like every purchase in this course it must be paid for by a named, measured query."
            },
            {
              "type": "text",
              "heading": "Indexes: the read/write trade you tune first",
              "body": "Before any denormalization, the honest tool is the **index** — a secondary structure the database maintains so a query can seek instead of scan. The workhorse is the **B-tree**: a balanced, high-fanout search tree over the key, with rows (or row pointers) at the leaves. Three operational facts matter to a designer. First, a B-tree lookup costs one page read per level, and (as proved below) the tree is astonishingly shallow — three or four levels for billions of keys — so an indexed point query is a handful of page touches, most of them cached in RAM. Second, a **composite index** on (a, b) is a phone book sorted by last-then-first name: it serves `WHERE a = ?` and `WHERE a = ? ORDER BY b` and range scans on b within an a — but not queries on b alone; column order is a design decision, made from the query list. Third, indexes are not free: every write must update every index on the table, so ten indexes turn one logical insert into eleven physical structure updates, and the write amplification lands exactly on the write path you sized in *The Arithmetic of Scale*. Index what the query list justifies; drop what it doesn't."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "B-tree height bound",
              "statement": "A B-tree in which every internal node has at least b children (b ≥ 2) holds n keys at height at most ⌈log_b(n)⌉ — i.e. a lookup touches O(log_b n) nodes. With the fanouts real databases achieve (b in the hundreds, because a node is a 4–16 KB page of separator keys), n = 10⁹ keys fit in a tree of height 3–4.",
              "proof": "A tree of height h whose internal nodes each have at least b children has at least b^h leaves: level 0 is 1 node, level 1 at least b nodes, and inductively level i at least bⁱ. Keys live in (or are pointed to by) the leaves, and each leaf holds at least one key, so n ≥ b^h, giving h ≤ log_b(n). Concretely with b = 500 (a 8 KB page holding hundreds of separators): 500² = 250,000; 500³ = 1.25 × 10⁸; 500⁴ = 6.25 × 10¹⁰ — so a billion keys need height 4, and the top levels, being few pages, live permanently in RAM. A point lookup is therefore ~1–2 actual disk/SSD reads even on a billion-row table. ∎\n\nThis bound is why 'add an index' is the first answer to a slow query and not a hand-wave: it converts a scan of n rows into ~log_b(n) ≈ 4 page touches, a factor of hundreds of millions at scale — and why the *absence* of an index on a hot predicate is the single most common performance bug in production databases."
            },
            {
              "type": "example",
              "heading": "Worked example: the Lens schema and its feed query",
              "body": "Model Lens v1 normalized, straight from the functional requirements of *Scoping Lens*:\n\n`users(id, handle, name, created_at)` · `photos(id, owner_id → users, object_key, caption, created_at)` · `follows(follower_id → users, followee_id → users, created_at)` with primary key (follower_id, followee_id) · `likes(user_id, photo_id, created_at)` with primary key (user_id, photo_id).\n\nNow the query list, with frequencies from the arithmetic: the **feed** (150/s-class, p99 500 ms): photos of accounts I follow, newest first, cursor-paginated; **profile grid** (photos by one owner, newest first); **counts** (likes per photo, followers per user).\n\nThe feed query in SQL: `SELECT p.* FROM photos p JOIN follows f ON p.owner_id = f.followee_id WHERE f.follower_id = :me AND (p.created_at, p.id) < (:cursor_t, :cursor_id) ORDER BY p.created_at DESC, p.id DESC LIMIT 20`. Its physical needs read straight off the shape: `follows` needs its (follower_id, followee_id) primary key so 'who I follow' is one range scan; `photos` needs a composite index **(owner_id, created_at DESC, id DESC)** so each followee's recent photos are one indexed descending scan — and the same index serves the profile grid for free, a two-for-one that is the signature of a well-chosen composite. The cursor predicate from *The Contract* slots directly onto the index order — contract and schema designed as one thing.\n\nAt 1 M DAU this plan is comfortably inside budget: a user following 200 accounts triggers 200 short index probes (or a merge), all against pages hot in RAM (the 60 GB working set of *Lens by the numbers*). Write it down as the baseline — unit 4 will meet the scale where this join stops being cheap, and *measure* its way out."
            },
            {
              "type": "example",
              "heading": "Worked example: buying a counter",
              "body": "The like-count under every photo is read on every feed render — order 100 M reads/day — and changes on every like — order 500 k writes/day. Normalized, the count is `SELECT COUNT(*) FROM likes WHERE photo_id = :p`: correct always, but it re-derives an aggregate over potentially thousands of rows, 200-per-feed-load, on the hottest path in the product. The numbers (200:1 read-to-write on this fact, tight latency budget) justify the purchase: **denormalize** to a `like_count` column on `photos`.\n\nNow pay for it properly. The copy must be maintained: increment/decrement in the *same transaction* as the `likes` insert/delete — the atomicity discipline from the idempotency proposition of *The Contract*, applied to derived state (a trigger, or explicit `UPDATE photos SET like_count = like_count + 1`). Idempotent likes (`PUT`-style, primary key on (user_id, photo_id)) keep retries from double-counting: the second insert conflicts, so the increment never runs twice. And correctness gets a safety net: a periodic reconciliation job re-derives counts from `likes` and repairs drift — because a denormalized value *will* drift eventually (a bug, a manual fix, a partial restore), and the difference between engineered denormalization and a data-corruption factory is whether the derivation is still recorded and re-runnable.\n\nThe general template: *name the query and its frequency; store the derived value; update it atomically with its source; keep the source authoritative; reconcile on a schedule.*"
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Denormalize from measurements, not from fear.** Every duplicated fact is a standing invariant you must now maintain by hand, forever — through every code path, migration, and outage. The count example cleared the bar because the read:write ratio on that fact was 200:1 and sat on the hot path. A value read once a day, or derivable through an index in single-digit milliseconds, clears nothing: the B-tree already made it cheap. The order of escalation is fixed: query plan → index → then denormalize."
            },
            {
              "type": "text",
              "heading": "What the relational default buys — and where it ends",
              "body": "It is worth stating why the relational database is this course's starting point rather than one option among many. It gives **transactions** — multi-row invariants (the like + its count) commit or abort together, which unit 1's idempotency machinery already leaned on. It gives **ad-hoc queryability** — the product will ask questions next quarter nobody listed this quarter, and a normalized relational core answers them without migration. It gives fifty years of query optimization behind a declarative language. These are enormous defaults to surrender, which is why the method surrenders them only when a specific number binds — a write rate no single-node engine sustains, a dataset no box holds, an access pattern (a graph traversal, a full-text search) whose relational encoding is measurably pathological.\n\nWhat is now established: the schema is modeled from the query list, indexes make the listed queries cheap at logarithmic cost, and denormalization is a priced purchase with a maintenance invariant attached. The next lesson takes up the layer beneath the schema: the storage *engine* — because when the write-rate numbers grow hostile, the B-tree itself becomes the thing being renegotiated."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "For Lens's `photos(owner_id, created_at, id, ...)` table with composite index (owner_id, created_at DESC, id DESC), say for each query whether the index serves it efficiently and why: (a) profile grid — photos of user 7, newest first; (b) all photos posted site-wide in the last hour; (c) photos of user 7 posted in March; (d) newest photo per each of 200 followed users.",
                  "solution": "(a) Efficient: equality on the leading column then the index's own descending order — one contiguous scan, no sort. (b) Not served: `created_at` is not the leading column; the index orders by time only *within* an owner. This query needs a separate index leading with created_at (or a scan). (c) Efficient: equality on owner_id, then a range on created_at — exactly the phone-book pattern (last name, then first-name range). (d) Served as 200 tiny probes: for each followee, seek to (owner_id, MAX created_at) and take one entry — cheap individually, and this 'top-1 per owner, merged' shape is precisely Lens's feed access pattern; whether 200 probes stays cheap at 100× scale is the question unit 4 reopens. The transferable rule: a composite index serves queries that constrain a *prefix* of its columns, with at most one trailing range.",
                  "hint": "A composite index is sorted by column 1, then column 2 within it. Which queries constrain a prefix?"
                },
                {
                  "prompt": "Using the B-tree height bound with fanout b = 400: (a) what height holds 10¹² keys? (b) A table has 6 secondary indexes; a bulk load inserts 50 M rows. Roughly how many index-structure updates does the load perform, and what does this suggest about how bulk loads should treat indexes?",
                  "solution": "(a) 400³ = 6.4 × 10⁷; 400⁴ = 2.56 × 10¹⁰; 400⁵ ≈ 10¹³ — so height **5** covers 10¹² keys (height 4 falls short at ~2.6 × 10¹⁰). Even a trillion keys is a five-hop lookup. (b) Each row updates the primary structure plus 6 secondary indexes → 7 structure updates × 50 M rows = **350 M index updates**, each a log-height traversal with page splits along the way. This is why bulk loads conventionally drop (or defer) secondary indexes, load the data, then rebuild the indexes with a sort — building a B-tree from sorted input is sequential and one-pass, orders of magnitude cheaper than 300 M random insertions. The design instinct: index maintenance is the write path's tax; when the write is enormous and offline, restructure to pay the tax once, in bulk.",
                  "hint": "Count structure updates per row, then recall what sorted input does for tree construction."
                },
                {
                  "prompt": "A dashboard shows each seller's 'total revenue this month', queried ~50×/day per seller; orders arrive at ~2,000/day per large seller. The team proposes computing it live with SUM(amount) over an indexed (seller_id, created_at) range. A staff engineer proposes a denormalized running total updated per order. Argue which is right at this scale, and name the number that would flip the answer.",
                  "solution": "Compute live. The read:write ratio on this fact is 50 reads vs 2,000 writes per day — *write-dominated*, the mirror of the like-count case: a running total would be updated 2,000 times a day to serve 50 reads, paying 40 writes of maintenance per read served. Meanwhile the indexed range SUM covers at most ~60 k rows (a month of orders), a few milliseconds against a B-tree range that is mostly in cache — nowhere near any latency budget worth buying out of. The flip number is the read frequency (or row count): if the dashboard goes on a public storefront read 100 k×/day, the ratio inverts to ~50:1 read-dominated and the running total earns its invariant; likewise if 'this month' becomes 'all time' over 10⁸ rows, the live SUM's cost crosses the budget. State the trigger, keep the source authoritative, and reconcile — same template, opposite verdict, because the numbers are opposite.",
                  "hint": "Compute the read:write ratio on this specific fact — which side is doing the work?"
                },
                {
                  "prompt": "Lens adds 'view counts' on photos: every feed impression increments a counter (order 100 M/day site-wide), and counts display on every photo page. Explain why the like-count template (synchronous same-transaction increment) is the *wrong* purchase here, and design a better one.",
                  "solution": "Volume inverts the economics. Likes were 500 k writes/day — a synchronous increment per like is noise. Views are 100 M writes/day ≈ 1,000+/s at average, several thousand at peak (the arithmetic habit) — turning every feed *read* into a hot-row `UPDATE` would (a) convert the read-dominated feed path into a write storm on `photos` rows, (b) serialize on popular photos' row locks (every viewer of the same viral photo contends on one row — a self-built hot spot), and (c) buy per-impression durability for a metric whose requirement is approximate anyway (nobody audits view #48,201,337). Better purchase: **batch and approximate** — increment in-memory/per-app-server counters (or emit events), flush aggregated deltas to the database every few seconds (`UPDATE ... SET views = views + 4,812`), and accept bounded loss on crash (a stated assumption: view counts are approximate within seconds). This is the first appearance of a pattern unit 4 formalizes: when write volume × per-write cost exceeds the path's budget and the requirement tolerates lag, move the write off the synchronous path and batch it.",
                  "hint": "Run the arithmetic on writes/day, then ask what durability the requirement actually demands for one view."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u2l1-i1",
              "front": "Access-pattern-first modeling — the method's rule for schemas?",
              "back": "Start normalized and relational (the null hypothesis), enumerate the queries with frequencies and budgets, index to serve them; denormalize only where a measured query cost forces it — escalation order: query plan → index → denormalize."
            },
            {
              "id": "u2l1-i2",
              "front": "What does a composite index on (a, b) serve — and not serve?",
              "back": "Queries constraining a prefix: a = ?, and a = ? with a range/order on b. Not queries on b alone — the index is sorted by a first, like a phone book by last-then-first name."
            },
            {
              "id": "u2l1-i3",
              "front": "B-tree height bound and its consequence?",
              "back": "Height ≤ log_b(n) with fanout b; at b ≈ 400–500, a billion keys sit 3–4 levels deep, top levels cached in RAM → indexed point lookups are ~1–2 real IOs at any realistic scale."
            },
            {
              "id": "u2l1-i4",
              "front": "The full price of a denormalized value?",
              "back": "Write-path cost on every change, a standing consistency invariant (copies can drift), and a maintenance obligation: update atomically with the source, keep the source authoritative, reconcile on a schedule."
            },
            {
              "id": "u2l1-i5",
              "front": "Why are secondary indexes a write-path tax?",
              "back": "Every insert/update must update every index on the table — 10 indexes ≈ 11 structure updates per logical write. Index only what the query list justifies; bulk loads drop and rebuild instead of paying per-row."
            }
          ]
        },
        {
          "id": "u2l2",
          "title": "Choosing the Store",
          "estMinutes": 25,
          "builds_on": [
            "u2l1",
            "u1l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "When the engine, not the schema, is the question",
              "body": "*Model the Queries, Not the World* tuned the schema inside a relational database and found Lens v1 entirely comfortable there. But the exercises kept brushing a wall: view counts at thousands of writes per second, a messaging workload at 25,000 writes per second from *The Arithmetic of Scale*, telemetry at millions of points per second. At some write rate, the question stops being *which index* and becomes *which storage engine* — because the two dominant engine families, **B-trees** and **log-structured merge-trees (LSM-trees)**, pay for reads and writes in structurally different currencies, and no tuning makes one into the other.\n\nThe physics behind the fork is the sequential-vs-random gap from the latency table in *The Arithmetic of Scale*: on every storage tier, sequential writes are one to two orders of magnitude cheaper than random ones. A B-tree updates data *in place* — a write seeks to the page where the key lives and modifies it: random IO, but the data stays perfectly organized for reads. An LSM-tree never updates in place — writes append to an in-memory buffer (memtable) that flushes as sorted immutable runs (SSTables), and background **compaction** merges runs to keep reads from degrading: every write IO is sequential, but a read may have to consult several runs, and compaction re-writes data repeatedly behind the scenes. Neither is better; they move the same total work to different places, and the workload decides which place can afford it."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Read, write, and space amplification",
              "statement": "For a storage engine serving a logical workload, **write amplification** is the ratio of bytes physically written to bytes logically written (index maintenance, page rewrites, compaction all inflate it). **Read amplification** is the number of distinct structures or pages consulted per logical read (extra tree levels, multiple LSM runs, bloom-filter misses). **Space amplification** is the ratio of bytes stored to live logical bytes (fragmentation, not-yet-compacted duplicates, tombstones). The RUM insight: an engine can be excellent on at most two of read cost, update cost, and memory/space — every design point trades among the three, so the engine is chosen by which amplification the workload can least afford."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "LSM write amplification (leveled compaction)",
              "statement": "In an LSM-tree with leveled compaction, size ratio T between adjacent levels, and L levels on disk, each logical byte is physically rewritten approximately T × L times over its lifetime — write amplification ≈ T·L, with L = log_T(N / M) levels for dataset size N and memtable size M. (Typical practice: T = 10, L = 4–5 ⇒ write amplification in the tens.)",
              "proof": "Track one byte from arrival to rest. It is first written in a memtable flush to level 1 (one write). Thereafter it migrates down through each of the L levels: it reaches level i by being merged into it. In leveled compaction, level i holds ~T× the data of level i−1 in sorted, non-overlapping runs; merging a chunk of level i−1 into level i must rewrite the *overlapping key range* of level i, which on average holds T bytes for every byte arriving from above (the levels differ by factor T over the same key space). So each level descent costs ≈ T physical writes per logical byte, there are L descents, and total physical writes ≈ 1 + T·L ≈ T·L. The level count follows from the geometry: level i holds M·Tⁱ, and the deepest level must hold ~N, so L ≈ log_T(N/M). ∎ (An accounting argument with standard idealizations — uniform key distribution, steady state — but it is the approximation the real tuning knobs are built around.)\n\nThe design consequence cuts both ways. The *cost*: an LSM ingesting 100 MB/s of logical writes with amplification 30 is physically writing 3 GB/s — compaction bandwidth, not ingest, is what saturates first, and 'the database is slow because compaction fell behind' is the signature LSM production incident. The *benefit*: every one of those bytes moves in large sequential IOs, which disks and SSDs serve at full bandwidth — while a B-tree taking the same ingest scatters random page writes, and its effective ceiling arrives far earlier. High sustained ingest → LSM wins despite the multiplier; read-heavy point access → the B-tree's one-structure reads win."
            },
            {
              "type": "decision",
              "heading": "Workload → store family (the selection table)",
              "rows": [
                [
                  "Transactional app data: joins, multi-row invariants, ad-hoc queries",
                  "Relational OLTP (Postgres/MySQL class)"
                ],
                [
                  "Massive sustained ingest, key-ordered scans (events, messages, time series)",
                  "LSM-based wide-column / KV (Cassandra/RocksDB class)"
                ],
                [
                  "Tiny values, extreme read QPS, latency in microseconds",
                  "In-memory KV (Redis/Memcached class) — as cache or ephemeral store"
                ],
                [
                  "Large immutable blobs: media, backups, logs",
                  "Object store (S3 class) + CDN in front"
                ],
                [
                  "Full-text / relevance / faceted search",
                  "Inverted-index engine (Lucene/Elasticsearch class), fed from the source of truth"
                ],
                [
                  "Analytics: scans and aggregates over billions of rows, few writes",
                  "Columnar warehouse (Parquet/ClickHouse/BigQuery class)"
                ],
                [
                  "Deep multi-hop relationship traversals as the primary access pattern",
                  "Graph store — only if traversals dominate; else relational + recursive queries"
                ]
              ]
            },
            {
              "type": "text",
              "heading": "Reading the table honestly",
              "body": "Two disciplines keep the selection table from becoming a menu of toys. First, **the row is chosen by the workload's binding amplification, not by the technology's reputation**: the messaging exercise's 25 k writes/s of tiny rows with key-ordered reads is the LSM row because sustained ingest is what binds; Lens's metadata at 3 writes/s is the relational row because nothing binds and transactions plus ad-hoc queries are free value. Second, **every store beyond the first is a copy of somebody's truth**: the search index holds a projection of the photos table; the cache holds recent query results; the warehouse holds yesterday's everything. Each copy raises the same question the like-count did — *how does it stay current, and how stale may it be?* — which is exactly the consistency question this unit's final lesson systematizes. 'Polyglot persistence' is not a style; it is an obligation ledger, one derived-copy invariant per store, and the ledger is the real cost that keeps the method conservative about adding rows from this table."
            },
            {
              "type": "example",
              "heading": "Worked example: Lens's storage portfolio",
              "body": "Walk Lens through the table at its two design points.\n\n**At 1 M DAU** (the current design): metadata — users, photos, follows, likes — is transactional, join-shaped, 3-ish writes/s: **relational**, as modeled, nothing binds. Media — 200 GB/day of immutable 2 MB blobs — is the object-store row (already forced by durability in *One Machine First*); putting blobs *in* the relational store would bloat its pages, wreck its cache hit rate, and buy nothing. Hot renditions will meet the in-memory row in unit 3. Verdict: two stores, both already paid for. The table adds nothing — which is the correct reading at this scale.\n\n**At 100 M DAU** (the unit-6 horizon, numbers ×100): metadata writes go from 3/s to ~300/s — still within a well-run relational primary, but the *dataset* (photos rows at 10 M/day ≈ 3.6 B rows/year) and the feed read fan-out start to bind, which is partitioning's cue (next lesson) rather than an engine change. Two genuinely new rows do open: **search** (find users, captions, tags — an inverted-index engine fed asynchronously from the photos table, arriving with its staleness obligation), and **analytics** (product metrics over billions of impressions — columnar, batch-fed, a day stale by design). View-count-style firehose ingest (100 M+ events/day) lands on the LSM row *if* it must be stored raw; if only aggregates matter, unit 4's batching keeps it out of the portfolio entirely.\n\nThe pattern to imitate: the portfolio grew from one store to two to four *only as a named number or access pattern crossed a line* — and each addition was logged with its staleness obligation."
            },
            {
              "type": "example",
              "heading": "Worked example: the telemetry pipeline picks its engine",
              "body": "Take the write-dominated profile from *Three prompts, three profiles* and make it concrete: 200 k servers emitting 50 metric points/s each = **10 M points/s**, ~40 bytes per point (timestamp, series id, value) ≈ 400 MB/s logical ingest; reads are dashboards scanning one series over a time range, minutes stale is fine.\n\nTest it against a B-tree engine: 10 M random-key inserts/s is two to three orders of magnitude beyond any single node's in-place update ceiling, and even sharded 50 ways it demands per-node rates B-trees don't sustain — in-place update physics, not tuning, is the wall. Test it against an LSM with T = 10, L = 4: write amplification ≈ 40 → physical compaction traffic ≈ 16 GB/s across the fleet; at ~2 GB/s sequential per NVMe node, ~10–15 nodes carry the *write path alone* — expensive but arithmetically possible, because every byte moves sequentially. The read pattern (contiguous time-range scans per series) is exactly what sorted SSTable runs serve well.\n\nBut the deepest win is a modeling move the engine choice enables: keys sorted as **(series_id, timestamp)** make each series' points adjacent, so range reads are one seek plus a sequential scan, and adjacent points compress brutally (delta-of-delta timestamps, XOR'd values — the Gorilla trick) — cutting the 400 MB/s logical to tens of MB/s physical and shrinking compaction with it. Engine choice and data layout compounding: that is what 'choosing the store' actually buys, and why the choice is made from amplification arithmetic rather than from the logo on the box."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**'NoSQL' surrenders are permanent until re-migrated — know what you traded.** Leaving the relational default typically gives up multi-row transactions, foreign keys, ad-hoc joins, and sometimes indexes themselves; those invariants don't disappear, they move into your application code, half-implemented. The selection table earns its keep only when a workload's amplification genuinely binds — a store adopted because the write path *might* someday be hot carries its obligation ledger every day in the meantime."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "An LSM store uses leveled compaction with T = 10 and holds N = 2 TB with a 1 GB memtable. (a) Estimate the level count and write amplification. (b) The service ingests 150 MB/s logically; what sustained compaction bandwidth does the amplification imply, and how many NVMe nodes (2 GB/s sequential write each, at 50% utilization target) does the write path alone require?",
                  "solution": "(a) L ≈ log₁₀(2 TB / 1 GB) = log₁₀(2,000) ≈ 3.3 → **4 levels**; write amplification ≈ T·L ≈ 10 × 4 = **~40×**. (b) Physical write traffic ≈ 150 MB/s × 40 = **6 GB/s**. Per node usable: 2 GB/s × 0.5 = 1 GB/s → **~6 nodes** for compaction bandwidth alone, before serving a single read. The habit being drilled: LSM capacity planning multiplies ingest by amplification *first* — clusters sized on logical ingest fall over when compaction lags, manifesting as unbounded read amplification (runs pile up) rather than as write errors, which is what makes it a sneaky failure.",
                  "hint": "L = log_T(N/M); physical bandwidth = logical × T·L; then divide by usable per-node sequential bandwidth."
                },
                {
                  "prompt": "For each workload, pick the store family from the selection table and name the amplification (read/write/space) or capability that decided it: (a) a bank ledger with strict multi-account invariants at 2 k transactions/s; (b) clickstream events at 800 k/s, queried as daily aggregates by analysts; (c) product-catalog search with typo tolerance and facets over 50 M items; (d) session tokens: 10 M tiny values, 300 k reads/s, 50 µs budget, loss tolerable.",
                  "solution": "(a) **Relational OLTP** — the deciding capability is multi-row transactional invariants (debits and credits atomically); 2 k tx/s binds nothing, so the default's guarantees are free. (b) **Ingest via LSM/log, analytics in columnar** — write amplification tolerance for 800 k/s sequential ingest, then scan-oriented reads: two stores, batch-connected, because the write shape and read shape are different engines' strengths (and staleness of a day is granted). (c) **Inverted-index engine** — the capability (relevance ranking, typo tolerance, facets) has no efficient relational encoding; it arrives as a derived copy fed from the catalog source of truth, with a staleness obligation. (d) **In-memory KV** — the 50 µs budget rules out any disk structure (SSD random read alone is ~100 µs, from the latency table); loss tolerance is what *permits* RAM-residency, and stating that tolerance is part of the answer.",
                  "hint": "For each: which amplification would break first on the wrong engine, or which capability has no efficient encoding in the default?"
                },
                {
                  "prompt": "A team runs a social app's posts table (read-heavy: 30:1) on an LSM store 'because it scales writes', and complains of p99 read latency spikes. Explain the mechanism behind the spikes using this lesson's concepts, and the two directions a fix can take.",
                  "solution": "Mechanism: read amplification. An LSM point read consults the memtable plus potentially one run per level; bloom filters shortcut most absent-key probes, but p99 reads hit the misses — and whenever compaction falls behind (a write burst, a compaction pause), extra overlapping runs accumulate and every read pays more probes: the read tail is structurally coupled to compaction health. A 30:1 read-heavy workload is paying LSM's read-side currency to buy write throughput it doesn't need. Fix direction 1 — *re-match the engine*: a B-tree store gives one-structure reads with tight tails, and 30:1 read-dominance at ordinary write rates is exactly its home turf. Fix direction 2 — *pay inside the LSM*: more aggressive leveling (lower read amp, higher write amp — affordable given spare write budget), larger block cache, tuned bloom bits per key. Either is defensible; choosing between them is the RUM trade made explicit — the indefensible position is the original one, an engine chosen by slogan against the workload's binding amplification.",
                  "hint": "Which amplification does an LSM charge readers, and what operational condition inflates it at the tail?"
                },
                {
                  "prompt": "Lens's product team wants 'search photos by caption text' shipped next quarter. Using the derived-copy discipline, specify the design: where the search index gets its data, how fresh it must be (extract the requirement), what happens when the index and the photos table disagree, and which failure the design must survive.",
                  "solution": "Source: the `photos` table remains the single source of truth; the inverted-index engine holds a derived projection (photo id, caption tokens, owner, created_at), fed asynchronously — on write, the app (or a change feed from the database, unit 4's outbox pattern done properly) emits 'photo created/updated/deleted' events the indexer consumes. Freshness: extract it — searchable 'within a minute' is almost certainly acceptable for caption search (state it, get it confirmed); that grant is what makes async feeding legal. Disagreement: the index may briefly return a deleted photo or miss a new one; the read path re-checks authoritative state for anything user-visible (fetch the photo row by id when rendering results — absent row means drop it silently), so the index can be *wrong* but the product is never *incorrect*, only incomplete. Survivable failure: the indexer or its feed dying must not lose the derived copy permanently — the design needs replayability (re-consume the feed from a checkpoint) and a full-rebuild path (re-index the photos table from scratch), the reconciliation template from the like-count applied at store scale. This four-part answer — source, staleness grant, disagreement policy, rebuild path — is the standing obligation every derived store carries.",
                  "hint": "Apply the like-count template one level up: authoritative source, freshness grant, drift handling, re-derivability."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u2l2-i1",
              "front": "B-tree vs LSM — where does each pay?",
              "back": "B-tree: in-place random-IO writes, but reads consult one structure (tight read tails). LSM: sequential append + background compaction (huge ingest ceiling), but reads may probe multiple runs and compaction lag inflates read tails. Same work, moved to different places."
            },
            {
              "id": "u2l2-i2",
              "front": "Write / read / space amplification — definitions?",
              "back": "Write amp: physical bytes written per logical byte. Read amp: structures/pages consulted per logical read. Space amp: stored bytes per live byte. Engines trade among them (RUM); pick by which the workload can't afford."
            },
            {
              "id": "u2l2-i3",
              "front": "LSM leveled-compaction write amplification — formula and consequence?",
              "back": "≈ T·L (size ratio × levels), L = log_T(N/M); typically ~30–50×. Consequence: size clusters by ingest × amplification — compaction bandwidth, not logical ingest, saturates first."
            },
            {
              "id": "u2l2-i4",
              "front": "What obligation does every store beyond the first carry?",
              "back": "It's a derived copy of some source of truth: it needs a feed mechanism, an explicit staleness grant, a disagreement policy, and a rebuild path. Polyglot persistence is an obligation ledger, not a style."
            },
            {
              "id": "u2l2-i5",
              "front": "Why does a 50 µs read budget force RAM?",
              "back": "The latency table: SSD random read alone is ~100 µs — over budget before any software runs. Only main memory (~100 ns reference) leaves room; loss-tolerance is what makes RAM-residency acceptable."
            }
          ]
        },
        {
          "id": "u2l3",
          "title": "Partitioning in Practice",
          "estMinutes": 26,
          "builds_on": [
            "u2l1",
            "u1l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The forcing function with the long fuse",
              "body": "*One Machine First* named four reasons to distribute, and for data the slow inevitable one is **dataset**: a table whose bytes, rows, or write rate exceed what one machine holds or sustains. The messaging estimate from *The Arithmetic of Scale* hit it (~500 TB and 25 k writes/s over five years); the exercise fleet ingesting 3.5 TB/day hit it within a month; Lens's 3.6 B photo rows/year at the 100 M-DAU horizon hits it on row count and write rate together. When the number crosses the line, the answer is **partitioning** (sharding): split the keyspace across machines so each holds a manageable slice, and route every query to the slice that owns its key.\n\nPartitioning is the most consequential purchase in the data layer, because unlike an index or a denormalized column it changes the *contract of every query*: single-key operations stay cheap (one shard), but anything touching many keys — joins, global orderings, multi-row transactions — now spans machines, and *One Machine First*'s warning about network boundaries lands with full force inside what used to be one database. So the lesson proceeds in the method's order: how to split (hash vs range), how to route as membership changes (consistent hashing, with its theorem), how to choose the key (where most sharding designs actually fail), and what breaks (cross-shard operations)."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Partitioning, partition key, hash vs range",
              "statement": "**Partitioning** assigns each record to one of P shards by a function of its **partition key**. **Hash partitioning** assigns shard(k) from a hash of k: it spreads load uniformly and destroys key order — range queries over the key must consult all shards. **Range partitioning** assigns contiguous key ranges to shards: it preserves order (range scans touch few shards) but concentrates load wherever the workload concentrates in the keyspace — monotonically increasing keys (timestamps, sequential ids) write only to the last shard, the classic hot-tail. The choice is made by the access pattern: point access and uniform spread → hash; ordered scans as the dominant read → range, with deliberate key design to break write hot-tails (e.g. prefixing a coarse hash or series id ahead of time)."
            },
            {
              "type": "text",
              "heading": "Routing under change: why naive modulo fails",
              "body": "Static assignment shard = hash(k) mod P works until P changes — and P always changes: growth adds shards, failures remove them. Under modulo, changing P from n to n+1 remaps *almost every key*: hash(k) mod n equals hash(k) mod (n+1) only when hash(k) mod n(n+1) < n, a fraction 1/(n+1) of keys — so **n/(n+1) of all keys move** (80% going from 4 to 5 shards). Moving a key means migrating its data and invalidating every cached location; a resharding that touches 80% of a 500 TB dataset is a weeks-long, risk-saturated event. The requirement, stated the method's way: membership changes of one node should move O(1/n) of the data — only what the new node must own — not O(1). **Consistent hashing** is the construction that achieves the bound, and it is worth proving rather than asserting."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "Consistent hashing moves K/n keys",
              "statement": "Hash both nodes and keys onto a circle [0, 1); each key is owned by the first node clockwise from it. With n nodes and K keys placed by a uniform hash: (i) each node owns in expectation K/n keys; (ii) adding one node moves, in expectation, K/(n+1) keys — only those the new node takes over — and no key moves between two surviving nodes; (iii) removing a node moves only that node's own keys, to their next clockwise successors.",
              "proof": "(i) By symmetry of uniform placement, each of the n nodes' expected arc length is 1/n of the circle, and uniformly hashed keys land in an arc in proportion to its length, giving K/n expected keys per node.\n\n(ii) Insert node v. Ownership is defined by 'first node clockwise', so the only keys whose owner changes are those whose first clockwise node is now v — the keys in the arc between v's position and its predecessor's, which v carves out of exactly one old node's arc. Every other key's clockwise successor is unchanged, so no key moves between survivors. After insertion there are n+1 symmetric nodes, so v's expected arc is 1/(n+1) of the circle → expected moved keys = K/(n+1).\n\n(iii) Remove node u: keys in u's arc now find their first clockwise node to be u's successor; all other keys' successors are untouched. Moved keys = u's holdings, expected K/n. ∎\n\nOne honest caveat completes the theorem: with only n random positions, individual arc lengths vary widely (the largest is Θ(log n / n) in expectation — some node owns several times its fair share). The standard repair is **virtual nodes**: give each physical node v ~100–1,000 positions on the ring; its total share is a sum of many small arcs, which concentrates sharply around 1/n (variance shrinks as 1/v), and node removal scatters its load across many successors instead of dumping it on one. Real systems (Dynamo-descended stores, distributed caches) ship exactly this construction."
            },
            {
              "type": "diagram",
              "kind": "graph",
              "directed": true,
              "height": 320,
              "caption": "A consistent-hashing ring, four nodes (A–D) with key ownership arcs. Adding node E (dashed) claims only the arc between D and E's position: keys k₃, k₄ move to E; every other key keeps its owner. Modulo hashing would have remapped ~80% of all keys.",
              "nodes": [
                {
                  "id": "a",
                  "label": "A",
                  "x": 50,
                  "y": 8,
                  "tone": "gold"
                },
                {
                  "id": "b",
                  "label": "B",
                  "x": 88,
                  "y": 42
                },
                {
                  "id": "c",
                  "label": "C",
                  "x": 62,
                  "y": 90
                },
                {
                  "id": "d",
                  "label": "D",
                  "x": 16,
                  "y": 74,
                  "tone": "sage"
                },
                {
                  "id": "e",
                  "label": "E (new)",
                  "x": 22,
                  "y": 22,
                  "tone": "rust"
                },
                {
                  "id": "k1",
                  "label": "k₁",
                  "sub": "→B",
                  "x": 74,
                  "y": 18,
                  "r": 12
                },
                {
                  "id": "k2",
                  "label": "k₂",
                  "sub": "→C",
                  "x": 84,
                  "y": 68,
                  "r": 12
                },
                {
                  "id": "k3",
                  "label": "k₃",
                  "sub": "D→E",
                  "x": 30,
                  "y": 46,
                  "r": 12
                },
                {
                  "id": "k4",
                  "label": "k₄",
                  "sub": "D→E",
                  "x": 12,
                  "y": 46,
                  "r": 12
                }
              ],
              "edges": [
                {
                  "from": "a",
                  "to": "b"
                },
                {
                  "from": "b",
                  "to": "c"
                },
                {
                  "from": "c",
                  "to": "d"
                },
                {
                  "from": "d",
                  "to": "e",
                  "dashed": true,
                  "tone": "rust",
                  "label": "E claims this arc"
                },
                {
                  "from": "e",
                  "to": "a",
                  "dashed": true
                },
                {
                  "from": "k1",
                  "to": "b",
                  "dashed": true
                },
                {
                  "from": "k2",
                  "to": "c",
                  "dashed": true
                },
                {
                  "from": "k3",
                  "to": "e",
                  "dashed": true,
                  "tone": "rust",
                  "bold": true
                },
                {
                  "from": "k4",
                  "to": "e",
                  "dashed": true,
                  "tone": "rust",
                  "bold": true
                }
              ]
            },
            {
              "type": "text",
              "heading": "Choosing the key: where sharding designs actually fail",
              "body": "The mechanics above are commodity; the **partition key** is the design decision, and it is governed by one principle: *the dominant query must be answerable by a single shard*. Route the query list from *Model the Queries, Not the World* at the sharded table and read off the candidates. For Lens's photos, sharding by `photo_id` spreads perfectly — and shatters the profile grid and feed probes, which read *by owner*: every 'photos of user X' becomes a scatter-gather across all P shards. Sharding by `owner_id` keeps each user's photos together — profile grid: one shard; feed's 200 followee probes: ~200 shard hits but each a cheap indexed probe (no worse than before, and cacheable) — at the price of **skew**: owners are not uniform. A celebrity with 80 M followers doesn't unbalance *storage* by much (their photo count is ordinary), but read traffic to their shard spikes with their fame; and an ingest workload keyed by a monotonically increasing value (timestamps) sends *all* writes to one range shard, the hot-tail. The standard repairs, in escalation order: a compound key that spreads the hot entity (e.g. (owner_id, hash-suffix) splitting one celebrity across several shards, reads merging them), caching in front of the hot shard (unit 3), or restructuring the workload itself so the hot reads don't hit the shard at all — which for Lens's celebrity *feed* problem is exactly the fan-out redesign unit 4 and unit 6 build. Skew is not an edge case; assume every real workload has a power-law key and design the escape hatch on day one."
            },
            {
              "type": "example",
              "heading": "Worked example: sharding the messaging table",
              "body": "Take unit 1's messaging service at scale: 800 M messages/day (~300 B each), 25 k writes/s peak, 5-year retention ≈ 500 TB and ~1.5 T rows — decisively past one machine on every axis. Run the method.\n\n**Dominant queries**: (1) load recent messages of conversation c, newest first, paginated — the hot path, latency-budgeted; (2) append message to c; (3) rare: search within a conversation. Both hot queries are *per-conversation*.\n\n**Key**: `conversation_id` — query 1 and 2 each touch exactly one shard. Within a shard, cluster rows by (conversation_id, message_id-descending) so a conversation's recent page is one contiguous scan (the composite-index habit, now doing physical placement). Sharding by `message_id` would spread writes beautifully and make every conversation load a P-way scatter-gather — the wrong key by the principle. Sharding by `sender_id` fails differently: a conversation's messages scatter across its members' shards, so reads must gather and merge — and group chats make it worse.\n\n**Skew check**: conversations are power-law too (a 50 k-member group vs a DM), but per-conversation write rate is bounded by human typing speed, and a mega-group's *reads* are the true hot spot — mitigations: cache the recent page (unit 3), and cap or specially-handle broadcast-style channels (a product decision to extract, not invent).\n\n**Routing**: consistent hashing with virtual nodes over conversation_id; growth from 40 to 44 nodes moves ~9% of conversations (K·4/44), migrated shard-arc by shard-arc with dual-read during the move. The whole design is four sentences and every sentence traces to a query or a number — that is what a defensible sharding proposal looks like."
            },
            {
              "type": "example",
              "heading": "Worked example: the resharding bill, computed",
              "body": "Make the modulo-vs-ring difference concrete with the messaging fleet. Dataset: 500 TB across 40 nodes (12.5 TB each); we add 4 nodes (10% capacity growth).\n\n**Modulo routing**: fraction unmoved is at best gcd-luck; generically ~40/44 of keys change shard → **~455 TB migrates**. At 1 GB/s of migration bandwidth per node that the fleet can spare without hurting production traffic (say 20 GB/s aggregate), that is ~6.3 hours of pure transfer — in practice days, because migration competes with live traffic, and every cached location for ~90% of keys is invalidated at cutover: a full-fleet event with a full-fleet blast radius.\n\n**Consistent hashing**: expected movement = K × 4/44 ≈ 9% → **~45 TB**, one-tenth the bill, and — the operationally decisive part — the movement is *localized*: only the arcs the new nodes claim are in motion; 90% of the fleet's keys, caches, and connections are untouched. New nodes warm up incrementally, the migration can pause safely at any arc boundary, and a failed migration rolls back by abandoning claimed arcs.\n\nSame growth event, order-of-magnitude different risk — purchased by one routing-layer decision made before the first shard existed. This is why the method insists the routing scheme is part of the *initial* sharding design: retrofitting consistent hashing under 500 TB of live modulo-placed data is itself a near-full-fleet migration."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Everything cross-shard gets worse, and 'we'll just do a distributed transaction' is not a plan.** Joins become scatter-gather with tail-latency amplification — the slowest of P shards sets your p99 (at P = 100, a per-shard p99 of 50 ms means the *typical* full fan-out sees ~its p99.99). Multi-key transactions need two-phase commit, whose coordinator is a new failure mode. Global secondary indexes must be either local-per-shard (reads scatter) or globally partitioned (writes scatter). The honest design keeps cross-shard operations off the hot path by key choice, and where one survives, names its cost explicitly."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The dataset forcing function now has its full answer: split by a partition key chosen so the dominant queries stay single-shard, route with consistent hashing plus virtual nodes so membership changes move only their fair share (the K/n theorem), expect power-law skew and pre-plan its escape hatch, and treat every surviving cross-shard operation as a named, budgeted expense. One consequence has been accumulating all unit: between replication (unit 1's availability purchase) and partitioning (this lesson), the truth now lives in many places, and readers can observe different moments of it. Which observations the *product* can tolerate — and which it cannot — is a requirements question, not an infrastructure one, and it closes the unit next."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A cluster grows from 8 to 10 nodes holding 200 M keys. Compute the expected keys moved under (a) consistent hashing (nodes added one at a time — compute both steps) and (b) modulo rehashing directly from 8 to 10. State the general principle each number illustrates.",
                  "solution": "(a) Adding the 9th node moves K/9 = 200M/9 ≈ 22.2 M; adding the 10th moves K/10 = 20 M; total ≈ **42 M keys (~21%)** — and each step moves only keys claimed by the new node. (Equivalently: final share of the 2 new nodes = 2/10 of keys = 40 M; the two-step sum is slightly higher because a few keys can move twice — either accounting accepted.) (b) Modulo 8 → 10: a key stays only if h mod 8 = h mod 10, i.e. h mod 40 ∈ {0,…,7} → 8/40 = 20% stay, **160 M keys (80%) move**, scattered arbitrarily between old nodes. Principle: consistent hashing moves O(added capacity fraction) and localizes it to the new nodes; modulo moves O(everything) and delocalizes it — the difference between an incremental warm-up and a full-fleet migration event.",
                  "hint": "Ring: each new node claims 1/(current n+1) in expectation. Modulo: count residues where h mod 8 = h mod 10 over lcm = 40."
                },
                {
                  "prompt": "Choose and defend a partition key for each table, naming the dominant query and the skew risk: (a) ride-hailing trips, hot query 'driver's trips today' and 'rider's trip history'; (b) IoT readings from 500 k devices, hot query 'device d, last 24 h'; (c) an ads clickstream whose hot query is 'total clicks per campaign per hour', with 3 campaigns generating 60% of traffic.",
                  "solution": "(a) There are *two* per-entity hot queries with different keys — no single key serves both single-shard. Options: shard by rider_id (rider history local; driver query scatters) or maintain **two copies keyed differently** (trips-by-rider and trips-by-driver), each written on trip completion — the derived-copy ledger from *Choosing the Store*, now applied to sharding; at trip volumes (thousands/s) the double-write is affordable and both hot queries stay single-shard. (b) **device_id** (or (device_id, day)): the query is per-device time-range → one shard, rows clustered by time within the device; skew is low (devices emit comparably), and the hot-tail trap to avoid is keying by timestamp alone, which would write everything to the last range shard. (c) campaign_id makes the aggregate single-shard but the 3 whale campaigns (60% of writes) hammer 3 shards — the celebrity problem on writes. Repair with a compound key **(campaign_id, hash(click_id) mod 16)**: each whale spreads over 16 sub-shards; the hourly aggregate reads 16 partials and sums — a 16-way gather on the *cheap, infrequent* query to buy uniform spread on the *hot, constant* write path. That direction of trade (scatter the rare read, never the hot write) is the transferable rule.",
                  "hint": "For each: write the dominant query as WHERE-clauses, and ask what fraction of traffic the biggest key attracts."
                },
                {
                  "prompt": "Lens at 100 M DAU shards photo metadata by owner_id across 64 shards. The feed service, rendering a user following 300 accounts, now issues probes to up to 64 shards. Per-shard probe latency: p50 = 4 ms, p99 = 40 ms. Estimate the feed's tail latency and explain the mechanism; then name two design responses (and where this course develops them).",
                  "solution": "The feed waits for its *slowest* probe. With ~64 parallel probes, P(all ≤ their p99) = 0.99⁶⁴ ≈ 0.53 — so roughly *half* of all feed loads experience at least one 40 ms-class straggler: the per-shard p99 becomes the fan-out's p50. Tail: to have 99% of feed loads fast, each probe must be fast at the 0.99^(1/64) ≈ 0.99984 quantile — the feed's p99 is governed by each shard's p99.98, deep in the noise of GC pauses and page misses. Mechanism: tail-latency amplification — fan-out width converts per-node rare events into whole-request common ones (Dean & Barroso's 'tail at scale'). Responses: (1) **shrink the fan-out on the read** — precompute per-user feeds at write time (fan-out-on-write), the redesign units 4 and 6 build; (2) **cache the probes** — per-followee recent-photo lists in a shared cache absorb the scatter (unit 3); (honorable mentions: request hedging — send a duplicate probe when a straggler is detected.) The exercise's real lesson: sharding was correct, and it *still* manufactured a tail problem — every scale purchase creates the next constraint, which is the method's loop working as designed.",
                  "hint": "P(all n probes ≤ t) = P(one ≤ t)ⁿ. What per-probe quantile must t be for the whole fan-out's p99?"
                },
                {
                  "prompt": "A team must reshard a 30-shard, 90 TB modulo-routed cluster (they've learned this lesson one migration too late) to consistent hashing with virtual nodes, with zero downtime. Sketch the migration plan: how reads and writes behave mid-migration, how progress is tracked, and what makes it abortable.",
                  "solution": "Phase 0 — deploy a routing layer that knows *both* schemes and a per-key (or per-arc) migration state. Phase 1 — dual-write: writes go to the new-scheme location and (for safety) the old, reads still served from old; this bounds divergence. Phase 2 — backfill arc by arc: copy each ring arc's keys from old locations to new, verifying checksums; an arc is the unit of progress, tracked in a migration table. Phase 3 — cut reads over per arc: once an arc is backfilled and dual-writes have covered the copy window, serve reads from new locations for that arc (read-repair any stragglers: on miss, fall back to old, copy forward). Phase 4 — stop old writes for completed arcs, then decommission old placement when all arcs complete. Abortability: at any point, an arc not yet read-cutover can be abandoned (new copies discarded — old locations were never stale, thanks to dual-write); the arc granularity is what makes both progress and rollback incremental. The two invariants worth naming: no moment exists where a key has *no* authoritative location, and reads never observe going-backwards state (old is authoritative until an arc's cutover, atomically per arc). This — not a weekend of downtime — is what 'we'll just reshard' actually costs, which is the argument for choosing routing correctly at design time.",
                  "hint": "Dual-write first, backfill in trackable units, cut reads per unit, keep the old copy authoritative until each unit's cutover."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u2l3-i1",
              "front": "The partition-key principle?",
              "back": "The dominant query must be answerable by a single shard: write the hot queries as WHERE-clauses and pick the key they constrain (messages → conversation_id, device readings → device_id). Then check the biggest key's traffic share for skew."
            },
            {
              "id": "u2l3-i2",
              "front": "Hash vs range partitioning — the trade?",
              "back": "Hash: uniform spread, destroys order (range queries scatter). Range: preserves order for scans, concentrates load — monotonic keys (timestamps) write only to the last shard (hot-tail). Choose by whether ordered scans or uniform spread dominates."
            },
            {
              "id": "u2l3-i3",
              "front": "Consistent hashing — the movement theorem?",
              "back": "Nodes and keys on a ring, ownership = first node clockwise: adding a node moves only expected K/(n+1) keys (its claimed arc), none between survivors; removal moves only the leaver's K/n. Modulo re-hashing moves ~n/(n+1) of everything."
            },
            {
              "id": "u2l3-i4",
              "front": "What do virtual nodes fix?",
              "back": "Single random ring positions give wildly uneven arcs (some node owns Θ(log n/n)). ~100–1000 positions per physical node make each share a sum of many small arcs — concentrating near 1/n — and scatter a departed node's load across many successors."
            },
            {
              "id": "u2l3-i5",
              "front": "Tail-latency amplification under scatter-gather?",
              "back": "A fan-out of n parallel probes completes at the slowest: P(all fast) = pⁿ, so per-shard rare slowness becomes whole-request common (64 probes: per-shard p99 ≈ request p50). Fixes: shrink fan-out (precompute), cache probes, hedge stragglers."
            },
            {
              "id": "u2l3-i6",
              "front": "Escalation for a hot partition key (celebrity/whale)?",
              "back": "Compound key to spread the hot entity across sub-shards (scatter the rare read, never the hot write) → cache in front of the hot shard → restructure the workload (e.g. fan-out-on-write) so hot reads stop hitting the shard."
            }
          ]
        },
        {
          "id": "u2l4",
          "title": "The Consistency You Actually Need",
          "estMinutes": 24,
          "builds_on": [
            "u2l3",
            "u1l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Many copies, many moments",
              "body": "Every purchase this unit made put the truth in more places. Replication (bought for availability in *One Machine First*) means a write lands on a primary and reaches replicas milliseconds to seconds later. Partitioning spread the keys; derived copies (search indexes, caches, counts) lag their sources by design. The consequence: two reads at the same instant can observe **different moments of the database** — a photo posted, then absent from its poster's own refreshed profile because the read hit a lagging replica; a like-count of 41 here and 43 there.\n\nThe untrained response is to demand that everything be current everywhere — which is unaffordable (it serializes the very copies bought for scale and availability), and, decisively, *unnecessary*: products tolerate staleness wildly unevenly across features. Nobody notices a like-count ten seconds behind; everybody notices their own upload vanishing. So the design skill is not choosing 'a consistency level' for the system; it is **mapping each product interaction to the weakest guarantee that doesn't produce a user-visible lie**, then implementing exactly that. This lesson builds the vocabulary of guarantees, proves the quorum rule that anchors them, and writes Lens's map."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The staleness spectrum and session guarantees",
              "statement": "For replicated data, ordered from strongest to weakest cost-and-guarantee:\n\n• **Linearizable** reads: every read observes the latest completed write, system-wide, as if one copy existed. (Required rarely: uniqueness checks, balances, inventory.)\n• **Bounded staleness**: reads may lag by at most a stated bound (time or versions).\n• **Session guarantees** — per-user promises that repair the worst anomalies cheaply: **read-your-writes** (a user always observes their own completed writes), **monotonic reads** (a user never observes the database going backwards between successive reads).\n• **Eventual consistency**: replicas converge if writes stop; any individual read may be stale with no bound. (Vogels' formulation — the default state of any asynchronous copy.)\n\nThe engineering pattern: global guarantees are expensive because they constrain *all* copies; session guarantees are cheap because they constrain only *one user's* view — and most user-visible anomalies are violations of the session guarantees, not of linearizability."
            },
            {
              "type": "diagram",
              "kind": "sequence",
              "caption": "The read-your-writes violation: the upload commits on the primary, but the poster's next read hits a replica the write hasn't reached. The fix constrains only this user's next read — primary-pinning or an LSN floor — not the whole system.",
              "actors": [
                "Poster",
                "Primary",
                "Replica",
                "Feed service"
              ],
              "messages": [
                {
                  "from": "Poster",
                  "to": "Primary",
                  "label": "POST /photos (commit)",
                  "tone": "sage"
                },
                {
                  "from": "Primary",
                  "to": "Poster",
                  "label": "201 Created",
                  "tone": "sage"
                },
                {
                  "from": "Primary",
                  "to": "Replica",
                  "label": "replicate (in flight…)",
                  "dashed": true,
                  "tone": "rust"
                },
                {
                  "from": "Poster",
                  "to": "Feed service",
                  "label": "GET /profile (my photos)"
                },
                {
                  "from": "Feed service",
                  "to": "Replica",
                  "label": "read photos WHERE owner=me"
                },
                {
                  "from": "Replica",
                  "to": "Feed service",
                  "label": "…photo missing",
                  "tone": "rust"
                },
                {
                  "from": "Feed service",
                  "to": "Poster",
                  "label": "profile without the new photo — a visible lie",
                  "tone": "rust"
                },
                {
                  "note": "fix: route this user's reads to Primary briefly, or demand replica ≥ write's LSN"
                }
              ]
            },
            {
              "type": "text",
              "heading": "Implementing the session guarantees",
              "body": "The anatomy of the fix follows from the diagram. **Read-your-writes**, three standard implementations, cheapest first: (1) *primary-pinning with a timer* — after a user writes, route that user's reads to the primary for a window comfortably above replication lag (say 10–60 s); trivially correct, costs primary read load proportional to recent writers only. (2) *LSN/version floors* — the write returns its log position; the client (or session store) carries it, and reads are served by any replica whose replay position has passed the floor, waiting or falling back to primary otherwise; precise, no timer guesswork, and this is what 'causal token' APIs in real databases implement. (3) *sticky sessions* — a user's session always reads the same replica, giving monotonic reads for free and read-your-writes once that replica catches up; fragile under failover, and it concentrates a user on one box — the stateless-tier warning from unit 1 applied to reads. **Monotonic reads** come free from (2) and (3), and from (1) within the window. The unifying observation: all three implementations are *routing policies* — the replicas themselves are untouched; consistency here is a property of *which copy you are allowed to read*, which is why session guarantees cost so much less than making every copy current."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "The quorum overlap rule",
              "statement": "Store each key on N replicas; require acknowledgment from W replicas per write and responses from R per read. If **W + R > N**, then every read quorum intersects every write quorum — each read contacts at least one replica holding the most recently acknowledged write (which version-tagging then identifies). If W + R ≤ N, a read can complete entirely on replicas the last write never touched.",
              "proof": "Let a write be acknowledged by a set 𝒲 of replicas, |𝒲| = W, and a subsequent read gather responses from a set ℛ, |ℛ| = R. Both are subsets of the same N replicas. If 𝒲 and ℛ were disjoint, the replica set would contain at least |𝒲| + |ℛ| = W + R > N distinct members — impossible with N replicas. Hence 𝒲 ∩ ℛ ≠ ∅: some responder holds the acknowledged write. Tag every write with a monotonically increasing version (per key); the reader returns the highest-versioned value among its R responses, which by the intersection includes the latest acknowledged one. For the converse: if W + R ≤ N, choose 𝒲 and ℛ disjoint (possible since W + R ≤ N); the read's responders all hold only older versions, and the read returns stale data with no indication. ∎\n\nTwo honest caveats the proof exposes. The rule guarantees the read *contacts* fresh data, not that concurrent writes have an order — overlapping writes need a versioning discipline (last-write-wins timestamps, or vector clocks — unit 5 builds this into the KV store). And W, R trade durability, latency, and availability: N=3, W=2, R=2 tolerates one down node for both operations; W=3 makes writes fragile (any node down blocks them); W=1, R=1 is fast and can lose acknowledged writes with one crash. The rule is one inequality, but the *setting* of W and R is a requirements decision — which is this lesson's whole thesis."
            },
            {
              "type": "example",
              "heading": "Worked example: quorum arithmetic under failure",
              "body": "N = 3 replicas of a session-token store across three zones; evaluate configurations against requirements 'reads must reflect completed writes' and '99.9% availability through one-zone loss'.\n\n**W=2, R=2**: 2+2 > 3 ✓ overlap. One zone down: writes still reach 2 of the surviving 2 ✓; reads gather 2 of 2 ✓ — both paths survive any single failure. Latency: each operation waits for the *faster of the remaining* after the first ack (the straggler among 2-of-3 is hidden). This is the balanced default.\n\n**W=3, R=1**: overlap ✓ and reads are single-replica cheap — but any one replica down **blocks all writes**: the availability requirement fails. Legal only where writes are rare and reads must be maximally cheap.\n\n**W=1, R=1**: 1+1 ≤ 3 — no overlap. A write acked by replica A alone, followed by a read served by replica B, returns stale data silently; worse, if A's disk dies before replicating, the *acknowledged* write is gone — durability of one disk, dressed as replication. Legal only for data whose loss is priced in (a cache).\n\n**W=2, R=1**? 2+1 ≤ 3 — a read can hit the one replica the write skipped. The tempting 'writes are safe, reads are fast' intuition fails the inequality; if single-replica reads are required, the design must add read-repair or accept the staleness explicitly.\n\nThe drill: check the inequality, then walk each configuration through 'one node down' before believing its availability."
            },
            {
              "type": "example",
              "heading": "Worked example: Lens's consistency map",
              "body": "Write the map feature-by-feature, weakest sufficient guarantee first — this artifact, one line per interaction, is deliverable-grade design output:\n\n• **Upload acknowledgment** → durable-on-commit (synchronous replication of the metadata row + object-store put before the 201): the requirement ranked durability above all in *Scoping Lens*; this is a durability demand, not a read-consistency one.\n• **Poster's own profile/feed after upload** → **read-your-writes** via LSN floor or 60 s primary-pinning: the vanishing-upload lie is the worst anomaly the product can show, and it costs one routing rule.\n• **Followers' feeds** → eventual, bound ~10 s: extracted and granted in unit 1; this grant is precisely what will make asynchronous fan-out legal in unit 4 — requirements written early paying rent later.\n• **Like counts** → eventual, no strict bound; drift repaired by reconciliation (the *Model the Queries* template). Approximate is priced in.\n• **Unfollow** → read-your-writes for the actor (their feed must stop showing the unfollowed account immediately — monotonic too: it must not flicker back), eventual for everyone else.\n• **Handle uniqueness at signup** → the one **linearizable** operation on the map: check-and-claim must see the latest state or two users claim @kai; implemented as a unique constraint on the primary — scope the strong guarantee to the single write that needs it.\n\nSix lines, five different guarantees, exactly one of them expensive — and the expensive one scoped to a single-row constraint. That asymmetry, not any single choice, is the lesson."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**Staleness grants are product decisions — collect them in writing.** 'Feed may lag 10 s', 'counts are approximate', 'search finds photos within a minute' are requirement extractions (unit 1's discipline), and they are the *permits* that authorize every asynchronous mechanism the rest of the course builds: replicas, derived stores, queues, fan-out. A grant assumed but never surfaced becomes a bug report; a grant surfaced and refused becomes a (costly, but honest) synchronous design. Either way the decision belongs to the product, made visible."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "For a collaborative doc editor, map each interaction to the weakest sufficient guarantee, with one sentence of justification: (a) a user reopening a doc they just edited on the same device; (b) a collaborator's view of those edits; (c) the doc's 'last modified' timestamp in a folder listing; (d) checking a share-link password.",
                  "solution": "(a) **Read-your-writes** — seeing your own edit missing is the vanishing-upload lie; session-scoped, cheap (LSN floor / primary pin). (b) Near-real-time but **eventual with a tight bound** (sub-second via the sync channel): collaborators tolerate a moment of lag — they cannot tolerate divergence, so convergence machinery (OT/CRDT) matters more than read freshness. (c) **Eventual, loose bound** — a folder listing seconds stale misleads no one; don't spend routing budget here. (d) **Linearizable** (or at minimum bounded-staleness on the deny side): a just-revoked or just-changed password must not admit anyone — authorization checks read the latest state or fail closed. Pattern to notice: the expensive guarantee lands on the *security* interaction, not the collaborative hot path — mapping by consequence-of-a-lie, not by feature importance.",
                  "hint": "For each, ask: what lie does a stale read tell, and who sees it?"
                },
                {
                  "prompt": "N = 5. For each configuration, state whether reads are guaranteed fresh, how many simultaneous node failures writes and reads each survive, and name a workload it fits: (a) W=3, R=3; (b) W=4, R=2; (c) W=1, R=5; (d) W=2, R=2.",
                  "solution": "(a) 3+3=6 > 5 ✓ fresh; writes survive 2 down (need 3 of 5), reads survive 2 → the symmetric default for important data. (b) 4+2=6 > 5 ✓ fresh; writes survive only 1 down (need 4), reads survive 3 — read-heavy data where cheap-ish fresh reads (2 responses) justify fragile writes; write availability is the sacrifice. (c) 1+5=6 > 5 ✓ fresh — but reads need *all five* nodes: any single failure blocks all reads; writes survive 4 down. Pathological outside 'write-mostly archive with rare audited reads'. (d) 2+2=4 ≤ 5 ✗ — reads may miss the latest write entirely; both operations are fast and survive 3 down. Fits caches and metrics where staleness is priced in. The two-step drill — inequality, then failure walk — catches configuration (c), which passes freshness while silently destroying read availability, the kind of trap a one-line rule invites.",
                  "hint": "Freshness: W+R > N. Write availability: N−W failures. Read availability: N−R failures."
                },
                {
                  "prompt": "A storefront on primary/replica Postgres (async replication, lag typically 200 ms, p99 3 s) routes all reads to replicas. Bug report: 'I renamed my shop, hit save, the page reloaded and showed the old name; a second refresh fixed it.' Diagnose precisely, then propose the minimal fix and state what it costs.",
                  "solution": "Diagnosis: a read-your-writes violation, textbook: the save commits on the primary; the post-save page load reads a replica that hasn't replayed the commit (within the 200 ms–3 s lag window); the second refresh lands after replay. It is not a caching bug (the second refresh would then still lie) and not eventual-consistency-as-such — the *system* is behaving as configured; the *map* is wrong: this interaction needed a session guarantee the routing doesn't provide. Minimal fix: after any write in a session, pin that session's reads to the primary for max(observed lag p99, safety margin) ≈ 5–10 s — one routing-layer rule keyed on 'wrote recently'. Cost: primary serves read traffic proportional to (writers in the last 10 s) × (their read rate) — for a storefront (writes are rare edits), a rounding error of extra primary load; measure and confirm. The precise alternative (LSN floor: save returns the commit LSN, subsequent reads require replica_replay ≥ LSN) costs plumbing but no timer guesswork — the upgrade path if pinning load ever matters. What's NOT justified: synchronous replication for all writes — that buys a global guarantee to fix a session-scoped anomaly, exactly the over-purchase this lesson exists to prevent.",
                  "hint": "Which specific guarantee does 'I don't see my own save' violate, and what is the narrowest mechanism that provides just that guarantee?"
                },
                {
                  "prompt": "Lens ships the consistency map from this lesson. A product review then adds: 'when a user blocks another user, the blocked user must stop seeing the blocker's photos immediately.' Place this on the map — which guarantee, enforced where — and explain why the feed's eventual-consistency grant does NOT cover it, plus what the enforcement costs.",
                  "solution": "The 10 s feed grant covered *content freshness* — a new photo arriving late misleads no one. Blocking is an *authorization revocation*: continuing to serve the blocker's photos to the blocked user after the block is a safety/abuse failure, and 'eventually stops' is not a defensible answer in a harassment scenario — the consequence-of-a-lie test puts it with handle-uniqueness in the strong tier, not with feed freshness. Guarantee: effectively **read-time enforcement against current block state** — every feed/profile/photo read for viewer v filters against blocks(v, owner) checked at serve time, from a store read either linearizably or with staleness bounded to ~a second (a replicated block-list cache with sub-second invalidation is the practical implementation). Enforcement cannot live (only) in the precomputed feed: unit 4's fan-out will have already placed the blocker's photos in the blocked user's feed *before* the block existed — precomputed artifacts are stale by construction, so revocations must be enforced downstream of them, at read time. Cost: one additional check per rendered item (a set-membership probe against an in-memory structure — microseconds, from the latency table) plus the block-store's replication machinery; the design lesson is that *revocation-shaped* requirements (blocks, bans, takedowns, permission changes — compare the takedown exercise of unit 1) always land on the read path, because every asynchronous copy upstream of it is allowed to be wrong.",
                  "hint": "Is a stale read here a freshness annoyance or an authorization failure? Where is the last point that can enforce current truth over precomputed state?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u2l4-i1",
              "front": "The staleness spectrum, strongest to weakest?",
              "back": "Linearizable (every read sees the latest write) → bounded staleness → session guarantees (read-your-writes, monotonic reads — per-user promises) → eventual (converges if writes stop, no per-read bound). Cost falls with the guarantee's scope."
            },
            {
              "id": "u2l4-i2",
              "front": "Why are session guarantees so much cheaper than global ones?",
              "back": "They constrain only one user's view, implemented as routing policies (primary-pinning after writes, LSN floors, sticky replicas) — the copies themselves stay asynchronous. Most user-visible anomalies are session-guarantee violations, so the cheap tier fixes the visible lies."
            },
            {
              "id": "u2l4-i3",
              "front": "Quorum overlap rule — statement and proof idea?",
              "back": "With N replicas, W write acks, R read responses: W+R > N ⇒ every read quorum intersects every write quorum (pigeonhole: disjoint sets would need W+R ≤ N members), so some responder holds the latest acked write (version tags pick it). W+R ≤ N ⇒ silent stale reads possible."
            },
            {
              "id": "u2l4-i4",
              "front": "N=3: what do W=2,R=2 vs W=3,R=1 vs W=1,R=1 each buy?",
              "back": "2/2: overlap + both paths survive one failure — the balanced default. 3/1: cheap fresh reads but any node down blocks writes. 1/1: fast, no overlap, acked writes can vanish with one disk — cache-grade only. Always run the one-node-down walk."
            },
            {
              "id": "u2l4-i5",
              "front": "Which interactions demand the strong tier on a consistency map?",
              "back": "Check-and-claim uniqueness, balances/inventory, and revocations (blocks, bans, permission changes, takedowns) — consequence-of-a-lie interactions. Revocations must be enforced at read time: precomputed copies upstream are stale by construction."
            },
            {
              "id": "u2l4-i6",
              "front": "What is a 'staleness grant' and why write it down?",
              "back": "An extracted product decision that a feature tolerates lag ('feed ≤10 s', 'counts approximate'). Grants are the permits authorizing every async mechanism (replicas, derived stores, fan-out); unstated grants surface as bug reports."
            }
          ]
        }
      ],
      "masteryCheck": {
        "id": "u2-check",
        "questions": [
          {
            "id": "u2q1",
            "type": "numeric",
            "prompt": "A consistent-hashing ring holds 100 M keys on 4 nodes. A 5th node is added. In expectation, how many keys move to the new node? (Answer in millions.)",
            "answer": 20,
            "tolerance": 2,
            "points": 1,
            "explanation": "After insertion the 5 symmetric nodes each own an expected 1/5 of the ring, and the only keys that move are those in the arc the new node claims: K/(n+1) = 100M/5 = 20 M. Modulo rehashing would have moved ~80 M (4/5 of everything) — the theorem is the difference between warming up one node and migrating the fleet."
          },
          {
            "id": "u2q2",
            "type": "numeric",
            "prompt": "A replicated store uses N = 5 copies per key and requires W = 3 acknowledgments per write. What is the minimum R (replicas consulted per read) that guarantees every read contacts at least one replica holding the latest acknowledged write?",
            "answer": 3,
            "tolerance": 0,
            "points": 1,
            "explanation": "The overlap rule requires W + R > N: R > 5 − 3 = 2, so R = 3. In general R_min = N − W + 1. With R = 2 a read can land entirely on the two replicas the write skipped, returning stale data with no indication — the inequality is exactly the pigeonhole that forbids this."
          },
          {
            "id": "u2q3",
            "type": "short",
            "prompt": "A messaging system's two hot queries are 'append message to conversation c' and 'load recent messages of conversation c, newest first.' The messages table must be sharded. What should the partition key be? (One term.)",
            "accept": [
              "conversation id",
              "conversation_id",
              "the conversation id",
              "conversationid",
              "conversation"
            ],
            "points": 1,
            "explanation": "The partition-key principle: the dominant queries must stay single-shard. Both hot queries are per-conversation, so conversation_id sends each to exactly one shard (with rows clustered by message id/time within it). Keying by message_id would scatter every conversation load; by sender_id would scatter group conversations across members' shards."
          },
          {
            "id": "u2q4",
            "type": "mcq",
            "prompt": "A workload ingests 500 k small writes/s sustained and serves occasional key-range scans; the team is choosing between a B-tree engine and an LSM engine. Which statement correctly captures the trade?",
            "options": [
              "The LSM converts writes to sequential IO and absorbs the ingest, but charges reads (multi-run probes) and pays a compaction bandwidth multiplier of roughly T×levels",
              "The B-tree is preferable because its writes are O(log n) while LSM writes are O(n) due to compaction",
              "The LSM is preferable because it eliminates write amplification entirely; B-trees amplify writes through page splits",
              "Both engines perform identically at this rate since SSDs erase the sequential/random gap"
            ],
            "answer": 0,
            "points": 1,
            "explanation": "Option a states both sides of the actual trade: LSM ingest wins come from sequential IO, paid for with read amplification and ~T·L compaction traffic (the proposition proved in *Choosing the Store*). Option b garbles the asymptotics — LSM logical writes are cheap appends; the T·L factor is a constant multiplier, not O(n). Option c inverts reality: LSMs have *higher* write amplification than B-trees; their advantage is that amplified bytes move sequentially. Option d is folklore — SSDs narrow but don't erase the gap, and sustained random writes also burn flash endurance."
          },
          {
            "id": "u2q5",
            "type": "proof",
            "prompt": "(a) Prove the quorum overlap rule: with N replicas, W write acknowledgments, and R read responses, W + R > N guarantees every read quorum intersects every write quorum. (b) Show by explicit construction that W + R = N permits a silently stale read. (c) A team sets N=3, W=2, R=2 and claims 'reads are therefore always up to date.' Give the precise gap between what the rule guarantees and this claim.",
            "rubric": [
              "Proves intersection by pigeonhole/counting: disjoint quorums would require W + R ≤ N distinct replicas, contradicting W + R > N — stated as a proof, not an assertion",
              "Gives a concrete W + R = N counterexample: e.g. N=4, W=2, R=2 with the write acked by {1,2} and the read served by {3,4} — disjoint, so the read sees only old versions with no indication of staleness",
              "Identifies that the rule only guarantees the read *contacts* a fresh replica: returning the fresh value requires version-tagging writes and taking the highest version among responses",
              "Names at least one further gap: concurrent/overlapping writes have no defined order without a versioning discipline (LWW timestamps, vector clocks), or: a failed/partial write acked by fewer than W leaves replicas divergent and the 'latest acknowledged' notion subtle — so 'always up to date' overclaims"
            ],
            "solution": "(a) Let 𝒲 (|𝒲| = W) be the replicas acknowledging a write and ℛ (|ℛ| = R) the responders to a later read, both ⊆ the N replicas. If 𝒲 ∩ ℛ = ∅ then the replica set contains ≥ W + R > N distinct members — impossible. Hence some replica in ℛ holds the acknowledged write. ∎ (b) N=4, W=2, R=2: write acked by {r1, r2}; read gathers {r3, r4} — legal since 2+2 = 4 allows disjointness — and every response carries the old version; the client cannot detect the staleness from the responses. (c) Two gaps. First, intersection ≠ freshness of the *returned* value: the read merely contacts one fresh replica among R responses; without per-write version tags (and returning the max), the client might return a stale responder's value. Second, versioning itself: two concurrent writes each acked by W replicas produce divergent values whose 'latest' is undefined without an ordering discipline — last-write-wins timestamps silently drop one write; vector clocks surface the conflict for resolution. So the honest claim is: 'a read quorum always *contains* the most recently acknowledged version, and our version-resolution rule determines what we return — for concurrent writes, that rule, not the quorum, decides.' ∎",
            "points": 3,
            "explanation": "The overlap rule is one inequality, but real systems live in its caveats: version tagging makes intersection useful, and concurrent-write resolution (LWW vs vector clocks) is a separate design decision the inequality does not make for you — unit 5 builds exactly this machinery into the Dynamo-style store."
          },
          {
            "id": "u2q6",
            "type": "open",
            "prompt": "Design the data layer for a fitness-tracking platform: 30 M DAU; each user's watch uploads a workout summary (~2 KB) about twice daily, and a heart-rate time series (~1 sample/s during workouts, ~1 hour/day → ~3,600 points/day per user, 16 bytes/point after packing); hot queries are (1) a user's own dashboard — recent workouts + charts of any single workout, p99 300 ms, (2) their own dashboard immediately after a workout syncs, (3) a weekly leaderboard among each user's friends (may lag hours). Deliver: (a) the capacity arithmetic that identifies what binds; (b) store selection per data class with the amplification/capability reasoning; (c) the partition key(s) with skew analysis; (d) the consistency map for the three queries.",
            "rubric": [
              "Arithmetic separates the two data classes and identifies the binding one: summaries ~60 M/day ≈ 700/s of 2 KB rows (modest, relational-friendly); HR series 30M × 3,600 × 16 B ≈ 1.7 TB/day (~600+ TB/yr) and ~100 B points/day — time-series volume binds storage and ingest, not the summaries",
              "Stores match the classes with reasons: summaries in relational OLTP (transactions, ad-hoc queries, trivial rate); HR series in an LSM/time-series store keyed for sequential per-user-per-workout reads, with compression (delta/delta-of-delta) explicitly invoked to cut the TB/day; leaderboard as a derived/batch product (columnar or precomputed aggregates) with its staleness grant — and no unjustified stores",
              "Partition key derived from the hot queries: user_id (or (user_id, workout_id/time)) so dashboard and post-sync reads are single-shard; skew analysis notes per-user load is bounded by human behavior (no celebrity problem in personal data) while the leaderboard's friend-fan-out is kept off the hot path by precomputation; timestamp-only keying called out as the hot-tail trap",
              "Consistency map assigns: dashboard reads → eventual with tight bound or session-default (own data, single home shard makes this near-free); post-sync dashboard → read-your-writes explicitly (the vanishing-workout lie), via LSN floor/primary pin or write-then-read-own-shard; leaderboard → eventual with an hours-grade grant, stated as a product permit — each with one-line justification",
              "Every component is paid for by a number or requirement from the prompt, and at least one explicit assumption is stated (peak factor, retention horizon, workout concurrency) rather than smuggled"
            ],
            "solution": "(a) Arithmetic. Summaries: 30M × 2/day = 60 M/day ≈ 700/s average (~2 k/s peak ×3), × 2 KB ≈ 120 GB/day of rows — relational-scale traffic, though row count (22 B/yr) will eventually want partitioning. HR series: 30M users × 3,600 pts × 16 B ≈ 1.7 TB/day logical (~620 TB/yr; state retention — say 2 years hot ≈ 1.2 PB) at ~100 B points/day ≈ 1.2 M points/s average, 3–4 M/s peak (workouts cluster morning/evening — assumption stated). Verdict: the time series binds everything — ingest rate rules out in-place B-tree engines (per the write-amplification physics), and volume rules out single-node anything. (b) Stores. Summaries + social graph + profiles: relational OLTP — 700/s is trivial, transactions and ad-hoc product queries are free value. HR series: LSM-based time-series store, keys (user_id, workout_id, timestamp) so each workout's points are contiguous; delta-of-delta/XOR compression cuts ~16 B/point to ~2 B (state the Gorilla-style assumption): 1.7 TB/day → ~200 GB/day physical before replication — cluster sized by ingest × compaction amplification per the T·L proposition. Leaderboard: precomputed weekly aggregates (a batch job into a small relational/columnar table) — a derived copy with an hours-stale grant; no live store earns a place. (c) Partitioning. Both hot stores key by user_id first: dashboard (recent workouts: summary table, single shard; one workout's chart: one contiguous series range, single shard) and post-sync reads stay single-shard. Skew: personal-data workloads have no celebrity — per-user write rate is capped by owning one body (≤ a few concurrent workouts is even an integrity check); the friend-leaderboard's fan-out (read 50 friends' totals) is the one scatter-shaped query, and it's precomputed precisely to keep the scatter in batch, off the hot path. Hot-tail trap named: keying series by timestamp alone would aim the 1.2 M pts/s firehose at one range shard. (d) Consistency map. (1) Dashboard → eventual, tight bound; own-shard reads make it effectively fresh; no routing spend. (2) Post-sync dashboard → read-your-writes, explicitly: the watch syncs, the phone refreshes — a missing just-finished workout is the vanishing-upload lie; LSN floor (sync response carries the write position; dashboard read waits for it) or 30 s primary-pin. (3) Leaderboard → eventual, grant 'updates within a few hours', written down as a product permit; friends who just finished a run appearing next cycle is priced in. Assumptions stated: ×3 peak factor, 2-year hot retention, ~10× compression, workouts diurnally clustered. Everything on the diagram traces to a number in the prompt.",
            "points": 3,
            "explanation": "The scenario is engineered so both engine families and three consistency tiers are all *correct somewhere* — the grade rides on routing each data class to its store by amplification arithmetic, keeping hot queries single-shard by key choice, and spending consistency budget only on the read-your-writes interaction. A maximal answer (everything strongly consistent, everything in one exotic store) fails the same way an underpowered one does: components and guarantees nobody paid for."
          }
        ]
      }
    },
    {
      "id": "u3",
      "title": "The Read Path",
      "summary": "Caching bought with arithmetic: the cache hierarchy and its hit-ratio math, invalidation and stampede correctness, CDNs and the media pipeline, and derived read models for reads the source can't shape.",
      "intro": "Unit 2 built the authoritative data layer — modeled, engine-matched, partitioned, and consistency-mapped. But the arithmetic of unit 1 said something the data layer alone cannot answer: Lens is 150:1 read-dominated, its media egress is measured in terabytes per day, and its geography exercise showed a p99 that physics forbids the origin to meet for far-away users. The read path is where those numbers get paid. This unit builds it in four layers of increasing distance from the source of truth: the cache hierarchy and the hit-ratio arithmetic that justifies each level; the correctness problems caching creates — staleness, invalidation races, and the stampedes that turn an expired key into an outage; content delivery networks, where immutable media and content-addressed URLs make near-perfect caching legal; and derived read models, for reads whose *shape* the source tables cannot serve efficiently no matter how hot the cache. Throughout, every cache is treated as what it is — a copy, carrying the derived-copy obligations unit 2 established: a staleness grant, a disagreement policy, and a rebuild path. The gate asks you to design a read path end to end and defend its numbers.",
      "references": [
        "Nishtala et al. — Scaling Memcache at Facebook (NSDI 2013)",
        "Martin Kleppmann — Designing Data-Intensive Applications, ch. 11 (derived data, materialized views)",
        "Alex Xu — System Design Interview vol. 1 — CDN, cache patterns",
        "Vattani, Chierichetti & Lowenstein — Optimal Probabilistic Cache Stampede Prevention (VLDB 2015)",
        "Dean & Barroso — The Tail at Scale (CACM 2013)"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u3l1",
          "title": "The Cache Hierarchy and Its Arithmetic",
          "estMinutes": 25,
          "builds_on": [
            "u1l2",
            "u2l4"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Why the read path is a hierarchy",
              "body": "*The Arithmetic of Scale* established the gradient everything in this lesson exploits: RAM answers in ~100 nanoseconds, an SSD in ~100 microseconds, a cross-continent round trip in ~150 milliseconds. A **cache** places a copy of frequently-read data on the cheap side of one of those gaps and lets the expensive side rest. And because there are several gaps — client to edge, edge to datacenter, application to database, database to disk — real read paths are **hierarchies** of caches, each absorbing what its level can hold and passing misses downward.\n\nThe hierarchy for a system like Lens has four working levels. The **client cache** (browser/app) holds what this one user just saw — free latency, zero server cost, invalidated only by TTL. The **CDN edge** holds popular immutable content near users — the media answer, next-to-next lesson. The **application cache** (a shared in-memory tier: Redis/Memcached-class) holds hot query results and objects for *all* users — the level this lesson sizes. And the **database's own buffer pool** holds hot pages in RAM — the free cache you already have, which is why unit 2 kept insisting small hot sets need nothing extra. A cache enters the design like every other component in this course: because a number — a latency budget or an offload requirement — pays for it. This lesson builds that arithmetic."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Hit ratio, cache-aside, and the working set",
              "statement": "For a cache receiving a read workload, the **hit ratio** h is the fraction of reads served from the cache; misses (1 − h) fall through to the origin (the next level down). In the **cache-aside** pattern — the default — the application reads the cache first; on miss it reads the origin, then populates the cache, typically with a **TTL** (time-to-live) after which the entry expires. The achievable h is governed by the **working set** (unit 1): if the cache holds the hot fraction of data and the workload is skewed (as real workloads are — power-law popularity), a cache a small fraction of the dataset's size captures the large majority of reads. h is a *measured* property of workload × cache size × TTL — designs state a target h and verify it, never assume it."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "The two dividends: effective latency and origin offload",
              "statement": "Let a read cost T_hit at the cache and T_miss from the origin (including the failed cache probe), with hit ratio h and read rate λ. Then:\n\n(i) **Effective mean latency** E[T] = h·T_hit + (1 − h)·T_miss.\n\n(ii) **Origin load** λ_origin = (1 − h)·λ — the origin sees only the miss stream.\n\n(iii) Consequently, origin load is governed by the *miss* ratio: improving h from 0.98 to 0.99 halves origin traffic (miss ratio 2% → 1%), while improving h from 0.50 to 0.51 relieves the origin by only 2%. The last percentage points of hit ratio are worth more than the first fifty.",
              "proof": "(i) A fraction h of reads complete at cost T_hit; the remaining (1 − h) probe the cache, miss, and pay the origin: cost T_miss. The expectation is the probability-weighted sum: E[T] = h·T_hit + (1 − h)·T_miss.\n\n(ii) Of λ reads per second, exactly the missing fraction (1 − h)·λ reaches the origin (cache-aside sends every miss downstream once — stampede effects, treated next lesson, only add to this).\n\n(iii) The ratio of origin loads at two hit ratios h₁ < h₂ is (1 − h₂)/(1 − h₁). For 0.98 → 0.99: 0.01/0.02 = ½ — origin traffic halves. For 0.50 → 0.51: 0.49/0.50 ≈ 0.98 — a 2% dent. In general, equal *additive* gains in h are worth more the closer h is to 1, because the origin experiences the miss ratio, of which they are a larger and larger share. ∎\n\nBoth dividends matter, but they answer different requirements: (i) is bought against a latency SLO; (ii) is bought against origin capacity — and (iii) warns that an origin sized assuming h = 0.99 is *doubly* exposed if h degrades to 0.98, an availability observation the stampede lesson sharpens into a failure mode."
            },
            {
              "type": "example",
              "heading": "Worked example: what the feed's latency budget buys",
              "body": "Lens's feed at the 100 M-DAU horizon, with the sharded metadata layer of *Partitioning in Practice*: rendering a feed page needs recent-photo lists for ~300 followees. Uncached, that is the 64-shard scatter whose tail the unit-2 exercise computed: per-probe p50 4 ms but a whole-request p50 of ~40 ms and a brutal tail, against a 500 ms end-to-end SLO of which the app tier gets perhaps 150 ms.\n\nInsert an application cache holding per-user recent-photo lists (key: `recent:{user_id}`, value: the last ~50 photo ids + timestamps, a few KB). Measured hit ratio, say h = 0.95 (recent lists are hot: every follower of a user re-reads the same list). Per-probe effective latency: E[T] = 0.95 × 0.5 ms + 0.05 × 40 ms(p50-ish shard read) = 0.475 + 2 = **~2.5 ms mean** — and, more decisively for the tail: only 5% of probes touch shards at all, so the probability a 300-probe fan-out contains *any* shard read is still high (1 − 0.95³⁰⁰ ≈ 1), but the *count* of shard reads per request drops from 300 to ~15 (0.05 × 300) — the straggler exposure shrinks 20-fold, and hedging 15 slow probes is affordable where hedging 300 was not.\n\nSize it: 100 M users × 3 KB ≈ 300 GB — a few cache nodes' RAM, sharded by user_id with consistent hashing (*Partitioning in Practice*, reused verbatim). The component is paid for twice over: the latency budget and the shard fleet's offload. This purchase order — measured baseline, target h, computed dividend, sized memory — is the template every cache proposal should follow."
            },
            {
              "type": "example",
              "heading": "Worked example: offload arithmetic at the origin",
              "body": "Now the offload dividend, on the database tier. Suppose the photo-metadata shards collectively serve λ = 200 k reads/s at peak (feed probes, profile grids, photo pages), and each shard node sustains ~20 k reads/s comfortably — 10+ nodes of pure read capacity before caching.\n\nAt h = 0.95: origin load = 0.05 × 200 k = **10 k reads/s** — one node's worth; the shard fleet is sized by storage and writes, not reads. At h = 0.99: **2 k/s** — reads vanish as a sizing input. Now run the theorem's warning backwards: if the cache is cold (deploy, eviction storm, node loss of a cache shard), h collapses toward 0 for the affected keys, and the origin faces up to 200 k reads/s — **20× its provisioned read capacity**. The cache did not just accelerate the system; it *became load-bearing*: the database can no longer survive the raw read stream without it.\n\nThis is the structural cost of the offload dividend, and it must be priced at design time, not discovered during the incident: either the origin retains enough headroom to survive a cold cache at degraded latency (expensive, honest), or the design must guarantee the cache never goes cold all at once — warmed replicas of the cache tier, gradual deploys, and the stampede protections of the next lesson. Write it in the design doc either way; 'the cache is availability-critical' is a sentence that changes on-call runbooks."
            },
            {
              "type": "decision",
              "heading": "What to cache at the application tier (and how long)",
              "rows": [
                [
                  "Immutable / content-addressed objects (renditions, versioned assets)",
                  "Cache aggressively, TTL effectively infinite — invalidation-free (next lessons)"
                ],
                [
                  "Hot read-mostly entities (user profiles, photo metadata)",
                  "Cache-aside, minutes-to-hours TTL + explicit invalidation on write"
                ],
                [
                  "Expensive computed results (recent-photo lists, rendered fragments)",
                  "Cache-aside, short TTL (tens of seconds–minutes) + invalidation where feasible"
                ],
                [
                  "Rapidly-changing derived values (like counts, view counts)",
                  "Micro-TTL (1–10 s) — bounded staleness bought cheaply; no invalidation plumbing"
                ],
                [
                  "Authorization-relevant state (blocks, permissions, bans)",
                  "Cache only with sub-second bound or explicit invalidation — unit 2's revocation rule"
                ],
                [
                  "Strong-tier reads (uniqueness checks, balances, inventory at commit)",
                  "Do not cache — these reads exist to see the latest state"
                ]
              ]
            },
            {
              "type": "text",
              "heading": "Reading the table with unit-2 eyes",
              "body": "The table is unit 2's consistency map, priced for caching. Every cached value is a derived copy, so every row is answering the same three questions: what staleness grant covers it, what invalidates it, and what happens when it's wrong. Immutable content has the perfect answer — no grant needed, staleness is impossible by construction, which is why the next two lessons work so hard to *make* things immutable. Read-mostly entities lean on explicit invalidation with TTL as the backstop (the belt-and-suspenders idiom: invalidation for promptness, TTL so any missed invalidation heals within the window instead of persisting forever). Counts buy bounded staleness with a micro-TTL because unit 2's map granted approximation anyway — note that a 1-second TTL on a value read 10 k times/s still achieves h ≈ 99.99%: TTL can be *tiny* and still deliver the offload dividend, because hit ratio depends on reads-per-TTL-window, not on the TTL's absolute size. And the bottom two rows are the discipline that separates caching from corruption: some reads are *defined* by their freshness, and no latency budget purchases them."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**A cache is capacity you borrowed, not capacity you own.** The offload example's 20× gap is the general shape: any system whose origin cannot survive its own read load without the cache has made the cache an availability dependency — usually without anyone deciding to. Decide it: either keep origin headroom for a cold-cache day, or engineer the cache tier to never be cold (replication, warming, gradual rollout) and put it on the critical-dependency list with the database. The unexamined middle — 'it's just a cache' in the architecture review, load-bearing in production — is where the outage lives."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A product API serves reads at 40 k/s; cache probe costs 1 ms, origin (DB) reads cost 25 ms. Compute effective mean latency and origin load at h = 0.90, 0.98, and 0.995, and state which improvement mattered more for each dividend: 0.90 → 0.98, or 0.98 → 0.995.",
                  "solution": "E[T] = h·1 + (1−h)·26 (miss pays probe + origin ≈ 26 ms). h=0.90: E[T] = 0.9 + 2.6 = 3.5 ms; origin = 4,000/s. h=0.98: 0.98 + 0.52 = 1.5 ms; origin = 800/s. h=0.995: ~0.995 + 0.13 = 1.1 ms; origin = 200/s. Latency dividend: 0.90→0.98 cut E[T] by 2 ms; 0.98→0.995 by only 0.4 ms — the *first* improvement dominated, because mean latency is linear in miss ratio. Offload dividend: 0.90→0.98 cut origin load 5× (4,000→800); 0.98→0.995 cut it another 4× (800→200) — proportionally comparable, and in absolute origin-fleet terms the *later* gains keep mattering (200/s vs 800/s can be the difference between 1 node and a small fleet). Moral: latency arguments saturate as h→1; offload arguments never do — know which dividend your cache is buying.",
                  "hint": "Apply both formulas at each h; then compare the deltas, not the values."
                },
                {
                  "prompt": "A cache tier for 3 KB per-user objects targets h ≥ 0.95 over 80 M daily-active keys. Reads are strongly skewed: the most recent 20% of active users generate 90% of reads. (a) Roughly size the cache RAM for the target. (b) Explain why caching *all* 80 M users' objects might still be the right call, using the arithmetic.",
                  "solution": "(a) Skew does the work: caching the hot 20% = 16 M objects × 3 KB ≈ **48 GB** captures ~90% of reads; to reach 95%, extend toward the next tier of users — say the hot 40% (32 M × 3 KB ≈ **~100 GB**) captures the low-to-mid 90s (exact h depends on the popularity curve's tail; state it as a measured target). ~100 GB = a couple of cache nodes. (b) The full set is 80 M × 3 KB = **240 GB** — also just a few nodes. Going from 100 → 240 GB of RAM is a marginal hardware cost, but it converts 'h ≈ 0.95, dependent on skew holding' into 'h ≈ 1 for every active user, bounded only by TTL/invalidation misses' — eliminating the origin's exposure to skew shifts (a viral event flattening the popularity curve). When the *entire* working set is RAM-affordable, full residency is often the strongest design: hit ratio stops being a statistical property and becomes a structural one. The arithmetic, not doctrine, decides — which is the lesson.",
                  "hint": "Compute both: RAM for the hot slice at the target h, and RAM for everything. Compare the costs and what each buys."
                },
                {
                  "prompt": "Your origin fleet comfortably serves 15 k reads/s. The cache in front runs at h = 0.99 against λ = 500 k reads/s. (a) What origin load does steady state produce? (b) What h makes the origin saturate? (c) A deploy restarts one of 10 cache shards (consistent-hashed); estimate the transient origin load and verdict.",
                  "solution": "(a) 0.01 × 500 k = **5 k/s** — comfortable. (b) Saturation at (1−h)·500 k = 15 k → 1−h = 3% → **h = 0.97**: only two points of hit ratio stand between steady state and the cliff. (c) One shard of 10 down (consistent hashing: ~10% of keys cold): those keys miss ~totally until repopulated → transient origin load ≈ 0.10 × 500 k × (fraction of the shard's keys being re-requested before warm) — worst case ~50 k/s against 15 k capacity: **3× overload**, and the origin's queue growth slows regenerations, holding misses high — the incipient cascade. Verdict: this design fails the cold-shard test; it needs some combination of cache replication (each key on 2 cache nodes), request coalescing (next lesson) to collapse duplicate regenerations, deploy strategy that drains and warms shards, and/or origin load-shedding to survive warming. The exercise's real output is the sentence for the design doc: 'the cache tier is availability-critical; a single cold shard overloads the origin 3×.'",
                  "hint": "(b) solve (1−h)·λ = capacity. (c) a cold shard turns its key-share of traffic into misses until entries repopulate."
                },
                {
                  "prompt": "A junior engineer proposes caching Lens's handle-uniqueness check ('is @kai taken?') with a 60 s TTL, since signup pages hammer it. Rule on the proposal using this lesson's framework, and rescue the legitimate need inside it.",
                  "solution": "Denied as stated. Handle-claiming is unit 2's one linearizable interaction: the check exists to observe the *latest* state, and a 60 s-stale 'available' answer invites two users to claim @kai — the check-then-act race, now institutionalized. It sits in the table's bottom row: reads whose purpose is freshness cannot be cached, at any TTL. The rescue: split the two different reads hiding in one endpoint. The *typeahead availability hint* while the user types is advisory UX — cache it freely (micro-TTL or even longer; a hint that's occasionally wrong costs a retry) — while the *claim itself* remains an uncached, atomic check-and-claim (unique constraint at the primary, per unit 2). The general move recurs constantly in read-path design: when a 'hot read' turns out to be authorization- or uniqueness-shaped, don't cache it — *decompose* it into a cacheable advisory read plus a rare authoritative write, and let each side have the guarantee it needs.",
                  "hint": "What is the consequence of a stale 'available'? Which part of the interaction actually needs freshness — the typing-time hint or the claim?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u3l1-i1",
              "front": "The two dividends a cache buys, and their formulas?",
              "back": "Effective latency E[T] = h·T_hit + (1−h)·T_miss (bought against a latency SLO) and origin offload λ_origin = (1−h)·λ (bought against origin capacity). State which one is paying for the cache."
            },
            {
              "id": "u3l1-i2",
              "front": "Why do the last points of hit ratio matter most for the origin?",
              "back": "The origin sees the MISS ratio: 0.98→0.99 halves origin load (2%→1%); 0.50→0.51 relieves it 2%. Corollary: an origin sized at h=0.99 is 2× exposed if h slips to 0.98."
            },
            {
              "id": "u3l1-i3",
              "front": "The four working levels of a read-path cache hierarchy?",
              "back": "Client cache (this user, free), CDN edge (popular immutable content near users), application cache (hot objects/results for all users, Redis-class), DB buffer pool (hot pages in RAM — the free one you already have)."
            },
            {
              "id": "u3l1-i4",
              "front": "Why can a 1-second TTL still yield ~99.99% hit ratio?",
              "back": "Hit ratio depends on reads per TTL window: a value read 10k×/s refreshes once per second → 1 miss per 10k reads. Micro-TTLs buy bounded staleness on hot values almost free — no invalidation plumbing."
            },
            {
              "id": "u3l1-i5",
              "front": "What must never be cached, per the consistency map?",
              "back": "Reads defined by freshness: uniqueness check-and-claim, balances/inventory at commit, authorization state (unless sub-second bounded/explicitly invalidated). Decompose hot endpoints into a cacheable advisory read + an authoritative uncached write."
            },
            {
              "id": "u3l1-i6",
              "front": "'A cache is capacity you borrowed' — the design obligation?",
              "back": "If the origin can't survive raw read load, the cache is availability-critical: either keep origin headroom for cold-cache days, or engineer the tier to never be cold (replication, warming, gradual deploys) and treat it as a critical dependency."
            }
          ]
        },
        {
          "id": "u3l2",
          "title": "Cache Correctness: Invalidation, Races, and Stampedes",
          "estMinutes": 26,
          "builds_on": [
            "u3l1",
            "u2l4"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The two ways a cache goes wrong",
              "body": "*The Cache Hierarchy and Its Arithmetic* bought the dividends; this lesson pays the correctness bill. A cache fails in exactly two directions. It can serve **wrong data** — an entry that outlived the truth it copied, through a missed invalidation or, more insidiously, a race that writes stale data *after* fresh data. And it can fail to serve at all at the worst moment — the **stampede**, where a hot key's expiry converts the full read rate of that key into simultaneous origin load, precisely the borrowed-capacity cliff the last lesson warned about, concentrated on one key at one instant.\n\nBoth failure classes have exact, small solutions, and both are routinely gotten wrong because the naive versions work perfectly in development, where concurrency is 1 and nothing is hot. The discipline of this lesson: treat every cached key as a tiny replication system — unit 2's machinery in miniature. It has a source of truth, an asynchronous copy, an ordering problem between concurrent updates, and a thundering-herd problem between concurrent readers. The vocabulary transfers wholesale; only the timescales shrink."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Write policies and invalidation",
              "statement": "Three policies relate cache updates to source updates:\n\n• **Cache-aside** (lazy): writes go to the source only; the cached copy is **deleted** (invalidated) on write, and the next read repopulates it from the source. The default: simple, and the cache never holds data the source didn't serve.\n• **Write-through**: writes update source and cache synchronously — the cache is always warm for written keys, at the cost of writing keys nobody may read and a dual-write ordering problem.\n• **Write-back** (write-behind): writes land in the cache and flush to the source asynchronously — the fastest writes and the only policy where the *cache holds the only copy* of acknowledged data; a cache loss loses writes. Legal only where that loss is priced (counters, presence), never for a source of record.\n\n**TTL** (time-to-live) bounds every entry's lifetime regardless of policy. TTL is the backstop: with TTL τ, no missed invalidation, race, or bug can serve staleness older than τ — the maximum-staleness proof is one line: an entry created at t from then-current data is unservable after t + τ, so served data is at most τ old. Belt (invalidation, prompt) and suspenders (TTL, bounded)."
            },
            {
              "type": "text",
              "heading": "Why delete, not update — the stale-set race",
              "body": "Cache-aside says *delete* the cached entry on write, letting a reader repopulate. The tempting optimization — have the writer *set* the new value into the cache, saving the next reader a miss — creates a race that has corrupted more caches than any other single pattern. Two writers update the same key concurrently: writer A commits value 1 to the database, then writer B commits value 2; but B's cache-set lands *before* A's (network scheduling is under no obligation to preserve their order), so the cache ends holding value 1 — **stale data written after fresh data, with a full TTL of life ahead of it**. Deletion is immune: two deletions in any order leave the same state (deletion is idempotent — unit 1's vocabulary doing correctness work here), and the repopulating read fetches whatever the database then holds.\n\nA subtler cousin survives even delete-on-write: reader R misses, reads value 1 from the database; writer W then commits value 2 and deletes the (absent) entry; R finally writes its now-stale value 1 into the cache. The window is small (a read's duration) but real at high concurrency — Facebook's memcache paper made it famous, along with the fix: **leases**. The cache hands the missing reader a lease token; the writer's delete invalidates outstanding leases; a lease-holding reader whose token was invalidated is refused the set. Compare-and-set with a version number achieves the same. The general principle, worth stating once and reusing forever: *any read-then-write against a concurrent world needs an atomicity token* — the idempotency-key argument of unit 1 and the version-tagged quorum reads of unit 2 were both instances, and the cache lease is a third."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "The stampede bound",
              "statement": "Let a cached key receive reads at rate λ, and let regeneration from the origin take T_regen. When the entry expires (or is invalidated):\n\n(i) **Unprotected**, every read arriving during regeneration misses and independently queries the origin: expected concurrent origin requests for the key ≈ λ · T_regen (by Little's Law), and each added request further loads the origin, growing T_regen — a positive feedback loop.\n\n(ii) With **request coalescing** (a per-key lock/flight-guard: the first miss regenerates; concurrent misses wait for its result, or are served the stale value), origin requests per expiry = **1**, independent of λ.",
              "proof": "(i) During the regeneration window no fresh entry exists, so every arriving read misses. Misses arrive at rate λ for duration T_regen; by Little's Law the expected number in flight against the origin is λ·T_regen. These requests are identical — they will all compute the same value — so all but one are pure waste. Worse, origin service time degrades with load (queueing), so T_regen grows with the herd, which grows the herd: the loop that turns one expiry into an origin brownout.\n\n(ii) Coalescing serializes regeneration per key: a miss first attempts to acquire the key's regeneration flag (an atomic operation in the cache). Exactly one acquirer proceeds to the origin; every other concurrent miss observes the flag and either blocks awaiting the result or is served the just-expired value (stale-while-revalidate). Origin sees one request per expiry by construction. ∎\n\nThe corollary that generalizes: coalescing converts origin load from *per-reader* to *per-key-per-expiry* — for a key read 10 k times/s with a 1 s TTL, from 10,000/s to 1/s. The stampede is not a tail risk to monitor; it is a structural certainty to design out, because every hot key's TTL expires eventually, and the hotter the key the bigger the herd."
            },
            {
              "type": "diagram",
              "kind": "sequence",
              "caption": "One expiry, two designs. Unprotected: three concurrent readers each miss and independently hit the origin (λ·T_regen in general). Coalesced: reader 1 acquires the regeneration lease; readers 2–3 are served stale or wait; the origin sees one request.",
              "actors": [
                "Reader 1",
                "Reader 2",
                "Reader 3",
                "Cache",
                "Origin"
              ],
              "messages": [
                {
                  "note": "entry for key K expires"
                },
                {
                  "from": "Reader 1",
                  "to": "Cache",
                  "label": "GET K → miss"
                },
                {
                  "from": "Reader 2",
                  "to": "Cache",
                  "label": "GET K → miss",
                  "tone": "rust"
                },
                {
                  "from": "Reader 3",
                  "to": "Cache",
                  "label": "GET K → miss",
                  "tone": "rust"
                },
                {
                  "from": "Reader 1",
                  "to": "Origin",
                  "label": "query (regenerate)"
                },
                {
                  "from": "Reader 2",
                  "to": "Origin",
                  "label": "duplicate query",
                  "tone": "rust"
                },
                {
                  "from": "Reader 3",
                  "to": "Origin",
                  "label": "duplicate query",
                  "tone": "rust"
                },
                {
                  "note": "— with coalescing —"
                },
                {
                  "from": "Reader 1",
                  "to": "Cache",
                  "label": "miss → acquires lease",
                  "tone": "sage"
                },
                {
                  "from": "Reader 1",
                  "to": "Origin",
                  "label": "the ONE regeneration",
                  "tone": "sage"
                },
                {
                  "from": "Reader 2",
                  "to": "Cache",
                  "label": "miss → sees lease → stale value",
                  "tone": "sage",
                  "dashed": true
                },
                {
                  "from": "Reader 3",
                  "to": "Cache",
                  "label": "miss → sees lease → waits",
                  "tone": "sage",
                  "dashed": true
                },
                {
                  "from": "Reader 1",
                  "to": "Cache",
                  "label": "SET K (fresh, new TTL)",
                  "tone": "sage"
                }
              ]
            },
            {
              "type": "example",
              "heading": "Worked example: the herd, in numbers",
              "body": "A viral Lens photo's metadata+count bundle is read 12 k times/s. It is cached with a 5 s micro-TTL (the counts row of last lesson's table); regeneration — a metadata read plus a count aggregate — takes 80 ms against a database fleet provisioned for 15 k reads/s *total*.\n\n**Unprotected expiry**: misses arrive at 12 k/s for the 80 ms regeneration window → λ·T_regen = 12,000 × 0.08 ≈ **960 simultaneous identical queries**. The fleet's queue depth explodes; regeneration latency climbs from 80 ms toward seconds; at 12 k misses/s sustained against 15 k/s total capacity, *other keys'* misses now queue behind the herd — the single hot key has browned out the shared origin. And this repeats every 5 seconds. (Now recall unit 2's celebrity discussion: 'cache in front of the hot shard' was listed as a mitigation. Without coalescing, the cache *concentrates* the celebrity's load into periodic spikes instead of removing it.)\n\n**With coalescing + stale-while-revalidate**: at expiry, one reader regenerates (1 query per 5 s per hot key ≈ 0.2/s); 12 k/s of concurrent readers are served the 5-seconds-stale bundle for 80 ms longer — staleness the counts' grant already covers. Origin load from this key: from 960-strong periodic herds to **0.2/s, flat**. A probabilistic refinement (each read refreshes early with small probability weighted by entry age — 'XFetch') even removes the synchronized expiry instant entirely. The design cost: a per-key flag in the cache and a code path for 'serve stale during regen' — a few dozen lines, versus an outage class."
            },
            {
              "type": "example",
              "heading": "Worked example: Lens's invalidation map",
              "body": "Apply the policies key-class by key-class — the read-path counterpart of unit 2's consistency map, and the same kind of deliverable:\n\n• **Photo metadata / user profiles** (read-mostly entities): cache-aside, TTL 1 h as backstop, **delete-on-write** invalidation in the same code path as the database commit (post-commit hook: `DEL photo:{id}`). Leases/CAS on repopulation — the stale-set race is live here because edits and hot reads coincide (a caption fix on a viral photo).\n• **Recent-photo lists** (`recent:{user}`, the fan-out absorber from last lesson): invalidated by the owner's *own* uploads only — delete on post-commit of a new photo. TTL 10 min backstop. Coalescing mandatory: a celebrity's list is the hottest key in the system.\n• **Counts**: micro-TTL 5 s, *no* invalidation plumbing (the writes are too frequent to chase; the grant covers 5 s), coalescing + stale-while-revalidate per the herd example.\n• **Block lists / privacy state**: the unit-2 revocation rule — sub-second invalidation (delete on block-commit, and the read path's filter re-checks source on any cache anomaly), short TTL. Correctness class, not performance class.\n• **Session tokens**: write-through (session created → cached immediately — it *will* be read on the next request), TTL = session lifetime, revocation = delete + short TTL backstop.\n\nEvery line names: policy, TTL, invalidation trigger, race protection. A cache design that can't fill this table for its keys isn't a design yet — it's an eviction policy with hope."
            },
            {
              "type": "callout",
              "tone": "danger",
              "body": "**Never let 'just cache it' skip the two questions: who invalidates this, and what happens when it expires under load?** The first unanswered question ships stale data (found weeks later, blamed on 'the database'); the second ships a periodic self-inflicted DDoS synchronized to your own TTLs (found at 3 a.m. on the day something goes viral). Both answers are cheap at design time — a delete hook and a coalescing flag — and expensive as incidents. The table in the example is the artifact that proves the questions were asked."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Trace the stale-set race precisely: writers A and B update key K (A commits 1, then B commits 2 in database order), each then setting the cache. Give the interleaving that leaves the cache wrong, explain why delete-on-write is immune, and why deletion's idempotence is the load-bearing property.",
                  "solution": "Interleaving: A commits 1 → B commits 2 → B sets cache=2 → A's delayed set lands: cache=1. Database says 2, cache serves 1 for a full TTL — stale data written *after* fresh. With delete-on-write: A commits 1 → B commits 2 → B deletes K → A deletes K (a second deletion of an absent key: same state). Next reader misses and repopulates from the database, which holds 2 — correct regardless of the deletes' order, *because* deletion is idempotent and order-insensitive: delete∘delete = delete in either order, whereas set-A∘set-B ≠ set-B∘set-A. The sets encode a value (an ordering claim); the deletes encode only 'this copy is suspect', which commutes. The remaining hole (reader-repopulation racing a concurrent write) needs the lease/CAS token — but the writer-writer race is closed by deletion alone.",
                  "hint": "Write both interleavings state-by-state. Which operation pair commutes?"
                },
                {
                  "prompt": "A dashboard key is read 4 k times/s; regeneration costs 300 ms against an origin with 2 k reads/s of headroom. The team uses a 30 s TTL, no coalescing. (a) Size the herd at each expiry and verdict. (b) They propose 'fix it by raising the TTL to 10 minutes.' Evaluate. (c) Give the correct fix and the residual origin load.",
                  "solution": "(a) Herd ≈ λ·T_regen = 4,000 × 0.3 = **1,200 concurrent identical queries** against 2 k/s of headroom — the origin absorbs a 1,200-deep queue spike every 30 s; regeneration latency stretches under the spike (positive feedback), and other tenants of the origin queue behind it. Verdict: structurally broken, on a timer. (b) A 10-min TTL makes the herd *rarer, not smaller* — 1,200 concurrent queries every 600 s instead of every 30 s — while multiplying worst-case staleness 20×. It trades a frequent outage-let for a rarer identical one plus worse data. Rejected. (c) Coalescing + stale-while-revalidate: one regeneration per expiry (0.03/s at the 30 s TTL — keep the fresher TTL, it's now nearly free), readers served ≤300 ms-stale data during regen. Residual origin load from this key: ~0.03 reads/s. Optional refinement: probabilistic early refresh to de-synchronize expiry from the read burst entirely. The general reading: TTL sets *staleness*; coalescing sets *herd size*; they are orthogonal knobs and only one of them addresses stampedes.",
                  "hint": "Herd = λ × T_regen, independent of TTL. Which knob does TTL actually turn?"
                },
                {
                  "prompt": "Design the invalidation line (policy, TTL, trigger, race protection) for each key class of a job-board: (a) job postings (edited occasionally, read heavily); (b) 'applications received' counters per posting; (c) the employer's own dashboard listing their postings right after they publish one; (d) a candidate's saved-search results page.",
                  "solution": "(a) Cache-aside; TTL 1 h backstop; delete on posting-edit commit; lease/CAS on repopulate (hot posting + edit coincide). (b) Micro-TTL 5–10 s, no per-write invalidation (write rate too high, approximation granted), coalescing + stale-while-revalidate for hot postings. (c) This is unit 2's read-your-writes wearing cache clothes: the employer must see their new posting instantly. Options: invalidate the employer's dashboard key on publish-commit AND route their immediate reads around the cache (session pin / cache-bypass token for the writing session), because invalidation alone still races their next read against repopulation-from-a-lagging-replica. Line: cache-aside, TTL 5 min, delete-on-publish + writer-session bypass window. (d) Saved-search results are a *derived query* over volatile data with no single invalidation trigger (any new job matches somewhere): TTL-only (say 60 s — extract the staleness grant: 'results may lag a minute'), coalescing on hot searches, no invalidation plumbing — chasing per-job invalidation of arbitrary cached queries is the unbounded-fan-out trap. The pattern across the four: the trigger exists only where writes are attributable to the key; where they aren't, TTL is the whole freshness story and must be sized to the grant.",
                  "hint": "For each: is there a well-defined write event that names this key? If not, TTL is doing all the work — size it to a stated grant."
                },
                {
                  "prompt": "During an incident review: at 14:02 a config push restarted the whole cache tier (all entries lost); by 14:03 the database was at 8× normal read load and timing out; by 14:05 the app tier's retries had tripled inbound traffic and the site was down until 14:40. Using this unit's concepts, name the three compounding mechanisms and the design changes that would have contained each.",
                  "solution": "Mechanism 1 — **cold cache = borrowed capacity recalled**: h collapsed to ~0 fleet-wide, exposing the origin to the full read rate it was never provisioned for (last lesson's structural warning realized). Containment: never restart the tier atomically — rolling config deploys shard-by-shard (each cold shard is a survivable 1/N event, per the earlier exercise), and/or cache replication so a restart never empties both copies. Mechanism 2 — **fleet-wide synchronized stampede**: every hot key's readers herded simultaneously (λ·T_regen per key, summed over all keys), and origin queueing stretched T_regen, growing the herds — the positive feedback of the stampede theorem at fleet scale. Containment: coalescing flags (bound each key to one regeneration) — this alone converts 'all keys regenerate under full herd' into 'all keys regenerate once', which is merely a busy minute. Mechanism 3 — **retry amplification**: timeouts × client retries multiplied offered load 3× exactly when capacity was lowest (the unit-1 backoff discipline violated somewhere in the stack). Containment: exponential backoff with jitter everywhere, plus origin load-shedding (serve errors/degraded responses fast rather than queueing to death) so the system sheds to a survivable level and warms from there. The meta-lesson: each mechanism is individually covered by this unit; the outage is their product, and the containments compose the same way.",
                  "hint": "Separate: why was load high (whose capacity was borrowed?), why did it self-amplify at the origin, and why did it self-amplify at the clients?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u3l2-i1",
              "front": "Cache-aside vs write-through vs write-back — and which can lose data?",
              "back": "Cache-aside: write source, DELETE cache entry, next read repopulates (the default). Write-through: write source+cache synchronously. Write-back: write cache, flush async — the only one where the cache holds the sole copy of acked data; legal only where loss is priced."
            },
            {
              "id": "u3l2-i2",
              "front": "Why delete-on-write instead of set-on-write?",
              "back": "Concurrent writers' sets can land out of order → stale value cached AFTER fresh (full TTL of wrong data). Deletes commute and are idempotent — any order leaves 'absent', and the next read repopulates from current truth."
            },
            {
              "id": "u3l2-i3",
              "front": "The reader-repopulation race and its fix?",
              "back": "Reader fetches old value; writer commits + deletes; reader then caches its stale read. Fix: leases/CAS — cache issues a token on miss; a write invalidates outstanding tokens; stale set is refused. Third instance of 'read-then-write needs an atomicity token'."
            },
            {
              "id": "u3l2-i4",
              "front": "Stampede bound — unprotected vs coalesced?",
              "back": "Unprotected: λ·T_regen concurrent identical origin queries per expiry (Little's Law), self-amplifying via origin queueing. Coalesced (per-key lease + stale-while-revalidate): exactly 1 per expiry, independent of λ."
            },
            {
              "id": "u3l2-i5",
              "front": "Which knob controls staleness and which controls herd size?",
              "back": "TTL sets maximum staleness (bound = τ, backstop for missed invalidations). Coalescing sets herd size (per-key regenerations). Orthogonal: raising TTL makes herds rarer, not smaller."
            },
            {
              "id": "u3l2-i6",
              "front": "The two questions every 'just cache it' must answer?",
              "back": "(1) Who invalidates this — is there a write event that names the key? (If not, TTL is the whole story; size it to a stated grant.) (2) What happens when it expires under load — coalescing, stale-while-revalidate, cold-start plan?"
            }
          ]
        },
        {
          "id": "u3l3",
          "title": "Content Delivery: CDNs and the Media Pipeline",
          "estMinutes": 24,
          "builds_on": [
            "u3l1",
            "u1l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The read path's biggest number",
              "body": "Application caching tamed metadata, but Lens's dominant load was never metadata: *Lens by the numbers* put media egress at 20 TB/day at 1 M DAU — 2 PB/day at the 100 M horizon — and the geography exercise of *One Machine First* proved that a 500 ms SLO cannot be met from one continent regardless of load: an Australian user pays ~280 ms per round trip to a European origin before any server work happens. Both numbers point at the same component: the **content delivery network** — a globally distributed fleet of edge caches (points of presence, PoPs) that serve static content from within ~10–30 ms of users and shield the origin from the byte flood.\n\nA CDN is 'just' the cache hierarchy's outermost level, and everything from the last two lessons applies: hit ratios, TTLs, stampedes (CDNs call origin-herding 'origin shield' problems). What makes the CDN level special is what it serves: **media is the perfect cacheable workload** — large, read-hot, and, if the pipeline is designed right, *immutable*. This lesson designs that pipeline, because the immutability is not a lucky property of images; it is a design decision made at upload time, and it is what turns caching from a correctness liability (all of last lesson's machinery) into a solved problem."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "CDN vocabulary",
              "statement": "A **PoP** (point of presence) is an edge datacenter holding a cache; users are routed to a nearby PoP by DNS or anycast. The **origin** is the authoritative source (for Lens: the object store) from which PoPs **fill** on miss. The **cache key** is the identity under which the edge stores an object — normally the URL (plus selected headers); two URLs are two objects, even for identical bytes. **TTL/immutability headers** (Cache-Control: max-age, immutable) tell edges how long to serve without revalidation. An **origin shield** is a designated mid-tier PoP through which other PoPs fill, collapsing the per-PoP miss streams into one — request coalescing at planetary scale."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Content addressing makes staleness impossible",
              "statement": "Let every stored object be served under a URL containing a collision-resistant hash of its bytes (or an equivalent immutable version id assigned once at creation): `…/media/a3f9c2….jpg`. Then a cached copy can never be stale: for any URL u, every fetch of u in the object's lifetime returns identical bytes, so arbitrary-TTL caching at every level (edge, app, client) is sound with **no invalidation machinery at all**. 'Updates' are new objects under new URLs, and pointing at the new version is a metadata write, not a cache problem.",
              "proof": "Staleness means: a cache serves, for key u, bytes that differ from what the origin would currently serve for u. Under content addressing, the origin's mapping u → bytes is immutable by construction — u embeds h(bytes), and the origin never rebinds a URL: modifying content produces new bytes b′, hence a new hash h(b′) ≠ h(b) (collision resistance), hence a new URL u′. So for every u, origin(u) is constant over time; any cached copy equals origin(u) forever, and the staleness predicate is unsatisfiable. The mutable part of the system — 'which version does photo 123 currently point to?' — lives in the metadata row, whose caching is governed by last lesson's rules (short TTL, invalidation); the megabytes live behind URLs where the rules are unnecessary. ∎\n\nThe design consequence: **push mutability to the smallest, cheapest layer**. A 2 MB photo cached at 300 PoPs with infinite TTL and zero invalidation plumbing, versus a 200-byte metadata pointer with a 60 s TTL — the pipeline below is engineered precisely to produce this split."
            },
            {
              "type": "example",
              "heading": "Worked example: the Lens media pipeline",
              "body": "End to end, upload to eyeball, every stage stamped with its reason:\n\n**Upload**: the client POSTs metadata (with its idempotency key, unit 1) and receives a signed, single-use upload URL to the object store — the 2 MB body never transits the API tier (*the bytes-dominate arithmetic*). The original lands as `orig/{content-hash}`.\n\n**Transcode** (asynchronous — the first true background job in Lens; unit 4 formalizes the queue): workers produce the renditions the product actually serves — feed 200 KB, thumbnail 40 KB, full-screen 800 KB — each stored content-addressed. On completion, the photo's metadata row is updated with the rendition URLs and the photo becomes visible (the '~10 s to followers' grant of unit 1 was, in part, budget for exactly this step).\n\n**Serve**: feed responses carry rendition URLs; clients fetch them from the CDN. Headers: `Cache-Control: public, max-age=31536000, immutable` — legal *only* because of the proposition. Edge hit ratio for feed renditions runs very high (popular photos are popular everywhere): at h = 0.98, the 100 M-DAU egress of ~2 PB/day costs the origin 2 PB × 0.02 = **40 TB/day of fill** — and an origin shield collapses per-PoP misses so a newly viral photo fills each region once, not once per PoP.\n\n**Geography, re-run**: the Australian user of unit 1's exercise now fetches 20 renditions from a Sydney PoP at ~25 ms RTT — the image term of the latency budget collapses from ~280 ms to ~25 ms, and the 500 ms SLO holds with only the dynamic feed request still crossing the ocean (and unit 8's evolution discussion is where moving *that* closer gets priced).\n\nCount what this pipeline does *not* contain: no purge API in the hot path, no invalidation fan-out to 300 PoPs, no versioning races. One design decision at upload time — content addressing — deleted an entire class of machinery."
            },
            {
              "type": "text",
              "heading": "Private content: signatures against cacheability",
              "body": "The pipeline above assumed public photos. The moment unit 1's privacy question ('photos visible to followers only') is answered yes, a tension appears that no cleverness fully dissolves: **caching wants URLs stable and shareable; access control wants them useless to non-followers**. The standard instrument is the **signed URL**: the API returns rendition URLs bearing an expiring signature (path, expiry, HMAC under a key the CDN checks at the edge). Authorization happens where the app can consult block lists and follow edges (unit 2's revocation rule — enforcement at read time, at the metadata layer); the CDN merely verifies the signature and serves bytes.\n\nThe knob is the signature lifetime, and it is a genuine trade. Short lifetimes (minutes) approximate per-request authorization — a revoked follower loses access at the next feed load — but fragment the *client's* cache (yesterday's URL differs from today's, so the phone re-downloads what it already has) while leaving edge caching intact if the CDN excludes the signature query-string from the cache key (bytes cached once, signature checked per request — the standard configuration, worth stating explicitly in the design). Long lifetimes (days) maximize client caching but stretch the revocation window: an unfollowed viewer's stale URL keeps working for the signature's life. There is no free point on this dial — the design states the revocation SLO (extract it! 'access ends within N minutes' is a product requirement, the same species as the block-list rule), sets the lifetime to N, and accepts the client-cache cost. What is *not* acceptable is the accidental default: unsigned 'unguessable' URLs, which are secrets that every share, log line, and referrer header leaks, with no expiry at all."
            },
            {
              "type": "example",
              "heading": "Worked example: video changes the numbers, not the shape",
              "body": "Add unit 1's exercise feature — 30-second videos, 25 MB — and re-run the pipeline to see which stages bend.\n\n**Transcode** becomes the heavy stage: video transcodes to an adaptive ladder (say 4 bitrates × HLS segments of ~4 s). Cost: minutes of CPU per upload — at 20 k videos/day (the exercise's 1-in-50 assumption at 1 M DAU), a dedicated worker fleet, sized by Little's law on upload rate × transcode time (0.23 uploads/s × 180 s ≈ 42 concurrent transcodes → ~50 workers with headroom). The '~10 s visible' grant does *not* survive for video — extract the new one ('video available within minutes; poster sees processing state').\n\n**Storage**: the ladder multiplies bytes ~2×: 20 k × 25 MB × 2 ≈ 1 TB/day added — noted, object store absorbs it.\n\n**Serve**: segments are content-addressed files like any rendition — the proposition holds, TTLs stay infinite. Two new mechanics: **range requests** (players seek; edges must serve byte ranges from cached segments — a CDN configuration line, not an architecture change) and per-segment cache keys meaning a video is ~30 small objects, which *improves* edge behavior (partial popularity caches partially).\n\n**Egress**: the number that actually moves. If even 20% of feed views play 5 s of video at ~1 MB: 100 M views/day-scale arithmetic adds tens of TB/day at 1 M DAU and tens of PB/day-scale at the horizon — video egress dwarfs photo egress and makes CDN hit ratio the single most financially material number in the system (each h point is ~1% of a petabyte-scale bill). Same pipeline, same proofs; only the constants — and therefore the priorities — moved. That is what 'the numbers decide' looks like in practice."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**The takedown requirement survives content addressing — plan the purge path anyway.** The proposition makes *staleness* impossible, not *removal*: a legal takedown (unit 1's exercise) or a privacy deletion must stop delivery of bytes whose URLs are cached at 300 PoPs with `immutable` headers. The answer is layered: kill the metadata pointers (instant — nothing links to the object), kill signature validity where URLs are signed (bounded by signature lifetime), and issue CDN purge for the object's URLs (minutes, best-effort) with the object-store delete behind it. Content addressing minimizes what invalidation must exist; revocation-shaped requirements are why it never reaches zero."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A site serves 900 TB/day through a CDN at edge hit ratio 0.97, with an origin shield that itself hits 0.6 on the edge-miss stream. (a) Compute origin egress. (b) The CDN offers +0.02 edge hit ratio for a fee, or the team can raise shield hit to 0.8 by doubling shield cache size. Which relieves the origin more?",
                  "solution": "(a) Edge misses: 900 × 0.03 = 27 TB/day reach the shield; shield misses: 27 × 0.4 = **10.8 TB/day origin egress**. (b) Option A (edge 0.99): misses 900 × 0.01 = 9 TB to shield; origin = 9 × 0.4 = **3.6 TB/day** (3× reduction). Option B (shield 0.8): origin = 27 × 0.2 = **5.4 TB/day** (2× reduction). Edge points win here — they shrink the stream *before* the shield multiplies it — but note the structure: total offload is the *product* of layer hit-ratios (origin sees (1−h_edge)(1−h_shield)·λ), so improvements compound across layers and the cheaper knob depends on current values and prices, not doctrine. Compute both, then buy.",
                  "hint": "Origin egress = total × (1−h_edge) × (1−h_shield). Recompute under each option."
                },
                {
                  "prompt": "A team serves user avatars as `/avatars/{user_id}.jpg` with TTL 24 h, and ships 'update avatar' by overwriting the object. Users report day-old avatars after updates; the team adds a CDN purge call on every update, which works but costs per-purge and occasionally lags. Redesign per this lesson, and enumerate what the redesign deletes.",
                  "solution": "The URL is a *mutable* binding — the anti-pattern the proposition exists to kill. Redesign: store avatars content-addressed (`/media/{hash}.jpg`, or versioned `/avatars/{user_id}/{version}.jpg` with version assigned once); the user row holds the current avatar URL; 'update avatar' = upload new object + update the pointer. Serve with `immutable`, infinite TTL. The HTML/API responses that *embed* the URL are the mutable layer — they carry the pointer, cached under last lesson's short-TTL rules (or simply uncached; it's a tiny row). Deleted by the redesign: the entire purge integration (cost, lag, failure handling), the 24 h staleness window, and the class of bugs where purge and overwrite race (a PoP filling from the origin mid-overwrite can cache torn state under the old URL — a race the team hadn't found yet). Kept: a purge path for takedowns only, off the hot path. This migration — mutable URL to immutable URL + mutable pointer — is one of the highest-leverage refactors in read-path engineering.",
                  "hint": "Which layer is mutable in the current design? Move the mutability to the smallest layer and make the big bytes immutable."
                },
                {
                  "prompt": "Lens sets follower-only photos behind signed URLs with a 15-minute lifetime, CDN configured to ignore the signature in the cache key. Answer as the design doc would: (a) what happens when a user is unfollowed at t=0 having loaded a feed at t=−1 min; (b) why doesn't every user's re-visit at minute 16 re-download every image; (c) an engineer proposes lifetime = 30 days 'so clients cache perfectly' — rule, citing the relevant requirement class.",
                  "solution": "(a) Their already-issued URLs stay valid until t=14 min (signature lifetime remaining): they can re-fetch those specific renditions for up to 15 minutes post-unfollow, and new feed loads exclude the photos entirely (metadata-layer authorization, unit 2's read-time enforcement). The design doc states this as the revocation SLO: 'media access ends ≤15 min after unfollow/block' — a product-approved grant. (b) Two caches are in play: the *edge* caches bytes under the signature-stripped key (so PoPs never re-fill — bytes cached once regardless of signatures), and the *client* caches the response it fetched; at minute 16 the client's URL differs (new signature), forcing a re-request — but it hits the edge (hot) at ~25 ms, and clients that revisit within the lifetime reuse their HTTP cache outright. The cost of short lifetimes is thus edge requests, not origin fills or full downloads. (c) Denied: signature lifetime IS the revocation window; 30 days means a blocked ex-follower (or anyone a URL leaked to — referrers, logs, screenshots of links) retains a month of access. Revocation-shaped requirements (unfollow, block, takedown — unit 2's rule) bound the lifetime from above; client-cache efficiency pushes from below; 15 min is the product's chosen point, and moving it is a product decision to extract, not an engineering optimization to slip.",
                  "hint": "Separate the three caches (edge, client, and the metadata-layer's authorization), and ask which requirement class bounds signature lifetime from above."
                },
                {
                  "prompt": "For a podcast platform (unit 1's gate system: 40 MB episodes, 16 TB/day egress, stream-start p99 400 ms), specify the delivery design: content addressing decision, TTL/headers, range-request handling, what the origin shield buys at episode-release moments, and the two numbers you'd monitor to know the design is working.",
                  "solution": "Content addressing: episodes are immutable audio — store as `/media/{hash}.mp3` (or segmented HLS for adaptive delivery), pointer in the episode row; `Cache-Control: public, max-age=1y, immutable`. (Republished/edited episodes = new hash + pointer update; no purges.) Range requests: enabled at the edge — players seek and resume mid-file; edges serve ranges from cached objects (segmenting into ~few-MB chunks improves partial-cache behavior for long episodes and is the natural HLS shape anyway). Stream-start p99: first bytes come from the nearest PoP (~25 ms) — the 400 ms budget is dominated by client buffering, not network, once edges serve; monitor time-to-first-byte at the edge per region. Release moments: a popular show's new episode is a synchronized global miss — exactly the stampede shape at CDN scale; the origin shield collapses each region's thousands of PoP fills into ~one origin fetch per region (coalescing writ large), so release-day origin egress stays ~(unique bytes × regions), not (× PoPs or × listeners). The two health numbers: **edge hit ratio** (target very high, ≥0.97 — each point is ~160 GB/day of origin fill at current egress, and it's the financially material dial) and **origin fill rate** (TB/day and requests/s — the direct measure of what the hierarchy is failing to absorb; a rising fill rate with stable traffic means TTL/keying regressions — the smoke alarm for 'someone broke content addressing').",
                  "hint": "Immutability decision first (what would ever change?), then walk: headers, ranges, release-day herd, and which two metrics prove offload is happening."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u3l3-i1",
              "front": "Content addressing — the proposition and what it deletes?",
              "back": "URLs embed a hash/immutable version of the bytes → origin's URL→bytes mapping never changes → cached copies can never be stale → infinite TTLs at every layer with ZERO invalidation machinery. Updates = new URL + metadata pointer change."
            },
            {
              "id": "u3l3-i2",
              "front": "'Push mutability to the smallest layer' — meaning in the media pipeline?",
              "back": "Megabytes live behind immutable content-addressed URLs (cached everywhere, forever); mutability lives in a tiny metadata pointer row (short TTL / invalidated per unit-3 rules). 2 MB × 300 PoPs invalidation-free vs one 200-byte pointer."
            },
            {
              "id": "u3l3-i3",
              "front": "Multi-layer offload arithmetic (edge + shield)?",
              "back": "Origin load = λ × (1−h_edge) × (1−h_shield) — layer miss-ratios multiply. An origin shield is request coalescing at planetary scale: collapses per-PoP miss streams so viral/release-day content fills once per region."
            },
            {
              "id": "u3l3-i4",
              "front": "Signed URLs — what does signature lifetime trade?",
              "back": "Lifetime = the revocation window (unfollow/block/leak exposure) vs client-cache efficiency (new signature forces re-request, though edges still hit if the cache key strips signatures). Set it to the extracted revocation SLO; 'unguessable' unsigned URLs are leaked secrets with no expiry."
            },
            {
              "id": "u3l3-i5",
              "front": "Why does upload bypass the API tier, and what handles processing delay?",
              "back": "Signed single-use upload URLs send bodies straight to the object store — bytes dominate, API tier stays request-sized. Async transcode produces content-addressed renditions; the freshness grant ('visible in ~10 s / video in minutes') budgets the pipeline stage."
            }
          ]
        },
        {
          "id": "u3l4",
          "title": "Derived Read Models",
          "estMinutes": 23,
          "builds_on": [
            "u3l1",
            "u2l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "When the read's shape, not its speed, is the problem",
              "body": "Everything so far in this unit accelerated reads the source could already answer: a cache in front of a query the database runs fine, an edge in front of bytes the object store holds. But some reads on the query list have no efficient form against the write-side schema at all, at any cache temperature. 'Photos tagged #sunset, newest first' against Lens's owner-sharded photos table is a scatter across all 64 shards *per page*. 'Search captions for two words' is a full scan no B-tree serves. 'Top accounts this week' aggregates a hundred million rows. For these, the read path needs a different move: not a copy of the source's *answers* (a cache) but a copy of its *data in a different shape* — a **derived read model**, precomputed at write time, so the read becomes a lookup.\n\nUnit 2 met the idea twice without naming it: the like-count column (a one-value read model) and the search-index exercise (a full store as read model). This lesson names it, gives it its arithmetic — when precompute wins, and by how much — and its plumbing: how derived models stay fed, which is the door unit 4 walks through."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Derived read model (CQRS in its useful form)",
              "statement": "A **derived read model** is a store whose contents are a deterministic function of the source of truth, maintained asynchronously, and shaped for one read pattern: an inverted index (search), a key-ordered listing (photos-by-hashtag), a precomputed aggregate (counts, leaderboards), a join flattened into a document. Reads hit the model; writes hit only the source, and a **feed mechanism** propagates changes. Splitting read shape from write shape this way is the substance of CQRS (command–query responsibility segregation) — the useful discipline being: the write side keeps the invariants (normalized, transactional, per unit 2), each read side keeps one query pattern fast, and every model carries the derived-copy obligations: a staleness grant, a disagreement policy, and a rebuild path."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The precompute trade",
              "statement": "Let a query be answerable at read time for cost C_read (per read), or served from a model maintained for cost C_write (per source write) plus a lookup cost C_lookup ≈ small. With read rate ρ and write rate ω on the relevant data, precomputation reduces total work exactly when\n\n  ω · C_write + ρ · C_lookup < ρ · C_read,  i.e.  ρ/ω > C_write / (C_read − C_lookup) ≈ C_write / C_read.\n\nRead-dominance (ρ/ω large) and expensive reads (C_read large) both push toward precompute; write-heavy or cheap-read data stays computed on demand.",
              "proof": "Total work per unit time on demand: ρ·C_read. With the model: every source write pays maintenance ω·C_write, every read pays a lookup ρ·C_lookup. Precompute wins iff ω·C_write + ρ·C_lookup < ρ·C_read; dividing by ω·(C_read − C_lookup) (positive when the model makes reads cheaper, the only interesting case) gives ρ/ω > C_write/(C_read − C_lookup). ∎\n\nThis inequality is the like-count decision of unit 2, generalized: there, ρ/ω = 200 and C_read (an aggregate) dwarfed C_write (an increment) — precompute won easily; the view-counter exercise inverted it (ω huge, grant loose) and batching won instead. It is also, run at system scale on the feed itself (ρ/ω = 150, C_read = a 300-way scatter), the arithmetic that will justify unit 4's fan-out-on-write — this proposition is the unit's handoff to the next."
            },
            {
              "type": "example",
              "heading": "Worked example: photos-by-hashtag",
              "body": "The query: `#sunset` page, newest first, cursor-paginated. Against the owner-sharded source: every page is a 64-shard scatter-gather with a merge — the tail-amplified shape unit 2 computed, for a query pattern (browse a tag) that is pure read-side; nothing about the write side's invariants cares about hashtags.\n\nThe model: a listing keyed **(hashtag, created_at DESC, photo_id)** — partitioned by hashtag (the partition-key principle: the dominant query is per-tag), rows are just photo ids + timestamps (~40 bytes). Maintenance: when a photo posts, parse its caption's tags and insert one row per tag; on delete, remove them. C_write: a handful of tiny inserts per photo (only photos with tags). C_read drops from a 64-shard scatter to **one shard's indexed range scan** — the cursor pagination of unit 1 works verbatim on the (created_at, id) suffix.\n\nRun the proposition: tag pages are read-heavy (every browse is ρ; only posting writes ω — site-wide ρ/ω on tag data is easily 100+) and C_read/C_write is a 64-probe scatter versus 3 tiny inserts — both factors point the same way; the model pays for itself decisively. Obligations ledger: staleness grant = the feed's existing ~10 s (tag pages lag new posts by the feed pipeline's lag — same grant, reused); disagreement policy = read-time re-check against source for anything user-visible (a deleted photo's id may linger in the listing; the renderer drops rows whose source fetch 404s — the search-exercise policy, reused); rebuild path = re-scan photos, re-parse captions (deterministic — the definition's requirement doing real work: *because* the model is a pure function of the source, the rebuild is a batch job, not an archaeology project).\n\nNote the skew echo: #sunset is a whale tag (unit 2's celebrity, wearing a hashtag) — its listing shard is hot. The escalation ladder from *Partitioning in Practice* applies unchanged: sub-shard the whale tags, cache their first pages (this unit's own machinery — the first page of a hot tag is the most cacheable object imaginable, micro-TTL + coalescing)."
            },
            {
              "type": "example",
              "heading": "Worked example: feeding the models — why dual-write fails",
              "body": "Three models now hang off Lens's photo writes: the hashtag listing, the search index (unit 2's exercise), and tomorrow the feed fan-out. How do they stay fed? The obvious plumbing — the API handler, after committing, calls each model's update ('dual-write', or rather quad-write) — fails a walk-through it is worth doing once, slowly.\n\n**Crash between writes**: the handler commits the photo, updates the hashtag listing, and dies before the search index — the models now *disagree with each other and the source*, silently, forever (no record says what was owed). **No retry ledger**: the handler's process is the only place that knew updates were pending; its death erases the debt. **Ordering**: two quick edits to a caption can reach the search index out of order (the stale-set race of this unit, across stores). Every fix within dual-write — try/catch, retries in the handler — shrinks the window without closing it, because the root defect is structural: *the source commit and the derived updates are separate, unordered, individually-failable operations*.\n\nThe structural fix inverts the flow: the source commit itself produces a durable, ordered **change record** — via an outbox table written in the same transaction as the photo (unit 1's atomicity discipline, third appearance) or the database's own replication log tailed as a change feed (CDC) — and each model *consumes* that record stream independently, at its own pace, with retries and resume from a checkpoint. Crash-safe (the debt is durable), ordered (the log has one order), and each model's lag is observable (its checkpoint vs the log head — the staleness grant, now a measurable number). What this machinery *is* — the durable ordered stream between a write and its consequences — is a queue-and-log system, and it is precisely where the next unit begins."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**A cache and a read model are the same species — a derived copy — differing in one property: derivability of the whole.** A cache holds answers it happened to compute (rebuildable only by re-asking every question); a read model is a *deterministic function of the source* (rebuildable by one batch job). That property is worth designing for on purpose: every derived store should be re-derivable from sources alone, because the rebuild path is what turns 'the index is corrupt' from an incident into a chore — and it is the last of the three obligations (grant, disagreement policy, rebuild) that this unit has attached to every copy it created."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The read path is complete as a toolkit: a cache hierarchy justified by the two dividends, invalidation and stampede machinery that keeps it honest, a CDN layer made trivial by immutability, and — this lesson — derived read models for reads whose shape the source cannot serve, admitted by the precompute inequality and bound by the three obligations. What the unit deliberately left dangling is the plumbing every model now depends on: the durable, ordered change stream that feeds them, and the asynchronous work — transcoding, fan-out, index updates — that the write path has been quietly accumulating. That machinery is the write path's story, and it is the next unit entirely: queues, delivery guarantees, and the fan-out economics that the feed has been waiting for since unit 1."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Apply the precompute proposition to three candidates, deciding each with the inequality: (a) 'follower count' on profiles — read on every profile view (ρ ≈ 2 k/s), changed on every follow (ω ≈ 5/s), C_read = an indexed COUNT over ~10⁴–10⁷ rows; (b) 'mutual followers between viewer and profile' — read on ~10% of profile views, C_read = a two-set intersection, personalized per (viewer, profile) pair; (c) 'photos posted in the last hour, site-wide' for an internal ops dashboard polled every 30 s.",
                  "solution": "(a) ρ/ω = 400; C_write = an increment, C_read = a potentially huge COUNT — inequality satisfied by orders of magnitude: **precompute** (the like-count template verbatim: atomic increment + reconciliation). (b) The key insight is the model's *keyspace*: precomputing per (viewer, profile) pair is O(users²) cells, almost all never read — C_write is paid across a space that ρ never visits, so the per-cell ρ/ω is ~0: **compute on demand** (with unit-3 caching of hot pairs if measurement justifies it), or precompute only the *ingredients* (each user's follower set, which is just the source index) and intersect at read time. Personalized queries usually fail the proposition because the model multiplies keyspace by viewer. (c) ρ = 1 poll/30 s — essentially zero; any C_read is affordable: **compute on demand** (one indexed range scan). The inequality kills this one on ρ alone. Pattern: the proposition is decided by ρ/ω *per model cell* — aggregate-sounding features can hide per-viewer keyspaces that turn precompute into waste.",
                  "hint": "For each: what is the model's key? Compute ρ/ω per key, not per feature."
                },
                {
                  "prompt": "Your search index (fed by CDC from the products table) shows a product that was deleted yesterday, and is missing one created two minutes ago. For each anomaly: expected or a bug? Then specify the three-part obligations ledger this index should have, with concrete values.",
                  "solution": "The two-minutes-missing item: check the grant — if the stated staleness bound is, say, 'searchable within 5 min', this is *expected behavior*; if the consumer's checkpoint lag has silently grown past the grant, it's an operational alert (lag metric vs grant), not a correctness bug. The deleted-item-still-showing: with CDC the delete event should have flowed like any change — a day-old ghost means either the consumer dropped/errored on the delete event (bug: check the dead-letter path) or — the design smell — deletes bypass the CDC path (e.g. a manual DB purge that the feed never saw; the disagreement policy is what saves the user experience meanwhile). Ledger: (1) **staleness grant**: 'results reflect changes within 5 minutes' — monitored as consumer checkpoint lag with an alert at half the grant; (2) **disagreement policy**: renderer fetches each hit's source row and drops 404s — the index may over-return, the product never lies (this is why the ghost was invisible to users if the policy exists — and user-visible if someone 'optimized' the re-check away); (3) **rebuild path**: full re-index from the products table (deterministic), runnable in parallel with live consumption into a fresh index + atomic alias swap — tested quarterly, because an untested rebuild path is a hypothesis, not an obligation met.",
                  "hint": "Judge each anomaly against the ledger's three entries — which entry covers it, and what alerts when the entry's promise is broken?"
                },
                {
                  "prompt": "A team feeds their five read models via dual-write from the API handler with try/catch and three retries per model. Construct the specific failure that leaves models permanently inconsistent despite the retries, and explain which two structural properties of log-based feeding close it.",
                  "solution": "Failure: the handler commits the source write, exhausts three retries against the (briefly unreachable) search index — or simply crashes mid-loop, retries and all, on a deploy or OOM kill — and returns. The pending update existed only in that process's memory; the debt died with it. No later process knows the search index was owed an event: the models now disagree until (unless) a full rebuild, and nothing measures the disagreement. Retries only shrank the window — any finite in-memory retry policy has this hole, because the *ledger of debts is volatile*. The two structural properties that close it: **durability of the change record** — the outbox row / CDC log entry commits atomically with the source write, so the debt survives every crash and is retried from durable state until acknowledged (at-least-once, made safe by idempotent/versioned model updates — unit 1's proposition, again); and **single ordering** — all consumers read one ordered stream, so no model can apply changes in a different order than another (killing the cross-store stale-set race), and each model's progress is a checkpoint in that order, making lag — the grant's compliance — a measurable number. Volatile fan-out in the writer becomes durable fan-in from the log; that inversion is the whole fix.",
                  "hint": "Where does the knowledge 'model X is still owed update Y' live in each design, and what kills that knowledge?"
                },
                {
                  "prompt": "Lens product asks for 'Trending now: the 20 most-liked photos of the last hour, refreshed every minute, site-wide.' Design it as a read model: source events, model shape, update mechanics, the obligations ledger, and one thing you refuse to build.",
                  "solution": "Source events: the like stream (and unlikes), already flowing (outbox/CDC per this lesson). Model shape: a time-windowed counter set — per photo, likes in the trailing hour — plus a small top-K structure; the practical form is minute-bucketed counts (photo → [60 per-minute buckets], ring-buffered) with the hourly sum = bucket sum, and a top-20 recomputed each minute from photos active in the window (only photos with recent likes — a tiny working set relative to all photos). Update mechanics: a consumer tails the like stream, increments (photo, current-minute) buckets; a once-a-minute job expires the oldest bucket and recomputes top-20 into a single cached document — which is what every client reads (one key, micro-TTL 60 s, coalesced: the hottest, cheapest read in the system — this unit's own table, bottom to top). Ledger: grant = 'trending lags reality ≤ ~2 min' (stream lag + refresh cadence — stated to product); disagreement = trending links re-fetch source rows at render (deleted/blocked photos drop out — the revocation rule yet again); rebuild = replay the last hour of the like stream into fresh buckets (deterministic; ~minutes). Refuse: exact real-time global ranking (recompute on every like) — ω is the entire like firehose and the grant is 60 s; the proposition says buy the batch, not the firehose. Also refuse per-viewer personalized trending in v1: it multiplies the keyspace by viewers (exercise (b)'s lesson) and belongs to a ranking system, not a counter model.",
                  "hint": "Window the counts (buckets), separate the continuous cheap update from the periodic expensive one, and let the final product be a single cached document."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u3l4-i1",
              "front": "Derived read model — definition and the three obligations?",
              "back": "A store that is a deterministic function of the source, maintained asynchronously, shaped for ONE read pattern (index, listing, aggregate). Obligations: staleness grant (measurable as consumer lag), disagreement policy (re-check source at render; over-return but never lie), rebuild path (batch re-derivation — tested)."
            },
            {
              "id": "u3l4-i2",
              "front": "The precompute inequality?",
              "back": "Precompute wins iff ρ/ω > C_write/C_read (read rate over write rate exceeds maintenance-to-read-cost ratio). Evaluate per model KEY — personalized features hide per-viewer keyspaces where ρ per cell ≈ 0 and precompute loses."
            },
            {
              "id": "u3l4-i3",
              "front": "Why does dual-write to read models structurally fail?",
              "back": "Source commit and model updates are separate, unordered, individually-failable ops; the debt ledger lives in the writer's memory and dies with it (crash between writes → silent permanent divergence). Retries shrink the window; only a durable ordered change record closes it."
            },
            {
              "id": "u3l4-i4",
              "front": "Log-based feeding — the two properties that fix dual-write?",
              "back": "Durability: the change record (outbox row / CDC entry) commits atomically with the source write — debts survive crashes, consumed at-least-once with idempotent applies. Single order: all models consume one ordered stream — no cross-store reordering; checkpoint lag makes staleness measurable."
            },
            {
              "id": "u3l4-i5",
              "front": "Cache vs read model — the one property that differs?",
              "back": "Both are derived copies; a cache holds answers it happened to compute (rebuild = re-ask everything), a read model is a deterministic function of the source (rebuild = one batch job). Design for re-derivability on purpose — it turns corruption from incident into chore."
            }
          ]
        }
      ],
      "masteryCheck": {
        "id": "u3-check",
        "questions": [
          {
            "id": "u3q1",
            "type": "numeric",
            "prompt": "A cache serves reads with T_hit = 2 ms; misses cost T_miss = 42 ms (probe + origin). At hit ratio h = 0.9, what is the effective mean read latency in milliseconds?",
            "answer": 6,
            "tolerance": 0.3,
            "points": 1,
            "explanation": "E[T] = h·T_hit + (1−h)·T_miss = 0.9 × 2 + 0.1 × 42 = 1.8 + 4.2 = 6 ms. Note the structure: the miss term contributes 70% of the mean at just 10% frequency — mean latency is linear in miss ratio, which is why early hit-ratio gains dominate the latency dividend."
          },
          {
            "id": "u3q2",
            "type": "numeric",
            "prompt": "An origin currently receives 2,500 requests/s from a 50 k req/s workload through a cache at h = 0.95. The cache team raises h to 0.99. What origin request rate results?",
            "answer": 500,
            "tolerance": 25,
            "points": 1,
            "explanation": "Origin load = (1−h)·λ = 0.01 × 50,000 = 500/s — a 5× reduction from 4 points of hit ratio, because the origin experiences the miss ratio (5% → 1%). The same arithmetic run backwards is the cold-cache warning: if h slips from 0.99 to 0.95, origin load quintuples."
          },
          {
            "id": "u3q3",
            "type": "short",
            "prompt": "A media pipeline serves every rendition under a URL containing a hash of the object's bytes, with Cache-Control: immutable and a one-year TTL at every layer. What entire class of cache machinery does this design eliminate? (One or two words.)",
            "accept": [
              "invalidation",
              "cache invalidation",
              "invalidation machinery",
              "purging",
              "purges",
              "cache purging"
            ],
            "points": 1,
            "explanation": "Content addressing makes the URL→bytes mapping immutable by construction: no cached copy can ever be stale, so no invalidation (purge) machinery is needed for freshness — updates are new URLs plus a metadata pointer change. (A purge path survives only for takedown/removal requirements, which are about deletion, not staleness.)"
          },
          {
            "id": "u3q4",
            "type": "mcq",
            "prompt": "A key is read 8,000 times/s; regeneration takes 250 ms. Its TTL expires. Which statement is correct?",
            "options": [
              "Without protection, ~2,000 identical requests hit the origin; with per-key request coalescing, exactly one does",
              "Without protection, ~8,000 requests hit the origin per second forever; coalescing reduces this to 250",
              "Raising the TTL from 60 s to 600 s would shrink the herd by 10×",
              "The herd only forms if the cache tier itself is down"
            ],
            "answer": 0,
            "points": 1,
            "explanation": "The herd is λ·T_regen = 8,000 × 0.25 = 2,000 concurrent identical queries during the regeneration window (Little's Law); coalescing serializes regeneration to exactly one origin request per expiry, with concurrent readers served stale or made to wait. Option b confuses the transient herd with steady state; option c is the TTL trap — TTL sets herd *frequency*, not size; option d confuses stampedes (a per-key expiry event in a healthy cache) with cold-cache incidents."
          },
          {
            "id": "u3q5",
            "type": "proof",
            "prompt": "A read path has cache probe cost 1 ms and origin cost 40 ms (miss total 41 ms). The latency SLO requires mean read latency ≤ 3 ms. (a) Derive the effective-latency formula from first principles. (b) Compute the minimum hit ratio that meets the SLO. (c) The origin also has a capacity constraint: it saturates above 1,500 req/s, and the workload is 60 k req/s. Compute the minimum hit ratio the capacity constraint imposes, and state which constraint governs the design and why the distinction matters operationally.",
            "rubric": [
              "Derives E[T] = h·T_hit + (1−h)·T_miss as a probability-weighted expectation over the two outcomes (hit at 1 ms, miss at 41 ms), not merely quotes it",
              "Solves the latency constraint correctly: h·1 + (1−h)·41 ≤ 3 → 41 − 40h ≤ 3 → h ≥ 0.95",
              "Solves the capacity constraint correctly: (1−h)·60,000 ≤ 1,500 → 1−h ≤ 0.025 → h ≥ 0.975",
              "Identifies capacity (h ≥ 0.975) as the governing (stricter) constraint, and articulates the operational difference: missing the latency floor degrades response times gracefully, while dropping below the capacity floor saturates the origin — queueing, timeouts, and the self-amplifying failure modes of an overloaded origin (cliff, not slope)"
            ],
            "solution": "(a) A read hits with probability h, costing T_hit = 1 ms, or misses with probability (1−h), costing the probe plus origin = 41 ms. The mean is the probability-weighted sum: E[T] = h·1 + (1−h)·41 = 41 − 40h. (b) 41 − 40h ≤ 3 ⇒ 40h ≥ 38 ⇒ **h ≥ 0.95**. (c) Origin load is the miss stream: (1−h)·60,000 ≤ 1,500 ⇒ 1−h ≤ 0.025 ⇒ **h ≥ 0.975**. The capacity constraint governs (0.975 > 0.95). The distinction matters because the two floors fail differently: at h = 0.96, the latency SLO is met (E[T] = 2.6 ms) but the origin receives 2,400 req/s against 1,500 capacity — queues grow, origin latency inflates, which inflates T_miss and E[T] *and* extends regeneration windows (bigger stampede herds), the positive feedback that turns a hit-ratio dip into an outage. Latency floors degrade linearly; capacity floors are cliffs. Operationally: alert on hit ratio approaching 0.975 (the real floor), keep origin headroom or shedding for cold-cache events, and treat the cache tier as availability-critical — the borrowed-capacity conclusion, derived numerically. ∎",
            "points": 3,
            "explanation": "The two-constraint structure is the lesson: latency arguments and offload arguments both set hit-ratio floors, and the binding one is usually capacity — which is also the one that fails as a cliff. Designs (and alerts) should be built against the stricter floor, with the failure asymmetry stated."
          },
          {
            "id": "u3q6",
            "type": "open",
            "prompt": "Design the complete read path for an e-commerce product catalog: 80 M product pages; 120 k page-views/s peak; each page composes product details (title, description, images — edited by merchants occasionally), price (changes several times/day for some products, must show within 60 s of a change), inventory ('in stock / low / out' — must never show in-stock at checkout when out), and reviews (append-mostly, top-3 shown). Product images average 300 KB × 5 per page; p99 page SLO 800 ms globally. Specify: the cache/CDN layering per component, TTLs and invalidation triggers, stampede protection where it matters, what is never cached and why, and the two failure scenarios your design must survive.",
            "rubric": [
              "Separates the page into components with different freshness classes and treats each on its own line (details, price, inventory display vs inventory at checkout, reviews, images) — rather than one cache policy for 'the page'",
              "Images: content-addressed immutable URLs behind a CDN with effectively infinite TTLs and no invalidation; edits produce new URLs + pointer updates; global p99 met by edge proximity (the geography argument)",
              "Price and details: application-cache with explicit invalidation on merchant edit/price change plus TTL backstop sized to the stated grant (price ≤ 60 s), delete-not-set discussed or leases/CAS for the race; review-list cached with short TTL or invalidation on append",
              "Inventory: the display badge may be cached briefly (advisory, bounded staleness), but the checkout-time check reads authoritative state uncached — the decompose-into-advisory-read-plus-authoritative-check move, explicitly tied to the consequence of a stale 'in stock' at commit",
              "Stampede protection (per-key coalescing + stale-while-revalidate) placed on hot keys (popular products, flash-sale pages), with the λ·T_regen reasoning or an equivalent quantitative argument; and at least one named surviving-failure scenario for each of: cold cache/tier restart (origin exposure arithmetic or mitigation) and a flash-sale hot-key event"
            ],
            "solution": "Decompose by freshness class. **Images**: content-addressed (`/media/{hash}`), `immutable`, 1-year TTLs, CDN-served — merchants' edits mint new URLs; the 800 ms global p99 is dominated by media, and edge proximity (~25 ms) buys it; zero invalidation machinery. **Product details**: app cache (Redis-class), cache-aside with delete-on-edit-commit + 1 h TTL backstop; leases/CAS on repopulate (hot product + edit coincide during merchandising pushes). Page-fragment caching of the composed page is legal only if price/inventory are excluded or composed client/edge-side — state it. **Price**: the grant is explicit (visible ≤ 60 s): cache-aside with invalidation on price-change commit AND a 60 s TTL backstop — belt and suspenders sized exactly to the grant; flash-sale prices are hot keys → coalescing mandatory. **Reviews**: top-3 fragment cached, invalidated on append (or micro-TTL 60 s — append rate is low; either passes, say which grant covers it). **Inventory**: two different reads. The badge on the page: advisory, cache with micro-TTL 5–10 s (bounded staleness, granted — a briefly stale badge misleads mildly). The checkout commit: NEVER cached — an authoritative, current-state check (unit 2's strong tier: stock decrement is check-and-claim), because the consequence of staleness there is selling what you don't have; this is the decompose move — advisory read cheap, authoritative check rare and uncached. **Stampede/hot keys**: flash-sale product pages concentrate 10⁴–10⁵ req/s on single keys; per-key coalescing + stale-while-revalidate bounds regeneration to 1 per expiry (λ·T_regen otherwise puts thousands of identical queries on the origin at every 60 s price-TTL boundary — arithmetic shown); probabilistic early refresh de-synchronizes expiries. **Survive**: (1) cache-tier cold start — origin sized for (1−h)→1 on a shard-sized slice only: rolling restarts shard-by-shard + cache replication; state the borrowed-capacity sentence ('origin cannot survive full raw load; the tier is availability-critical'). (2) Flash-sale herd — coalescing + serving ≤60 s-stale price under regeneration + origin shedding beyond capacity; the badge may briefly lag, checkout stays correct because its check never trusted the cache. What is never cached, listed: checkout inventory check, anything authorization-shaped (merchant-only preview pages), payment state.",
            "points": 3,
            "explanation": "The scenario packs all four lessons into one page: immutability where possible (images), granted staleness where cheap (price, badge, reviews), decomposition where correctness binds (inventory), and stampede/cold-cache survival as designed properties rather than incident discoveries. Grading follows the unit's thesis: a single 'cache the page for 5 minutes' answer fails on every axis at once; the winning answer is a per-component ledger of policy, TTL, trigger, and race protection, with the two failure drills run in the design instead of in production."
          }
        ]
      }
    },
    {
      "id": "u4",
      "title": "The Write Path",
      "summary": "Queues and backpressure arithmetic, the delivery guarantees a network actually permits, the economics of fan-out, and the partitioned log that feeds every derived model.",
      "intro": "Unit 3 ended with a debt deliberately left on the table: every derived model — the search index, the hashtag listing, the trending counters — depends on a durable, ordered stream of changes, and Lens has been accumulating asynchronous work since unit 1 (transcoding, feed delivery, the 10-second freshness grant that made async legal in the first place). This unit builds the write path that pays those debts. It opens with the queue itself — the shock absorber between bursty producers and sized consumer fleets — and the backpressure arithmetic that separates a buffer from a time bomb. It then confronts the hard truth of every asynchronous boundary: exactly-once delivery is impossible, and effectively-once must be manufactured from at-least-once plus idempotency, extending unit 1's retry proposition to consumers. With that machinery in hand, it settles the question the course has circled since the requirements lesson: how a feed is actually built — fan-out on write versus read, and the hybrid that survives celebrities. It closes with the partitioned log, the backbone that carries change events to every consumer at its own pace. The gate asks you to design an asynchronous backbone end to end and defend every guarantee it claims.",
      "references": [
        "Jay Kreps — 'The Log: What every software engineer should know about real-time data's unifying abstraction' (LinkedIn Engineering, 2013)",
        "Kreps, Narkhede & Rao — Kafka: a Distributed Messaging System for Log Processing (NetDB 2011)",
        "Raffi Krikorian — Timelines at Scale (QCon 2012) — Twitter's fan-out architecture and numbers",
        "Martin Kleppmann — Designing Data-Intensive Applications, chs. 8 (unreliable networks) & 11 (stream processing)",
        "Alex Xu — System Design Interview vol. 1, ch. 11 (news feed) & vol. 2 (message queues)",
        "Brandur Leach — Transactionally Staged Job Drains in Postgres (2017) — the outbox pattern"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u4l1",
          "title": "Queues and Backpressure",
          "estMinutes": 25,
          "builds_on": [
            "u1l2",
            "u3l4"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Why the write path needs a buffer",
              "body": "The read path of unit 3 was built on a grant: the product agreed that followers may see a photo ten seconds late, that search may lag a minute, that transcoded video may take minutes. Every one of those grants converts a synchronous obligation into **deferred work** — and deferred work needs somewhere to wait. That somewhere is the **queue**: a durable buffer between the code that discovers work exists (the producer — an upload handler, an outbox tailer) and the fleet that performs it (the consumers — transcoders, indexers, fan-out workers).\n\nThe queue buys two distinct things, and the distinction disciplines the design. **Decoupling**: the producer's latency and availability stop depending on the consumer's — the upload handler enqueues 'transcode this' in a millisecond and returns; the transcoder fleet can be slow, deploying, or briefly dead without the upload path noticing (each side now fails independently — the unit-1 warning about network boundaries, here purchased deliberately for its benefit). **Smoothing**: producers are bursty (the ×3 diurnal peak of unit 1, the ×10 launch spike) while consumer fleets are sized to a budget; the queue absorbs the difference, letting the fleet be sized near *average* load instead of peak — provided someone does the arithmetic of what 'absorbing' costs in delay. That arithmetic is this lesson's theorem, and skipping it is how queues become the place where work goes to be forgotten."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Queue vocabulary and stability",
              "statement": "Work arrives at rate λ (jobs/s) and is served by a consumer fleet with total capacity μ (jobs/s); the **utilization** is ρ = λ/μ. A queue is **stable** only if ρ < 1 over every sustained window: if λ > μ persists, the backlog grows without bound — no buffer size saves a fleet that is simply too slow on average. **Backpressure** is the set of mechanisms by which a full or lagging queue pushes back on producers: blocking enqueues, rejecting with retry-after, shedding low-priority work, or degrading the product. A **bounded queue with a stated overflow policy** is a design; an unbounded queue is a decision not yet made, postponed to the worst possible moment."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "Burst absorption and drain time",
              "statement": "Let a fleet with capacity μ face a burst of arrival rate λ_burst > μ lasting T seconds, after which arrivals fall to λ_after < μ. Then:\n\n(i) the backlog accumulated by the end of the burst is B = (λ_burst − μ) · T jobs;\n\n(ii) the time to drain the backlog after the burst is D = B / (μ − λ_after);\n\n(iii) the worst additional queueing delay experienced by a job (one arriving at the burst's end) is B/μ, and work enqueued at that moment completes only after ~B/μ seconds — so the freshness grant of any consumer downstream must exceed the whole excursion's delay, not the steady-state's.",
              "proof": "(i) During the burst, jobs arrive at λ_burst and depart at μ (the fleet is saturated), so the backlog grows at the constant net rate λ_burst − μ for T seconds: B = (λ_burst − μ)T.\n\n(ii) After the burst, the backlog shrinks at net rate μ − λ_after > 0; starting from B, it reaches zero after D = B/(μ − λ_after).\n\n(iii) A job arriving at the burst's end finds B jobs ahead of it; the fleet works through predecessors at rate μ (arrivals behind it don't delay it in FIFO order), so it waits B/μ. ∎\n\nTwo readings make this theorem practical. First, the *sizing* reading: the fleet needn't be sized for peak — it must be sized so that (λ_burst − μ)T stays within the delay the staleness grant permits, and so that μ − λ_after drains the excursion before the next one. Second, the *asymmetry* reading: drain is slow when headroom is thin — a fleet at ρ = 0.95 average that survives a burst carries the backlog for twenty times the burst's excess, because the drain rate is only 5% of capacity. Sustained high utilization and fast recovery are enemies; pick a target ρ (0.6–0.7 is conventional) with the drain arithmetic in view. (Beyond bursts, randomness alone queues: for Poisson-ish arrivals the M/M/1 estimate W ≈ 1/(μ − λ) shows waiting time exploding as ρ → 1 — the same 'headroom is latency' law in stochastic form.)"
            },
            {
              "type": "example",
              "heading": "Worked example: sizing the Lens transcode fleet",
              "body": "Video upload (unit 3's pipeline): 20 k videos/day, transcode cost 180 s of worker time each; the grant says 'available within minutes — target p95 under 5 minutes end to end'.\n\n**Average arithmetic**: 20 k/day ≈ 0.23/s × 180 s = ~42 workers busy on average (Little's Law, as in unit 1). **Peak**: uploads are diurnal ×3 ≈ 0.7/s → 126 workers to keep up with peak *instantaneously*. The queue lets us choose anything between 42 and 126 — priced in delay by the theorem.\n\nTry μ = 60 workers' worth (60/180 = 0.33 jobs/s of capacity). Evening burst: λ_burst = 0.7/s for T = 2 h: backlog B = (0.7 − 0.33) × 7,200 ≈ **2,660 videos**; worst wait ≈ B/μ = 2,660/0.33 ≈ 8,000 s ≈ 2.2 hours. The 5-minute grant is annihilated — 60 workers is a false economy dressed as thrift.\n\nSolve backwards from the grant instead: worst wait ≤ 300 s ⇒ B ≤ 300·μ. With B = (0.7 − μ)·7,200 (treating μ in jobs/s), the inequality gives 7,200(0.7 − μ) ≤ 300μ ⇒ μ ≥ 0.67 jobs/s ≈ **121 workers** during the evening window. The honest conclusions: (1) a tight freshness grant on a bursty workload buys almost no fleet savings from queueing — the queue's real job here is smoothing minute-scale jitter and surviving consumer deploys, not shaving the diurnal peak; (2) if 121 workers offends the budget, the *grant* is what must be renegotiated ('videos may take up to 30 min at peak') — and that is a product decision, surfaced by arithmetic, exactly like every staleness grant before it. Autoscaling the fleet to the diurnal curve is the standard resolution — with the theorem governing how fast scale-up must react (the backlog accrued during scale-up lag is (λ − μ)·T_react, and it must fit the grant too)."
            },
            {
              "type": "example",
              "heading": "Worked example: the view-event firehose, batched",
              "body": "The other classic queue consumer: unit 2's view counter, now built properly. Producers: feed renders emitting view events — 100 M/day at 1 M DAU, ~1,200/s average, 4 k/s peak (and ×100 at the horizon). Consumer: a small fleet that **batches** — drain up to 5,000 events or 2 seconds' worth, aggregate in memory into per-photo deltas, and issue one multi-row `UPDATE` per batch.\n\nThe arithmetic that makes batching the point: 4 k/s of naive per-event row updates was the hot-row disaster unit 2 rejected. Batched, the database sees one statement per 2 s touching ~the distinct photos viewed in that window — thousands of individual increments collapse into hundreds of rows per statement, and the *per-event* cost falls by an order of magnitude or more (amortization is the write path's version of the cache's offload dividend). Latency: a view is visible in the count within ~2 s + micro-TTL — inside the 'approximate counts' grant with room to spare.\n\nFailure walk (previewing the next lesson): the consumer crashes after applying a batch but before acknowledging it — the events redeliver, and the deltas would double-count. The batch therefore carries an idempotency handle: the consumer records the batch's event-id range with the `UPDATE` in one transaction, and a redelivered batch whose range is already recorded is skipped. Unit 1's proposition, third appearance, now protecting a consumer. That this failure case surfaced *immediately* — in the second example of the first queue lesson — is the honest advertisement for why delivery semantics get the whole next lesson."
            },
            {
              "type": "text",
              "heading": "Backpressure: deciding the overflow policy in daylight",
              "body": "Stability said ρ < 1 *on average*; the theorem sized the excursions; backpressure answers the remaining question — what happens when the bound is reached anyway (a consumer outage, a spike beyond design). The options form a short menu, and the design must pick per queue, in writing. **Block the producer**: enqueue waits — correct for internal pipelines where the producer can afford to slow (the outbox tailer just falls behind the log; nothing is lost), catastrophic on a user-facing path (the upload handler now hangs at the worst time). **Reject with retry-after**: the producer gets an error and backs off (unit 1's retry discipline) — right for API-facing writes; the client owns the retry. **Shed**: drop the work — legal exactly where the requirement tolerates loss (view events: dropping 10% of samples during a spike biases counts negligibly; state it as an approximation grant) and illegal where it doesn't (a transcode job is a user's video: never shed, always reject-or-block upstream instead). **Degrade**: produce a cheaper substitute (skip the 4K rendition during overload; deliver feed entries without trending updates). The wrong answer is the default one — an unbounded queue — which converts overload into unbounded latency (every consumer's staleness grant silently violated, hours of backlog masquerading as 'up') and finally into memory/disk exhaustion, failing the whole broker at once instead of the one workload. Bound every queue; alert on depth *and* on age of the oldest item (depth measures load, age measures broken grants); and rehearse the overflow policy before production does."
            },
            {
              "type": "callout",
              "tone": "danger",
              "body": "**Queue depth is a debt meter, not a health meter.** A deep-but-draining queue after a burst is the design working (the theorem's D is just elapsing). A shallow queue with rising item age means consumers are failing on specific items — poison messages spinning in retry. And a steadily deepening queue at normal traffic is ρ ≥ 1: the fleet is under-sized and no buffer will save it — the backlog is an outage with a delay on it. Three different problems, one metric name; instrument depth, age, and drain rate separately or fly blind."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "An image-processing fleet has capacity μ = 600 jobs/s. A promotion drives arrivals to 900 jobs/s for 10 minutes, then back to 300 jobs/s. (a) Compute the peak backlog and the drain time. (b) Compute the worst job delay. (c) The team proposes doubling broker storage 'so we never hit the bound during promotions.' Evaluate against the freshness grant of 60 s on this pipeline.",
                  "solution": "(a) B = (900 − 600) × 600 s = **180,000 jobs**; drain D = 180,000 / (600 − 300) = 600 s = **10 minutes**. (b) Worst wait ≈ B/μ = 180,000/600 = **300 s = 5 minutes** (the job arriving at burst's end). (c) Bigger storage changes none of these numbers — the backlog fits either way; the problem is that a 5-minute worst delay violates the 60 s grant by 5×, storage or no storage. The theorem gives the real options: raise μ during promotions (autoscale: to keep delay ≤ 60 s, need B ≤ 60μ ⇒ (900−μ)·600 ≤ 60μ ⇒ μ ≥ ~818 jobs/s), shrink the burst reaching this queue (upstream shedding/degrading), or renegotiate the grant for promotion windows. Storage size only decides *where* the violation manifests (queue overflow vs stale results) — it never decides *whether*. Depth bounds and delay grants are different constraints; conflating them is the classic queue-sizing error.",
                  "hint": "Apply the theorem's three formulas; then check each against the 60 s grant — which numbers does storage size appear in?"
                },
                {
                  "prompt": "A fleet runs at ρ = 0.95 average utilization ('efficient!'). Using the theorem, explain quantitatively why this fleet recovers terribly from small incidents, comparing a 10-minute consumer outage at ρ = 0.95 vs ρ = 0.65 (same λ; μ sized accordingly).",
                  "solution": "During a full consumer outage, backlog accrues at λ regardless of ρ: B = λ × 600 s in both cases. The difference is drain: at ρ = 0.95, headroom is μ − λ = λ(1/0.95 − 1) ≈ 0.053λ → D = 600λ / 0.053λ ≈ **11,300 s ≈ 3.1 hours** to recover from a 10-minute outage. At ρ = 0.65: headroom = λ(1/0.65 − 1) ≈ 0.54λ → D = 600/0.54 ≈ **1,110 s ≈ 18.5 minutes**. Same incident, 10× the recovery, purely from utilization: drain time scales as 1/(1−ρ) × burst duration (in these units), so recovery cost explodes as ρ → 1. 'Efficiency' at ρ = 0.95 is really a loan against every future incident, repaid at hours of violated grants per minute of outage. This is why the conventional 0.6–0.7 target is not waste — headroom IS the recovery mechanism, the fleet-sizing twin of unit 1's peak-provisioning rule.",
                  "hint": "Outage backlog is the same in both cases; compute the two drain rates μ − λ and compare D."
                },
                {
                  "prompt": "Assign the right overflow policy (block / reject-with-retry / shed / degrade) to each queue, with one sentence each: (a) the outbox-tailer → search-indexer stream during an indexer outage; (b) password-reset emails during an email-provider brownout; (c) real-time analytics events at 5× design load during a televised event; (d) Lens's transcode queue when the worker fleet is at capacity.",
                  "solution": "(a) **Block** (fall behind): the tailer simply stops advancing its checkpoint; the log durably holds the debt, search staleness grows and is *measured* (lag vs grant) — nothing user-facing hangs, nothing is lost. This is the log absorbing exactly as designed. (b) **Block/queue with unbounded patience is wrong — but so is shedding**: a reset email is a user promise. Reject new *requests* upstream with retry-after if the backlog exceeds the grant ('email within 5 min'), keep already-accepted jobs queued and drained in order; escalate the provider issue. Accepted work: never shed. (c) **Shed with sampling**: drop a stated fraction (e.g. keep 1-in-5, scale counts by 5) — analytics tolerates statistical loss (declare the approximation grant); protecting the pipeline beats perfect counts during the spike. (d) **Reject at the API with retry-after** (client retries with its idempotency key, unit 1) once queue delay would violate the stated video grant — the upload UI shows 'processing delayed'; blocking the upload handler would hang users, and shedding a user's video is unthinkable. Pattern: the policy follows from what the queued item *is* — a debt ledger entry (block), a promise (protect and drain), a sample (shed), or a user's artifact (reject new intake, never drop accepted).",
                  "hint": "Classify each item: is losing it priced (sample), promised (email), or a user artifact? Can the producer safely wait?"
                },
                {
                  "prompt": "Your monitoring shows a queue with: depth 40 k and slowly falling; oldest-item age 55 minutes and rising; consumer throughput normal; error rate near zero. Diagnose what is almost certainly happening and what to check, using the three-signal discipline from the callout.",
                  "solution": "Depth falling + throughput normal says the fleet is draining fine in aggregate — this is not under-capacity (ρ < 1). But oldest-age *rising* while depth falls means specific items are not completing: the head of the queue (or a subset) is being retried and requeued — **poison messages**: items that fail deterministically (malformed payload, a record deleted from the DB they reference, a code path bug), spinning through retry cycles while healthy traffic flows around them (near-zero *reported* error rate often means the failures are being caught-and-requeued rather than surfaced — check for a retry loop that swallows exceptions). Checks: per-item retry counts at the queue head; consumer logs keyed by those message ids; whether a dead-letter queue (DLQ) exists and is being used. Fix class: a max-retry policy that moves items to a DLQ after N attempts (bounding the spin), alerting on DLQ arrivals, and a runbook for replaying DLQ items after the underlying cause is fixed. The design lesson: retry policy and DLQ are part of every queue's definition, not optional hygiene — without them, one poison message eventually owns the oldest-age metric and, if ordering matters, blocks everything behind it.",
                  "hint": "Depth measures aggregate load; age measures the fate of individual items. What kind of item makes age rise while depth falls?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u4l1-i1",
              "front": "The two things a queue buys?",
              "back": "Decoupling (producer latency/availability independent of consumers — each side fails alone) and smoothing (fleet sized near average, burst absorbed as bounded delay). Both priced by the burst/drain arithmetic, not free."
            },
            {
              "id": "u4l1-i2",
              "front": "Burst absorption theorem — the three formulas?",
              "back": "Backlog B = (λ_burst − μ)·T; drain time D = B/(μ − λ_after); worst job delay ≈ B/μ. Downstream freshness grants must cover the excursion's delay, not steady state."
            },
            {
              "id": "u4l1-i3",
              "front": "Why is high average utilization the enemy of recovery?",
              "back": "Drain rate is the headroom μ − λ: at ρ = 0.95 a 10-min outage takes ~3 h to drain (≈ 1/(1−ρ) scaling); at ρ = 0.65, ~20 min. Headroom IS the recovery mechanism — target ρ ≈ 0.6–0.7."
            },
            {
              "id": "u4l1-i4",
              "front": "The overflow-policy menu and how to choose?",
              "back": "Block producer (internal pipelines that can wait), reject-with-retry-after (user-facing intake; client owns retry), shed (only loss-priced items like sampled analytics — state the grant), degrade (cheaper substitute). Choose by what the item IS; unbounded queues are the un-decision."
            },
            {
              "id": "u4l1-i5",
              "front": "The three queue signals and what each means?",
              "back": "Depth = load (deep-but-draining after a burst is the design working); oldest-item age = grant compliance (rising age + normal throughput = poison messages spinning); drain rate vs arrival = stability (steady deepening at normal traffic = ρ ≥ 1, under-sized fleet)."
            },
            {
              "id": "u4l1-i6",
              "front": "What bounds every queue design must state?",
              "back": "A size bound with a chosen overflow policy, a max-retry policy with a dead-letter queue (poison message escape hatch), and alerts on depth AND age separately — plus the grant arithmetic showing worst-case delay fits."
            }
          ]
        },
        {
          "id": "u4l2",
          "title": "Delivery Semantics and Idempotent Consumers",
          "estMinutes": 26,
          "builds_on": [
            "u4l1",
            "u1l4"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The question every asynchronous boundary must answer",
              "body": "*Queues and Backpressure* ended with a consumer crashing between applying a batch and acknowledging it — and quietly assumed the fix. This lesson earns it. Every queue, log, webhook, and RPC retry loop faces the same question: when a failure interrupts the conversation between a sender and a processor, **how many times does the work happen?** The possible promises have names. **At-most-once**: the message is delivered once or lost — no duplicates, possible silence. **At-least-once**: the message is redelivered until acknowledged — no loss, possible duplicates. **Exactly-once**: delivered and processed precisely once — the promise everyone wants, and, at the delivery layer, the one nobody can have.\n\nThe impossibility is not an engineering shortfall to be fixed by a better broker; it is a consequence of crash ambiguity, provable in a paragraph, and internalizing *why* changes how you design: you stop shopping for a system that promises exactly-once delivery and start building the thing that is actually achievable — **exactly-once effects**, manufactured from at-least-once delivery plus idempotent processing. Unit 1 proved this recipe for client retries against an API; here it becomes the consumer's contract, and the load-bearing pattern of every pipeline in this course."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "Exactly-once delivery is impossible under crash failure",
              "statement": "Consider a broker delivering a message m to a consumer that may crash at any point, over a network that may lose messages. No protocol guarantees that the consumer's processing of m occurs exactly once. Any protocol must choose, when acknowledgment is absent, between redelivery (risking duplicate processing — at-least-once) and no redelivery (risking zero processing — at-most-once).",
              "proof": "The consumer's protocol, whatever it is, performs its processing of m and sends an acknowledgment; consider the moment the broker has sent m and no acknowledgment has arrived. Two histories are consistent with everything the broker can observe: (H1) the consumer crashed *before* processing m — the ack is absent because processing never happened; (H2) the consumer processed m and crashed *after* processing but before its ack left (or the ack was lost in the network). The broker's observations — silence — are identical in H1 and H2, so its next action must be the same in both. If it redelivers: in H2, m is processed twice. If it does not: in H1, m is processed zero times. Either way, some history violates exactly-once. (Moving the ack before processing merely swaps which history bites: crash after ack, before processing, loses m — at-most-once.) No placement of the acknowledgment relative to processing escapes, because the crash can always fall between the two. ∎\n\nWhat the proof does *not* forbid: making the *processing* idempotent, so that H2's duplicate execution has no additional effect — which converts at-least-once delivery into exactly-once effects. The impossibility lives at the delivery layer; the solution lives at the effect layer. Every system that advertises 'exactly-once semantics' is, under the hood, this maneuver within some scope — at-least-once plus deduplication or transactional effects — and the scope boundary is where its guarantee ends."
            },
            {
              "type": "theorem",
              "kind": "corollary",
              "name": "Effectively-once for consumers",
              "statement": "Let a broker deliver at-least-once, and let the consumer, atomically with each message's effect, record the message's identity (id or offset) in the same transactional domain as the effect — skipping any message whose identity is already recorded. Then each message's effect is applied exactly once, regardless of crashes and redeliveries.",
              "proof": "This is unit 1's retry-safety proposition with the client renamed 'broker' and the idempotency key renamed 'message id': at-least-once delivery plays the role of the retrying client (existence — every message is eventually processed, since unacknowledged messages redeliver and the consumer acknowledges only after its transaction commits); the atomic record-with-effect plays the same role as before (uniqueness — two applications of one id cannot both commit, because the second finds the id recorded, or aborts on its uniqueness constraint). Both legs transfer verbatim, so the effect occurs exactly once. ∎\n\nThe three practical embodiments, in descending order of machinery: (1) **naturally idempotent applies** — the effect is a set/upsert keyed by the entity with a version ('photo 123's caption := X where version < 7'): re-application is a no-op by construction, no dedup table needed (the derived-model updates of unit 3 were designed this way on purpose). (2) **Dedup record in the effect's transaction** — the batch-id table from the view-counter example; required when effects are increments or appends. (3) **Offset-as-dedup** — when consuming a log in order (next lesson), committing the consumer's offset atomically with the effect makes the offset itself the dedup record: everything at-or-before it is by definition applied. Choose the cheapest one the effect's shape permits — but always choose one; 'we haven't seen duplicates in testing' is H2 waiting for production traffic."
            },
            {
              "type": "diagram",
              "kind": "sequence",
              "caption": "The crash-ambiguity window, and the corollary closing it: the consumer crashes after committing effect+record but before acking; the broker (rightly) redelivers; the dedup check makes the redelivery a no-op, and the second ack completes the protocol.",
              "actors": [
                "Broker",
                "Consumer",
                "Database"
              ],
              "messages": [
                {
                  "from": "Broker",
                  "to": "Consumer",
                  "label": "deliver m (id=7291)"
                },
                {
                  "from": "Consumer",
                  "to": "Database",
                  "label": "TX: effect + record id 7291",
                  "tone": "sage"
                },
                {
                  "from": "Database",
                  "to": "Consumer",
                  "label": "committed",
                  "tone": "sage"
                },
                {
                  "note": "✂ consumer crashes — ack never sent"
                },
                {
                  "from": "Broker",
                  "to": "Consumer",
                  "label": "redeliver m (id=7291)",
                  "tone": "rust"
                },
                {
                  "from": "Consumer",
                  "to": "Database",
                  "label": "TX: id 7291 already recorded?",
                  "dashed": true
                },
                {
                  "from": "Database",
                  "to": "Consumer",
                  "label": "yes — skip effect",
                  "dashed": true,
                  "tone": "sage"
                },
                {
                  "from": "Consumer",
                  "to": "Broker",
                  "label": "ack m",
                  "tone": "sage"
                }
              ]
            },
            {
              "type": "example",
              "heading": "Worked example: the search indexer, made honest",
              "body": "Unit 3 promised the search index would be fed by the change stream 'with retries and resume from a checkpoint'; the corollary now fills in every word. The outbox tailer publishes photo events at-least-once (it, too, can crash between publishing and advancing its own cursor — the same theorem bites every hop, so the stream itself carries duplicates). The indexer consumes: for each event, it applies a **versioned upsert** — 'index doc for photo 123 := (caption, tags, owner) at version 41; ignore if current version ≥ 41' — embodiment (1), natural idempotence, chosen deliberately when the index-doc schema was designed.\n\nWalk the failures. *Duplicate event* (any cause): version check makes it a no-op. *Out-of-order pair* (edit v41 arrives after v42 due to a retry): the version check rejects the stale write — the cross-store stale-set race of unit 3, closed by the same versioning that closes duplicates; one mechanism, two bugs. *Crash mid-batch*: unacked events redeliver; every apply is idempotent; the checkpoint advances only past completed work. *Delete events*: deletion must also be idempotent and version-aware — a tombstone ('deleted at v43') rather than a bare row-removal, so a straggling v41 update cannot resurrect a deleted doc: the classic zombie-write bug, and the reason tombstones appear in every serious replicated system.\n\nThe deliverable-grade summary for any consumer: **name the delivery guarantee you receive (at-least-once), the idempotence embodiment you chose, and the failure walk that proves it** — three sentences that distinguish a pipeline from a hope."
            },
            {
              "type": "example",
              "heading": "Worked example: payment webhooks — at-least-once from strangers",
              "body": "The pattern's most consequential arena is one you don't control: **webhooks** from a payment provider ('charge succeeded', 'subscription renewed'). Every serious provider documents the same contract: events are delivered *at least once* — duplicates are normal, ordering is not promised, and delivery may lag. This is not sloppiness; it is the theorem — the provider faces the same crash ambiguity toward you that any broker faces, and at-least-once is the side that doesn't silently lose your money events.\n\nThe consumer that survives this contract: (1) **verify then persist first** — authenticate the event (signature), then write it raw to an events table keyed by the provider's event id (`INSERT … ON CONFLICT DO NOTHING`) and ack 200 immediately; do *not* do business logic inline (a slow handler causes provider-side timeouts → more redeliveries → more duplicates, the retry amplification of unit 3's incident, cross-organization edition). (2) **Process from your own table** — a worker consumes persisted events, applying effects under the corollary: the conflict-ignored insert *is* the dedup record, and downstream effects ('mark order paid') are keyed by event id in the same transaction. (3) **Reconcile** — periodically list the provider's events via API and diff against your table, because at-least-once still means 'delivery may lag or, in pathological windows, need a pull': the reconciliation job from unit 2's counter template, now guarding revenue.\n\nNote the architecture that fell out: the webhook endpoint became a producer, the events table a queue, the worker an idempotent consumer — the whole unit so far, reconstructed from first principles at an organizational boundary, because the theorem holds there too."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**'Exactly-once' on a product page always has a scope — find its edge before you lean on it.** Kafka's transactions give exactly-once *within* a consume-transform-produce chain into Kafka; a stream processor's guarantee ends where a side effect leaves its checkpointed world (an email sent, an external API called — those can still double-fire on replay). The question that cuts through every marketing claim: *if this node crashes after the effect but before the acknowledgment, what un-does or deduplicates the effect?* If the answer involves a domain outside the transaction — it doesn't, and you need the corollary's machinery at that edge."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A teammate proposes: 'Our consumer acks each message BEFORE processing it — that way the broker never redelivers and we get exactly-once.' Using the impossibility proof's case analysis, name the guarantee this actually provides, the failure history that bites, and a workload where this choice is nonetheless correct.",
                  "solution": "Ack-before-processing is **at-most-once**: the proof's remaining bad history is crash-after-ack-before-processing — the broker, seeing the ack, never redelivers, and the message's effect happens zero times; silence, not duplication, is now the failure mode. (No exactly-once was created; the ambiguity was only pushed to the other side of the ack.) Correct workload: where a lost item is cheaper than a duplicate *and* the data is dense in time — e.g. a live metrics/telemetry stream (missing one sample biases nothing; the next sample arrives in seconds), or presence pings. Wrong workload: anything that is a promise or an artifact (payments, emails, transcode jobs) — there, loss is the expensive direction and at-least-once + idempotence is the mandatory shape. The design discipline: choose the ack placement per queue, in writing, by which failure direction the workload can afford — never by which is easier to implement.",
                  "hint": "Rerun the proof's two histories with the ack moved before processing — which one can the broker no longer repair?"
                },
                {
                  "prompt": "A notification consumer processes 'send push notification' messages by calling the push gateway, then recording the message id. Under at-least-once delivery, identify the failure that causes duplicate notifications despite the dedup record, explain why this consumer CANNOT be made exactly-once by the corollary alone, and give the two mitigations actually available.",
                  "solution": "The effect (external push-gateway call) and the dedup record live in *different transactional domains* — the corollary's atomicity premise is unsatisfiable: crash after the gateway call, before the record commits → redelivery → second call → double notification. No arrangement fixes it locally (record-first risks recording-then-crashing = notification never sent — at-most-once for a promise; effect-first risks the duplicate). Mitigations: (1) **push the idempotency across the boundary** — if the gateway accepts an idempotency key (send with key = message id), the gateway becomes the transactional domain and the corollary applies at ITS edge (this is why well-designed external APIs accept idempotency keys — unit 1's proposition, offered as a service); (2) **narrow the window + tolerate**: record 'attempting id X' before the call, treat redelivery of an 'attempting' message as suspicious and check gateway-side status or accept the rare duplicate (a duplicate push is annoying, not corrupting — price the failure direction). The general law: side effects into systems that offer no idempotency handle are the irreducible residue of the impossibility theorem; minimize them, wrap them last, and choose their failure direction deliberately.",
                  "hint": "Where exactly is the transaction boundary? Can 'call the gateway' and 'record the id' ever commit atomically?"
                },
                {
                  "prompt": "An inventory consumer applies 'reserve 2 units of SKU 991' events with a dedup table, but a bug report shows an over-reservation. Investigation: the consumer processes events for the same SKU concurrently on two threads for throughput. Explain the failure interleaving (the dedup table was consulted!), and the fix that preserves parallelism.",
                  "solution": "Check-then-act race across threads: thread A reads dedup (id 500 absent), thread B reads dedup for the *redelivered copy* of id 500 (also absent — A hasn't committed), both apply the reservation, both commit — the dedup check happened, but not atomically with the effect against the concurrent duplicate. (If the dedup insert has a proper uniqueness constraint in the same transaction as the effect, the second commit aborts — so either the constraint was missing, the record was written outside the transaction, or the two effects hit different rows that don't conflict.) The fix that keeps parallelism: **serialize per key, parallelize across keys** — route events by SKU to a per-key ordered lane (hash SKU → worker), so no two events for one SKU are ever in flight together; cross-SKU throughput is untouched. This is the same key→lane discipline the partitioned log (next lesson) provides by construction — one of the main reasons logs partition by key. Belt-and-suspenders: keep the uniqueness constraint anyway; defense in depth against routing bugs. General law: idempotence protects against *sequential* duplicates; *concurrent* duplicates additionally need either transactional conflict (constraints) or per-key serialization.",
                  "hint": "Two threads, one redelivered id, both checking before either commits. What discipline prevents two in-flight events for one key?"
                },
                {
                  "prompt": "Design the effectively-once machinery for Lens's feed fan-out consumer (next lesson's component, this lesson's contract): it consumes 'photo posted' events and inserts the photo id into each follower's feed list in a Redis-class store that has no multi-key transactions. Specify the idempotence embodiment, what happens on redelivery mid-fan-out (crash after 60 k of 80 k follower inserts), and why 'at-most-once' is unacceptable here.",
                  "solution": "Embodiment (1), natural idempotence: feed lists are **sets ordered by (timestamp, photo id)** — the insert is 'add photo P at time T to follower F's list', and re-adding an identical (P, T) member is a no-op by data-structure choice (sorted-set semantics), so per-follower duplicate inserts are harmless without any dedup table. That choice makes the whole fan-out re-runnable: on redelivery after a crash at 60 k/80 k, the consumer simply re-executes all 80 k inserts — 60 k are no-ops, 20 k are the missing work; correctness needs no record of 'how far I got' (though a progress checkpoint is a worthwhile *optimization* to skip the re-run's cost). Acking: only after the full fan-out completes — the event redelivers until every follower's insert has happened at least once, and idempotence absorbs the overlap. At-most-once is unacceptable because the failure direction is silent, personal, and permanent: crash mid-fan-out with no redelivery leaves 20 k specific followers whose feeds simply never show this photo — not late, absent — violating the product's core promise in a way no reconciliation naturally catches (each missing entry is one (photo, follower) pair among billions). The lesson's summary sentence, filled in: at-least-once delivery, set-semantics idempotence, failure walk = re-run-and-no-op — three sentences, and the fan-out is a pipeline, not a hope.",
                  "hint": "What data-structure choice makes 'insert into feed' naturally re-runnable? Then ask what a lost (never redelivered) fan-out event costs whom."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u4l2-i1",
              "front": "Why is exactly-once delivery impossible?",
              "back": "Crash ambiguity: broker silence is identical whether the consumer crashed before processing (H1) or after processing, before acking (H2). Redeliver → duplicates in H2; don't → loss in H1. No ack placement escapes — the crash always fits between processing and ack."
            },
            {
              "id": "u4l2-i2",
              "front": "The effectively-once recipe for consumers?",
              "back": "At-least-once delivery + idempotent processing: record the message id/offset atomically with the effect (same transaction), skip already-recorded ids. Unit 1's retry proposition with broker-as-client. Delivery stays duplicated; EFFECTS happen once."
            },
            {
              "id": "u4l2-i3",
              "front": "The three idempotence embodiments, cheapest first?",
              "back": "(1) Naturally idempotent applies — versioned upserts/set-semantics (no-op on re-run); (2) dedup record in the effect's transaction (for increments/appends); (3) offset-as-dedup when consuming an ordered log. Choose the cheapest the effect's shape permits — always choose one."
            },
            {
              "id": "u4l2-i4",
              "front": "At-most-once (ack-before-processing) — when is it right?",
              "back": "When loss is cheaper than duplication AND data is dense (telemetry samples, presence pings): a missing item self-heals in seconds. Never for promises or artifacts (payments, emails, uploads) — there loss is the expensive direction."
            },
            {
              "id": "u4l2-i5",
              "front": "Why do tombstones exist in replicated/derived stores?",
              "back": "Deletes must be idempotent AND version-aware: a bare removal lets a straggling older update resurrect the row (zombie write). 'Deleted at v43' wins version comparisons against late v41 updates — one versioning mechanism closes duplicates, reordering, and resurrection."
            },
            {
              "id": "u4l2-i6",
              "front": "Where does any 'exactly-once' product claim end?",
              "back": "At its transactional scope's edge: the question to ask is 'if the node crashes after the effect but before the ack, what dedups the effect?' Side effects into systems without idempotency handles (emails, external APIs) are the irreducible residue — minimize, wrap last, choose the failure direction."
            }
          ]
        },
        {
          "id": "u4l3",
          "title": "Fan-out Economics",
          "estMinutes": 26,
          "builds_on": [
            "u4l2",
            "u3l4",
            "u2l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The question the course has been circling",
              "body": "Every unit has touched the feed and deferred it. Unit 1 extracted its requirements (150:1 reads, p99 500 ms, 10-second freshness grant). Unit 2 sharded its source tables and discovered the 300-probe scatter with its amplified tail. Unit 3's cache blunted the scatter and its precompute proposition hinted at the real answer; its read-model lesson built the change stream. The last two lessons built the queue and the consumer contract. Now the pieces assemble into the actual decision: **where is a feed computed — at read time or at write time?**\n\n**Fan-out on read** (pull): store nothing extra; when a user opens the feed, gather recent photos from each followed account and merge. Write cost: zero. Read cost: G probes (G = followees), paid 150 times per write, with the tail amplification of unit 2. **Fan-out on write** (push): when a photo posts, insert its id into a precomputed feed list for each follower; reading the feed is one list fetch. Read cost: minimal. Write cost: F inserts (F = followers), paid once per post — and F is power-law distributed, which is where the design earns its keep. The right answer is not a slogan but an inequality — the precompute proposition of unit 3, instantiated with this system's numbers — plus an escape hatch for the tail of the F distribution. This lesson computes both."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Fan-out on write, fan-out on read, and the hybrid",
              "statement": "For a follow-graph feed: **fan-out on write (FoW)** maintains, per user, a materialized feed list; each new post by u triggers one insert into every follower-of-u's list (an asynchronous consumer job — the write amplification is F(u) = u's follower count). **Fan-out on read (FoR)** materializes nothing; each feed load by v gathers and merges recent posts from every account v follows (read amplification G(v) = v's followee count). The **hybrid** partitions authors by follower count against a threshold F*: posts by authors with F ≤ F* fan out on write; posts by authors with F > F* (celebrities) are pulled at read time and merged with the reader's precomputed list. The reader's feed = their list ∪ (recent posts of followed celebrities), merged at render."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The fan-out work equation",
              "statement": "Let posts arrive at rate π with author follower-counts F, and feeds be read at rate r with reader followee-counts G. Aggregate work per unit time:\n\n  W_FoW = π · E[F | author] · c_w    (list inserts)\n  W_FoR = r · E[G | reader] · c_r    (source probes)\n\nwhere c_w, c_r are per-insert and per-probe costs. FoW does less total work exactly when π · E[F] · c_w < r · E[G] · c_r. Since every follow edge contributes both a potential push (author side) and a potential pull (reader side), the ratio reduces — for comparable c_w, c_r and uniform behavior — to the read-to-post ratio r/π: **read-dominated feeds favor push by roughly that factor**. But E[F | author] is a power-law mean: a single author with F = 10⁸ contributes 10⁸ inserts to one post's cost, concentrating W_FoW into spikes that no average conceals — the celebrity term, which the hybrid removes from the push side and prices on the pull side at r · (celebrities followed) probes.",
              "proof": "The two totals are direct counts: each post by an author with F followers performs F inserts under FoW (cost c_w each), so the expected per-post cost is E[F]·c_w and the rate-weighted total is π·E[F]·c_w; symmetrically each feed load under FoR performs G probes at c_r, totalling r·E[G]·c_r. The comparison is their ratio. For the reduction: summing over the follow graph, Σ_authors F(a) = |edges| = Σ_readers G(v), so if posting and reading were uniform across users, π·E[F] and r·E[G] differ exactly by the factor r/π (both expectations equal |edges|/|users| under uniformity). Power-law skew breaks the *distributional* comfort, not the totals: E[F] may stay modest while max F is astronomical, so FoW's total remains favorable while its per-event worst case (one celebrity post = max-F inserts, all at once, all hot) violates any latency-bounded consumer fleet's sizing — the burst theorem of this unit's first lesson with λ_burst = one post. Excising authors with F > F* caps FoW's per-post work at F* and moves those authors' delivery to the read path, where each reader pays probes proportional to the (small) number of celebrities they follow. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: Lens at the horizon, both ways",
              "body": "Numbers at 100 M DAU (unit 1's ratios scaled): posts π = 10 M/day ≈ 100/s average (300/s peak); feed loads r = 500 M/day ≈ 5,000/s (15,000/s peak); mean followers ≈ mean followees ≈ 200; reader G ≈ 300 for active users.\n\n**FoR total**: 500 M loads × 300 probes = **150 B probes/day** — the 64-shard scatter of unit 2, 1.7 M probes/s average, with the tail amplification already diagnosed. Caching (unit 3) absorbs much, but every load still pays a many-way merge.\n\n**FoW total**: 10 M posts × 200 followers = **2 B list inserts/day ≈ 23 k/s average, 70 k/s peak** — tiny writes (a photo id + timestamp into a capped list), well within a modest memory-store fleet, delivered by an idempotent consumer (last lesson's exercise, verbatim). Feed read: one list fetch + hydration of ~20 photo metadata rows (cache-served, unit 3). The work ratio matches the proposition: 150 B vs 2 B ≈ 75× in FoW's favor — the r/π ≈ 50 read-dominance doing exactly what the inequality predicts.\n\n**The celebrity term**: one post by an author with 80 M followers = 80 M inserts — 40× the entire system's average *daily-rate-per-second*, as one job; at 100 k inserts/s of consumer capacity, that single post occupies the fleet for 13 minutes (the burst theorem: every other author's freshness grant is violated behind it). Set F* = 100 k: the ~0.01% of authors above it (who are followed by nearly everyone) switch to pull; per-post FoW work is capped at 100 k inserts (~1 s of fleet time); each reader's render merges their list with recent posts from the ~2–10 celebrities they follow — cache-perfect reads (every fan pulls the same few lists; unit 3's hottest-key machinery, coalescing included). Twitter's production numbers (Krikorian, QCon 2012) had exactly this shape: FoW deliveries at ~hundreds of k/s against 300 k reads/s, with high-follower accounts special-cased."
            },
            {
              "type": "diagram",
              "kind": "graph",
              "directed": true,
              "height": 320,
              "caption": "The hybrid feed. Ordinary posts flow through the log to fan-out consumers that push into per-follower feed lists; celebrity posts skip fan-out and are pulled + merged at read time from their (cache-hot) author lists. Render-time filters enforce blocks/unfollows against both paths.",
              "nodes": [
                {
                  "id": "post",
                  "label": "Post (F ≤ F*)",
                  "x": 6,
                  "y": 28,
                  "tone": "gold"
                },
                {
                  "id": "cpost",
                  "label": "Celebrity post (F > F*)",
                  "x": 6,
                  "y": 72,
                  "tone": "rust"
                },
                {
                  "id": "log",
                  "label": "Event log",
                  "x": 28,
                  "y": 28,
                  "tone": "sage"
                },
                {
                  "id": "fan",
                  "label": "Fan-out consumers",
                  "x": 50,
                  "y": 28
                },
                {
                  "id": "lists",
                  "label": "Per-user feed lists",
                  "x": 74,
                  "y": 28,
                  "tone": "sage"
                },
                {
                  "id": "clist",
                  "label": "Celebrity author lists",
                  "x": 40,
                  "y": 72,
                  "tone": "sage"
                },
                {
                  "id": "render",
                  "label": "Feed render (merge + filter)",
                  "x": 74,
                  "y": 72,
                  "tone": "gold"
                }
              ],
              "edges": [
                {
                  "from": "post",
                  "to": "log",
                  "label": "publish"
                },
                {
                  "from": "log",
                  "to": "fan",
                  "label": "consume"
                },
                {
                  "from": "fan",
                  "to": "lists",
                  "label": "F inserts",
                  "bold": true
                },
                {
                  "from": "cpost",
                  "to": "clist",
                  "label": "1 insert"
                },
                {
                  "from": "lists",
                  "to": "render",
                  "label": "1 fetch"
                },
                {
                  "from": "clist",
                  "to": "render",
                  "label": "pull + merge (cached)",
                  "dashed": true
                },
                {
                  "from": "log",
                  "to": "clist",
                  "dashed": true
                }
              ]
            },
            {
              "type": "code",
              "heading": "The fan-out consumer, contract included",
              "lang": "text",
              "code": "on event \"photo_posted\" (photo_id, author, ts):        -- delivered at-least-once\n  if follower_count(author) > F_STAR:\n    append_to_author_list(author, photo_id, ts)         -- celebrity: 1 insert, pull path\n    ack; return\n\n  followers = follower_ids(author)                       -- resolve audience NOW\n  for chunk in chunks(followers, 1000):                  -- interleaved with other jobs\n    for f in chunk:\n      ZADD feed:{f} score=ts member=photo_id             -- sorted-set add: idempotent\n      ZREMRANGEBYRANK feed:{f} 0 -(CAP+1)                -- trim to newest CAP entries\n    checkpoint(photo_id, chunk_index)                    -- optimization, not correctness\n  ack                                                    -- ONLY after all chunks done\n\n-- failure walk:\n--  crash at chunk 60/80  -> no ack -> redelivery -> chunks 1..60 re-run as no-ops\n--                           (ZADD same member = update, not duplicate), 61..80 fill in\n--  duplicate delivery    -> every ZADD is a no-op; trim is idempotent\n--  two posts, same author-> set semantics make insert order irrelevant (score orders)"
            },
            {
              "type": "text",
              "heading": "The feed list as a store: caps, rebuilds, and revocations",
              "body": "The materialized feed is a derived read model, and unit 3's obligations apply with special force because there are 100 million of them. **Cap each list**: the feed's product surface is 'recent'; a sorted set trimmed to the newest ~800 entries per user bounds memory (100 M users × 800 × ~16 bytes ≈ 1.3 TB fleet-wide — a handful of memory-store nodes, sharded by user id with the ring of unit 2) and makes every insert O(log n) with n small. Users who scroll past the cap fall through to fan-out-on-read for the deep tail — a second, quieter hybrid: push for the hot recent window, pull for the archive. **Rebuild path**: a user's list is a deterministic function of (their follow set, those accounts' recent posts) — a cold or corrupted list regenerates by exactly the FoR gather, which doubles as the fallback when the list store has an outage: the system degrades to pull (slower, correct) rather than to blank feeds. Deliberate design: the fallback *is* the old architecture, kept runnable. **Revocations**: an unfollow or block cannot chase entries already pushed into a list (finding one pair among billions is the needle problem); per unit 2's rule, the render filters against current follow/block state — entries from unfollowed accounts are dropped at read time and age out of the capped window naturally. The list may be wrong; the product never lies. Each obligation is unit 3's ledger, at population scale — which is the general truth of fan-out: it is not a new idea, it is the precompute proposition applied to the one query too expensive to leave to read time."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Fan-out latency is a per-author fairness problem, not just a throughput problem.** A fleet that averages 70 k inserts/s but processes posts FIFO lets one 100 k-follower author (just under any threshold) delay every post behind theirs by seconds — the burst theorem per job. Bound per-post work (the threshold F*), process fan-out jobs with per-author chunking interleaved across authors (chunked round-robin, so a big job shares the fleet rather than owning it), and measure delivery lag per post at the p99, not the mean — the 10-second grant is per photo, and the author whose photo took 4 minutes doesn't care that the average was 1.8 s."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A network has 40 M DAU: π = 3 M posts/day, r = 250 M feed loads/day, E[F] = E[G] = 150. Compute both aggregate work totals, the FoW:FoR ratio, and verify it against the proposition's r/π reduction. Then state which single distributional fact could still make FoW the wrong *unqualified* choice.",
                  "solution": "W_FoW = 3 M × 150 = **450 M list inserts/day** (~4.5 k/s average). W_FoR = 250 M × 150 = **37.5 B probes/day** (~375 k/s). Ratio ≈ 83× in FoW's favor; the reduction predicts r/π = 250/3 ≈ 83 — exact match (E[F] = E[G] cancels, as the edge-counting identity says it must when the means are equal). The distributional fact: **max F** (the celebrity tail). E[F] = 150 is consistent with a few authors at F = 20 M; each of their posts is a 20 M-insert job — hours of a 4.5 k/s-sized fleet, or a fleet sized 1000× for spikes — so FoW must be qualified with a threshold F* and read-time merge for the tail. Averages chose the architecture; the tail writes the exception clause. Both steps are the design.",
                  "hint": "Totals are straight multiplication; the ratio should equal r/π when E[F]=E[G]. Then ask what E[F] hides."
                },
                {
                  "prompt": "Set the hybrid threshold F* from constraints rather than folklore: the fan-out fleet sustains 200 k inserts/s; the per-photo delivery grant is p99 ≤ 10 s; celebrity pulls cost each reader one extra cached probe per followed celebrity, and readers follow at most ~20 accounts above any plausible threshold. Derive F* and sanity-check both sides of the trade.",
                  "solution": "Push side: a single post's fan-out must fit the grant even if it briefly owns the fleet: F* ≤ 200 k/s × 10 s = 2 M — but that lets one post consume the entire fleet for 10 s, starving concurrent posts (fairness callout); budget a post at most ~10% of fleet share under interleaving: **F* ≈ 200 k inserts/s × 10 s × 0.1 = 200 k followers** (order of magnitude; 100 k–500 k all defensible with stated share). Pull side at F* = 200 k: authors above it number a tiny fraction (power law: perhaps a few thousand accounts) but are followed by a large share of readers; each reader's render adds ≤ ~20 cached probes — against unit 3's cache arithmetic (these are the hottest keys in the system, h ≈ 1 with coalescing), the read-path cost is microseconds-scale per probe: absorbable. Sanity both directions: raising F* to 5 M pushes 5 M-insert jobs (25 s of fleet at full share — grant violated); lowering it to 1 k moves ~all traffic to pull (recreating the scatter FoW exists to kill). The derivation's shape — fleet rate × grant × fairness share on one side, reader probe budget × cache temperature on the other — is the transferable artifact; the number falls out of whichever constraints the system actually has.",
                  "hint": "Push bound: inserts/s × grant × per-post fleet share. Pull bound: probes added per render × their cache-served cost."
                },
                {
                  "prompt": "During a feed-list store outage (30% of shards down for 20 min), describe what the hybrid design of this lesson serves to affected users, the load consequence on the source shards, and why unit 3's borrowed-capacity warning applies. Then compute: affected feed loads = 4,500/s, G = 300 probes each, source fleet read capacity = 900 k probes/s with 300 k/s of headroom — does the fallback survive?",
                  "solution": "Affected users fall back to fan-out-on-read: the render runs the gather (their follow list → recent posts per followee, merged) — the rebuild path doubling as degraded service: feeds are slower and miss nothing. Load: 4,500 loads/s × 300 probes = **1.35 M probes/s** of *additional* source load against 300 k/s headroom — **4.5× over**: the naive fallback does NOT survive; it browns out the source shards for everyone (including unaffected users), converting a partial cache-tier outage into a full-system incident — precisely unit 3's borrowed-capacity cliff, now on the write path's read model. The design must therefore bound the fallback: serve degraded feeds from unit 3's caches (per-followee recent lists — the probes are cache-shaped), admit the gather at a limited rate (load-shed deep gathers, serve a shorter feed from whatever the cache yields), and prioritize list-store recovery + rebuild. The sentence for the design doc: 'the FoR fallback is correct but 4.5× over source headroom at full traffic — it ships rate-limited, cache-first, and partial.' A fallback that hasn't had this arithmetic run is a second outage with better branding.",
                  "hint": "Fallback load = affected loads × G. Compare against headroom, not capacity — and ask who else shares those shards."
                },
                {
                  "prompt": "Lens adds 'close friends' — posts visible only to a chosen subset, appearing in their feeds like normal posts. Walk the feature through the hybrid: what changes in fan-out targeting, what the render filter must now check on BOTH paths, and the leak scenario the design must prove impossible (state where the proof lives).",
                  "solution": "Fan-out targeting: the consumer resolves the audience at delivery time — for a close-friends post, insert only into followers ∩ close-friends lists (the fan-out job's target set comes from the audience rule, not raw followers). Smaller F, same machinery, same idempotent set-inserts. Render filter, both paths: authorization re-check at read time against *current* audience state — for list entries (the pushed copy may predate an audience change: removed-from-close-friends is a revocation, and unit 2's rule applies — the precomputed copy is allowed to be wrong; the render is not) and for celebrity pulls (the pulled author list must be filtered by per-viewer audience just like list entries; note a celebrity close-friends post also shows why pull-side filtering can't be skipped for 'public' authors). The leak to prove impossible: viewer v sees a close-friends post of author a with v ∉ current close-friends(a) — via any path: stale list entry (v was removed after fan-out; caught by render re-check), pull-path miss (caught by the same shared filter — one filter implementation, both paths, deliberately), or *side channels*: the hydration cache serving the photo metadata/rendition to a viewer the filter would reject (the filter must gate hydration, not just listing — unit 3's signed-URL/authorization layering), and counts/notifications derived from the post (audience applies to every derived artifact). The proof lives in one place by design: a single render-time authorization function through which every read path — list, pull, hydration, notification — must flow; the design review's job is enumerating the paths and showing each one calls it. Privacy features are read-time-enforcement features; fan-out only ever optimizes the happy path.",
                  "hint": "Audience resolution at write time is an optimization; where must enforcement live, and how many read paths are there to gate?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u4l3-i1",
              "front": "Fan-out on write vs on read — the work equation?",
              "back": "W_FoW = π·E[F]·c_w (inserts per post × post rate); W_FoR = r·E[G]·c_r (probes per load × read rate). With E[F]≈E[G] (edge-count identity), the ratio ≈ r/π: read-dominance is the factor favoring push."
            },
            {
              "id": "u4l3-i2",
              "front": "Why does the celebrity break pure fan-out-on-write?",
              "back": "E[F] hides max F: one 80 M-follower post = 80 M inserts as a single burst job — minutes of fleet time, starving every post behind it (burst theorem per job). Averages size the fleet; the tail writes the exception clause."
            },
            {
              "id": "u4l3-i3",
              "front": "The hybrid feed — its rule and read-time shape?",
              "back": "Authors with F ≤ F* push into follower lists; F > F* (celebrities) are pulled at render and merged with the reader's list. F* derived from fleet rate × delivery grant × per-post fairness share vs per-reader probe budget × cache temperature."
            },
            {
              "id": "u4l3-i4",
              "front": "The feed list's three derived-model obligations at population scale?",
              "back": "Cap (sorted set, newest ~800 — bounds memory, deep scroll falls back to pull); rebuild (regenerate via the FoR gather — which doubles as the outage fallback, kept runnable and RATE-BOUNDED per the borrowed-capacity arithmetic); revocation (render filters against current follow/block/audience state — the pushed copy may be wrong, the product never lies)."
            },
            {
              "id": "u4l3-i5",
              "front": "Why is fan-out delivery lag measured per post at p99?",
              "back": "The grant ('followers see it in ~10 s') is per photo: FIFO fleets let one huge job delay all posts behind it while averages look fine. Bound per-post work (F*), interleave chunks across authors, alert on per-post p99 delivery lag."
            },
            {
              "id": "u4l3-i6",
              "front": "Where does audience/privacy enforcement live in a fan-out feed?",
              "back": "One shared render-time authorization function gating EVERY read path — list entries, celebrity pulls, hydration, notifications/counts. Write-time audience targeting is an optimization only; revocations make every precomputed copy potentially wrong."
            }
          ]
        },
        {
          "id": "u4l4",
          "title": "The Log: Partitioned Streams",
          "estMinutes": 24,
          "builds_on": [
            "u4l2",
            "u3l4"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Two shapes of asynchrony",
              "body": "This unit has used two different words for its buffers, and the difference is now load-bearing. The transcode pipeline wanted a **queue**: a pool of independent jobs, each consumed by exactly one worker and then *gone* — the queue's job is distribution, its state is 'what remains'. The change stream feeding search, hashtags, trending, and fan-out wants something else: **every consumer sees every event, in order, at its own pace, with the ability to rewind** — deletion on consumption would rob every consumer but the first. That shape is the **log**: an append-only, durable, ordered sequence that consumers *read* rather than *take*, each tracking its own position.\n\nThe log is the mechanization of everything unit 3's read-model lesson demanded: durability of the change record (append survives crashes), single ordering (the sequence is the order), independent consumption (positions, not deletion), measurable staleness (your position vs the head — the grant as a number), and replay (rewind to rebuild). One structure, all five obligations. What remains is the engineering question this lesson answers: a single ordered file cannot carry 100 M events a day from one machine — so the log must partition, and partitioning an *ordered* structure forces a precise decision about which order survives."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The partitioned log (Kafka's shape)",
              "statement": "A **topic** is a named stream, physically split into P **partitions**; each partition is an append-only ordered sequence on its own broker(s), replicated for durability. A producer assigns each event to a partition — by hash of the event's **key** (the default), preserving co-key ordering, or round-robin when no key matters. Each event receives an **offset**: its position in its partition. Consumers organize into **consumer groups**: within a group, each partition is assigned to exactly one member, which processes it serially and commits its offset as its checkpoint; different groups are independent (each sees everything). Retention is time- or size-based (or compacted per key) — consumption does not delete. Ordering is guaranteed **within a partition only**; the topic as a whole has no global order."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "What ordering the partitioned log actually guarantees",
              "statement": "(i) Two events with the same key, published by the same producer, are consumed in publish order by every consumer group. (ii) Events with different keys may be observed in different relative orders by different consumers. (iii) A consumer group's parallelism is bounded by P: more members than partitions leaves members idle. (iv) A global total order requires P = 1, serializing the topic's throughput to one partition's.",
              "proof": "(i) Same key ⇒ same hash ⇒ same partition; within a partition, appends receive increasing offsets in arrival order, and the producer sends its events for that key in sequence (one in-flight batch per partition, or idempotent-producer sequencing); a partition is consumed serially by its single assigned member in offset order. Chain: publish order = append order = offset order = consumption order. (ii) Different keys may land in different partitions, consumed by different members at independent paces — no cross-partition coordination exists, so no cross-partition order is defined. (iii) Partition assignment within a group is a function (each partition → exactly one member) to preserve serial consumption; with members > P, the function cannot cover them — surplus members receive nothing. (iv) A total order must order every pair of events; pairs split across partitions are unordered by (ii), so all events must share the one partition, whose single-broker append path bounds throughput. ∎\n\nThe design consequences are the exercise the last lesson already met: choose the key so that *the pairs that must be ordered share it* — per-photo edits key by photo id (caption v41 before v42, guaranteed by (i)); per-user actions key by user id when a user's own sequence matters. Parallelism planning is (iii): partitions are the unit of scaling, chosen generously up front (repartitioning a keyed topic reshuffles key→partition mappings — a migration, per unit 2). And (iv) is the reason 'just give me a global order' is a throughput death sentence — designs that think they need one usually need per-key order plus idempotence, which the log gives at full parallelism."
            },
            {
              "type": "example",
              "heading": "Worked example: Lens's event backbone, assembled",
              "body": "One diagram's worth of prose, tying the course's accumulated consumers to their stream. **Topic `photo-events`** (posted, edited, deleted, audience-changed), key = **photo id**: every consumer sees each photo's history in order — the versioned upserts and tombstones of the last lesson compose with (i) to make each consumer's view converge. P = 64 partitions (sized for horizon-scale peak ≈ 12 k events/s and consumer parallelism, with headroom). **Topic `engagement-events`** (likes, views), key = photo id (counter lanes per photo — the per-key serialization the inventory exercise demanded), far higher volume, shorter retention. **Topic `graph-events`** (follows, blocks, audience changes), key = actor id.\n\nConsumer groups, each independent, each with the last lesson's contract stamped on it: `search-indexer` (versioned upserts; checkpoint lag = the 'searchable within a minute' grant, monitored); `hashtag-lister` (idempotent inserts into the tag listing); `feed-fanout` (set-semantic inserts, the F* hybrid); `trending` (bucketed counters); `notifications` (unit 6's customer, already receiving what it will need). Adding next quarter's consumer — say a places/geo model — is registering a group and replaying: **bootstrap from a snapshot + tail from the snapshot's offset** (replaying 90 days of events beats re-scanning the source when the model wants event granularity; replaying from offset 0 works when retention covers it — otherwise snapshot + tail is the pattern). No producer changed; no other consumer noticed. That property — consumers multiply without coordinating — is what the log bought over the dual-write world unit 3 buried, and it is why the log sits at the architectural center of the write path rather than being one queue among many."
            },
            {
              "type": "decision",
              "heading": "Queue or log? (choosing the buffer's shape)",
              "rows": [
                [
                  "Independent jobs, each done once, then gone (transcodes, emails)",
                  "Queue — competing consumers, ack-and-delete, per-job retry + DLQ"
                ],
                [
                  "Change events consumed by multiple independent models",
                  "Log — consumer groups, offsets, retention, replay"
                ],
                [
                  "New consumers must be able to (re)build from history",
                  "Log — replay from offset 0 or snapshot + tail"
                ],
                [
                  "Per-entity ordering required (edits, state machines, counters)",
                  "Log keyed by the entity id (per-key order is the guarantee)"
                ],
                [
                  "Work items with wildly varying cost needing fair scheduling",
                  "Queue — logs head-of-line-block a partition behind a slow event"
                ],
                [
                  "Both shapes needed (jobs discovered from changes)",
                  "Log as source of truth → a consumer enqueues jobs into a queue"
                ]
              ]
            },
            {
              "type": "code",
              "heading": "The consumer loop with offset-as-dedup",
              "lang": "text",
              "code": "-- assigned partitions: {p}; positions restored from the checkpoint store\nloop:\n  batch = poll(p, from = checkpoint[p] + 1)              -- read, never delete\n  for event in batch:                                    -- offset order = per-key order\n    BEGIN TX (model database):\n      apply(event)                                       -- versioned upsert / tombstone\n      checkpoint[p] = event.offset                       -- offset stored WITH the effect\n    COMMIT\n  -- no separate ack protocol: the committed offset IS the dedup record.\n\n-- failure walk:\n--  crash mid-batch      -> restart reads checkpoint[p], resumes at first unapplied\n--                          offset; re-polled events at-or-before it never re-apply\n--  broker redelivers    -> impossible to double-apply: offset <= checkpoint[p] is skipped\n--  rebalance moves p    -> new owner reads the same committed checkpoint — hand-off safe\n\n-- the one rule that makes this exactly-once-effects: the checkpoint commits in the\n-- SAME transaction as the apply. Checkpointing to the broker instead (async commit)\n-- reopens the crash window between effect and ack — the impossibility theorem's H2."
            },
            {
              "type": "text",
              "heading": "The costs the log charges",
              "body": "Symmetry demands the bill. **Head-of-line blocking**: a partition is a serial lane — one poison event (or one 80 M-follower fan-out job processed inline) stalls every event behind it in that partition; the mitigations are the queue's DLQ discipline (skip-and-park after N failures, per-partition) and keeping heavyweight work *out* of consumers (the consumer enqueues a job — the table's last row — so the lane stays fast). **Repartitioning pain**: key→partition is hash mod P; changing P remaps keys (unit 2's modulo lesson, verbatim), breaking the per-key-order guarantee across the boundary and demanding a migration — so P is chosen with growth headroom, over-provisioned the way shard counts are. **The event schema is a public contract**: every consumer parses what producers publish; renaming a field breaks five teams' pipelines at 2 a.m. — schema evolution (additive fields, versioned event types, a registry that rejects breaking changes) is API versioning (unit 1) applied to the backbone, and it is governance, not tooling. **Retention is a cost dial**: replayability reaches only as far as retention; the snapshot + tail pattern exists precisely because infinite retention isn't free (log compaction — keep the last event per key — is the middle setting: full current-state rebuilds, no full history). None of these outweigh the five obligations the log discharges; all of them appear in the design doc of a backbone that will actually run."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**The unit's arc, compressed**: a staleness grant authorizes asynchrony → the queue absorbs and prices it (burst arithmetic, backpressure) → the impossibility theorem forbids exactly-once delivery, so consumers manufacture exactly-once *effects* (idempotence + atomic dedup) → the work equation decides where fan-out computes (push below F*, pull above) → and the partitioned log carries one ordered, replayable truth to every consumer at its own pace. Requirements → arithmetic → guarantee → architecture: the method, running on the write path."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "An orders topic is keyed by order_id with P = 32; consumers process 'created → paid → shipped' state machines. A teammate proposes P = 256 for throughput and, separately, keying by warehouse_id 'so each warehouse's orders stay together.' Evaluate both against the ordering proposition, and state what each change would actually do to per-order correctness.",
                  "solution": "P = 256: raising partitions raises the group-parallelism ceiling (proposition iii) — legitimate — but the migration remaps key→partition (hash mod P changes): during/after the switch, an order's events can straddle two partitions, breaking per-key order exactly once per key (a 'paid' in the new partition racing a 'created' still unconsumed in the old). Doable with a drain-and-cutover (stop producers, drain consumers, switch) or dual-topic migration — but it is a migration, not a config change; this is why P gets headroom up front. Keying by warehouse_id: per-ORDER ordering is what the state machine needs, and orders within a warehouse would still share a lane (fine) — but the guarantee is now accidental: any future partition change, or an order whose events carry different warehouse attributions (a transfer!), silently loses per-order order. Worse, warehouses are few and skewed — whale warehouses concentrate traffic into hot partitions (unit 2's skew, in stream form). Verdict: key by the entity whose *sequence* is the invariant (order_id); parallelism comes from partition count, not key coarsening; and per-warehouse *views* are a consumer's job, not the producer's keying decision.",
                  "hint": "Which pairs of events MUST be ordered? The key must be constant across exactly those pairs. Then ask what hash-mod-P does when P changes."
                },
                {
                  "prompt": "A consumer group of 8 members reads a 12-partition topic that begins receiving 3× traffic. Members are at 95% CPU; someone adds 8 more members 'to double throughput.' Predict the result using the proposition, and give the two real options with their costs.",
                  "solution": "Assignment maps each of 12 partitions to exactly one member: 16 members over 12 partitions leaves **4 idle** — throughput rises at most 12/8 = 1.5×, not 2×, and the fleet still trails the 3× load: the queue-stability condition (ρ < 1, first lesson) fails and lag grows without bound. Real options: (1) **raise P** (12 → 36): triples the parallelism ceiling; cost = the repartitioning migration of the previous exercise (key remap, order-boundary handling) — this is the durable fix, and the argument for over-provisioning P at design time; (2) **make each member faster** — batch applies, pipeline the effect writes, move heavyweight work out of the consumer into a queue (the decision table's last row): often recovers multiples without touching P, because consumer cost, not partition count, is frequently the true ceiling. (A third lever — shed/sample per the backpressure menu — applies only if the events' loss is priced.) The diagnostic habit: before scaling members, compare members to P and per-event cost to arrival rate; the proposition says which wall you're actually against.",
                  "hint": "Parallelism ≤ P. Then: is the bottleneck partition count, or per-event processing cost?"
                },
                {
                  "prompt": "Design the replay procedure for standing up a new 'user activity timeline' model from the Lens backbone, where `engagement-events` retention is 14 days but the model needs 2 years of history. Specify the bootstrap, the cutover from bootstrap to tail without gaps or duplicates, and the property of the model's writes that makes imperfect overlap safe.",
                  "solution": "Bootstrap: the model's 2-year history cannot come from the log (retention 14 d) — it comes from the sources of truth (photos, likes tables) via a batch backfill: a deterministic scan producing the same shape of applies the stream would have (this is unit 3's rebuild-path obligation, exercised at birth). Record the log's current head offsets (per partition) BEFORE starting the backfill: call them O. Backfill from source snapshots taken at-or-after O's timestamp. Cutover: start the streaming consumer at offsets O (not the current head — events since O happened during the backfill and may or may not be reflected in the snapshot). The overlap window (events in [O, now] that the snapshot partially includes) means some events apply twice and some 'apply' to state the backfill already wrote. Safety property: the model's writes are **idempotent, versioned upserts** (last lesson's embodiment 1) — re-applying an event already reflected is a no-op; applying a genuinely-missed one fills the gap; order within the overlap is repaired by version comparison. So the procedure needs only 'start tail ≤ backfill's snapshot point', never exact coordination — idempotence converts an impossible exactly-once cutover into a sloppy-overlap-and-let-versions-sort-it cutover. Verify by reconciliation (sample-compare model vs source — unit 2's template) before serving. This snapshot + tail + idempotent-overlap recipe is THE standard birth procedure for every derived model; write it once, reuse forever.",
                  "hint": "Capture offsets before the backfill; tail from those offsets after it; ask what property makes the deliberate overlap harmless."
                },
                {
                  "prompt": "The `feed-fanout` consumer (previous lesson) processes fan-out inline and is head-of-line blocking its partitions whenever a near-threshold author (F ≈ 90 k) posts. Using the decision table and the fairness callout, restructure the pipeline and state the new failure/ordering analysis.",
                  "solution": "Restructure per the table's last row — log as discovery, queue as execution: the log consumer becomes a thin dispatcher (read 'photo posted', resolve audience size, enqueue a fan-out JOB carrying (photo id, author, chunk plan) into a work queue, commit offset) — microseconds per event, so the partition lane never blocks. A worker pool consumes the queue with per-author chunking interleaved (the fairness fix: a 90 k-insert job becomes 90 chunks of 1 k, scheduled round-robin with other jobs' chunks). Ordering analysis: the log guaranteed per-photo event order; by moving execution to a queue, fan-out jobs for two posts by the same author may now run concurrently/out of order — is that safe? The inserts are (photo, timestamp) set-adds into follower lists: order-independent by construction (the sorted set orders by timestamp regardless of insert order) — so the ordering guarantee the queue forfeits is one this effect never needed; state that explicitly rather than discovering it. Deletes/audience-changes still need per-photo ordering versus inserts: handle by versioning at the render filter (already required by revocation) and by having the dispatcher serialize jobs per photo id (don't enqueue photo P's fan-out while P's earlier job is in flight — a tiny per-key in-flight set). Failure analysis: queue jobs are at-least-once + idempotent (set-adds) with chunk-level checkpoints as an optimization; DLQ for poison jobs (deleted author mid-fan-out) with an alert. Net: log lanes stay fast for every consumer, heavyweight work gets fair scheduling and queue-grade retry — each shape doing exactly what the table says it is for.",
                  "hint": "Thin log consumer → job queue → chunked workers. Then audit: which ordering did the move give up, and does the effect's algebra (set-adds) care?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u4l4-i1",
              "front": "Queue vs log — the shape difference?",
              "back": "Queue: independent jobs, each taken once by one worker, then gone (distribution; retry + DLQ per job). Log: append-only ordered stream, every consumer group reads everything at its own offset pace; retention not deletion; replayable. Compose them: log discovers → queue executes."
            },
            {
              "id": "u4l4-i2",
              "front": "What ordering does a partitioned log guarantee?",
              "back": "Per-partition only — hence per-KEY (same key → same partition → offset order = publish order). Different keys/partitions: no defined order. Global order requires P=1 (throughput death). Key by the entity whose event sequence is the invariant."
            },
            {
              "id": "u4l4-i3",
              "front": "Consumer groups — the parallelism rule?",
              "back": "Within a group each partition is assigned to exactly one member (serial per-partition consumption): parallelism ≤ P; extra members idle. P is chosen with headroom because changing it remaps keys (hash mod P — a migration that breaks per-key order at the boundary)."
            },
            {
              "id": "u4l4-i4",
              "front": "The five obligations the log discharges for derived models?",
              "back": "Durable change record (append survives crashes), single order (the sequence), independent consumption (offsets, not deletion), measurable staleness (checkpoint lag vs head = the grant as a number), replay (rebuild: offset 0, or snapshot + tail with idempotent overlap)."
            },
            {
              "id": "u4l4-i5",
              "front": "Snapshot + tail — the birth procedure for a new consumer?",
              "back": "Record head offsets O → batch-backfill from source snapshots (≥ O's time) → start tailing from O → let idempotent versioned upserts absorb the deliberate overlap → reconcile before serving. Idempotence converts impossible exact cutover into sloppy-overlap-safely."
            },
            {
              "id": "u4l4-i6",
              "front": "The log's three standing costs?",
              "back": "Head-of-line blocking per partition (poison events, heavyweight inline work — DLQ discipline + dispatch jobs to queues); repartitioning pain (over-provision P); the event schema as a public contract (additive-only evolution, registry governance — API versioning for the backbone)."
            }
          ]
        }
      ],
      "masteryCheck": {
        "id": "u4-check",
        "questions": [
          {
            "id": "u4q1",
            "type": "numeric",
            "prompt": "A worker fleet has capacity 600 jobs/s. Arrivals spike to 900 jobs/s for 10 minutes, then drop to 300 jobs/s. How many minutes after the spike ends does the backlog reach zero?",
            "answer": 10,
            "tolerance": 1,
            "points": 1,
            "explanation": "Backlog at spike's end: B = (900 − 600) × 600 s = 180,000 jobs. Drain rate afterward: 600 − 300 = 300 jobs/s → D = 180,000/300 = 600 s = 10 minutes. The excursion's total footprint (20 minutes of degraded freshness from a 10-minute burst) is what any downstream grant must cover — and it doubles again if post-burst headroom halves."
          },
          {
            "id": "u4q2",
            "type": "numeric",
            "prompt": "A feed uses fan-out on write: 5 M posts/day, authors average 150 followers. Using the 10⁵-seconds-per-day approximation, what average insert rate (inserts/s) must the fan-out consumer fleet sustain?",
            "answer": 7500,
            "tolerance": 400,
            "points": 1,
            "explanation": "Total inserts/day = 5 M × 150 = 750 M; per second = 750M/10⁵ = 7,500 inserts/s average (× peak factor for provisioning). This is the work equation's W_FoW = π·E[F] made concrete — and the number to compare against W_FoR = r·E[G] probes/s when defending the push choice."
          },
          {
            "id": "u4q3",
            "type": "short",
            "prompt": "Exactly-once delivery being impossible, real systems achieve exactly-once *effects* by combining at-least-once delivery with what property of the consumer's processing? (One word.)",
            "accept": [
              "idempotence",
              "idempotency",
              "idempotent processing",
              "idempotent"
            ],
            "points": 1,
            "explanation": "The corollary: at-least-once delivery (no loss) + idempotent processing with the dedup record atomic to the effect (duplicates collapse to no-ops) = each effect applied exactly once. The impossibility lives at the delivery layer; the solution lives at the effect layer — unit 1's retry proposition, wearing consumer clothes."
          },
          {
            "id": "u4q4",
            "type": "mcq",
            "prompt": "A topic has 16 partitions keyed by user_id; a consumer group has 16 members. The team doubles the group to 32 members AND begins publishing some of each user's events with key = session_id 'for better spread.' What breaks?",
            "options": [
              "16 members sit idle, and per-user event ordering is lost for users whose events now split across keys",
              "Throughput doubles as intended; ordering is unaffected since sessions belong to users",
              "The broker rebalances to 2 members per partition, halving latency",
              "Nothing breaks, but retention must double to hold the extra members' checkpoints"
            ],
            "answer": 0,
            "points": 1,
            "explanation": "Parallelism is capped at P = 16 (each partition goes to exactly one member) — the extra 16 members receive nothing. And mixing key = session_id splits one user's events across partitions, destroying the per-key (per-user) ordering guarantee: a profile-update and a follow by the same user can now be consumed in either order. Option b is the intuition the proposition refutes (co-ownership doesn't put them in one partition); option c describes a scheme partitioned logs deliberately avoid (two consumers on one partition would break serial order); option d confuses checkpoints (tiny) with retention."
          },
          {
            "id": "u4q5",
            "type": "proof",
            "prompt": "(a) Prove that no protocol can guarantee exactly-once delivery of a message to a consumer that may crash, over a network that may drop packets — using the broker's-observation indistinguishability argument. (b) State precisely what additional consumer-side construction recovers exactly-once EFFECTS, and prove it works. (c) Identify the assumption in (b) that fails when the effect is a call to an external system with no idempotency support, and state the consequence.",
            "rubric": [
              "Proof of (a) constructs the two indistinguishable histories — crash before processing vs crash after processing but before the ack (or ack lost) — notes the broker's observations are identical, and derives the forced bad outcome in each branch (redeliver → duplicate in H2; don't → loss in H1), covering the ack-before-processing variant or noting no ack placement escapes",
              "States the effectively-once construction completely: at-least-once redelivery + the consumer records the message id/offset ATOMICALLY (same transaction) with the effect, skipping recorded ids",
              "Proves both legs: existence (redelivery until ack + ack only after commit ⇒ at least one successful application) and uniqueness (two commits of one id cannot both find it unrecorded, by atomicity/uniqueness constraint — mirroring the unit-1 retry proposition)",
              "For (c): identifies the atomicity premise — effect and dedup record must share a transactional domain — as unsatisfiable for external side effects (the gateway call and the local record cannot commit together); consequence: a crash window in which the effect fired but no record exists ⇒ redelivery duplicates it; mitigations (pass the idempotency key THROUGH to the external system, or accept/narrow the window) named as the only options"
            ],
            "solution": "(a) Suppose a protocol exists. Consider broker B having sent m, awaiting acknowledgment, and observing silence. History H1: the consumer crashed before executing its processing of m. History H2: the consumer processed m, then crashed before its acknowledgment was sent (or the network dropped it). B's observations — m sent, no ack — are identical in H1 and H2, so B's protocol must prescribe the same action in both. If it prescribes redelivery, then in H2 the consumer (restarted) processes m a second time: delivery exceeded once. If it prescribes no redelivery, then in H1, m is never processed: delivery fell short. Moving the acknowledgment before processing only exchanges the roles (crash after ack, before processing ⇒ loss with no redelivery — at-most-once); since the crash can fall between any two protocol steps, no ordering of processing and acknowledgment avoids both branches. Hence exactly-once delivery is unachievable. ∎ (b) Construction: broker redelivers until acked (at-least-once); the consumer, in ONE transaction, (i) checks a dedup relation for m's id, (ii) if absent, applies the effect and inserts the id, (iii) commits; it acknowledges only after commit. Existence: an unacked m redelivers; each delivery attempts the transaction; the first successful commit both applies the effect and records the id, after which the consumer acks — so at least one application occurs. Uniqueness: suppose two deliveries both applied the effect; both transactions inserted id(m); with the insert in the same transaction as the effect and a uniqueness constraint on the id, the second commit must abort (it cannot find the id absent at commit time), contradiction. Hence exactly one application. ∎ (c) The proof of uniqueness consumed 'effect and record commit atomically.' An external call (send an email, charge via a gateway) executes outside the consumer's transactional domain: the sequence [call succeeds] → [crash] → [record never written] is possible, and redelivery repeats the call — duplicate effect, provably unavoidable from the consumer's side alone. The only genuine repairs move the dedup across the boundary: pass an idempotency key with the call so the EXTERNAL system deduplicates (unit 1's API proposition, offered as a service), or use a provider-side transactional primitive; otherwise the design must narrow the window (record 'attempting' first, query provider status on redelivery) and explicitly accept the residual duplicate risk with its business cost.",
            "points": 3,
            "explanation": "The three parts are the unit's spine in miniature: the impossibility (why every broker documents at-least-once), the corollary (the pattern stamped on every consumer in the course), and the boundary case (why idempotency keys appear in well-designed external APIs — the residue that no local transaction can absorb)."
          },
          {
            "id": "u4q6",
            "type": "open",
            "prompt": "Design the asynchronous backbone for an online marketplace: order placement must be acknowledged fast and never lost; placing an order triggers — payment capture (external PSP with idempotency-key support), seller notification (email/push), search-index update for inventory decrement display, and analytics. Twice a year, flash sales multiply order volume 20× for ~30 minutes. Deliver: (a) the topology (what is a log, what is a queue, keys, and why); (b) the delivery guarantee + idempotence embodiment at EACH consumer; (c) the flash-sale survival plan with burst arithmetic on at least one component; (d) the one place a duplicate can still reach the outside world and how you bound it.",
            "rubric": [
              "Topology separates shapes correctly: an order-events log (outbox/CDC from the order commit — the durable ordered source of truth, keyed by order_id for per-order state-machine ordering) feeding independent consumer groups; heavyweight/externally-bound work (payment capture, email/push) dispatched into queues with retry + DLQ; search/analytics as log consumers with checkpoints — with at least one sentence of WHY per shape (multi-consumer replay vs take-once jobs)",
              "Order intake: synchronous path = validate + commit order + outbox row in ONE transaction, ack the user; everything else asynchronous — order acceptance never waits on PSP, email, or indexers; the outbox/CDC step named as what makes the log entry crash-safe",
              "Each consumer stamped with its contract: payment worker — at-least-once + idempotency key passed THROUGH to the PSP (dedup across the boundary), never at-most-once; notifications — at-least-once + dedup record, duplicate-tolerance direction argued (or provider key if available); search/inventory-display — versioned upserts (natural idempotence); analytics — at-least-once with sampling/shed legal under a stated approximation grant",
              "Flash-sale plan with real arithmetic: e.g. fleet sized μ vs λ_burst = 20λ for T = 1,800 s → backlog B = (20λ − μ)·T and drain D = B/(μ − λ), with a stated choice per pipeline (autoscale payment workers to keep capture delay inside a stated grant; let analytics/search lag with measured checkpoints; NEVER shed order intake — reject-with-retry-after only above hard limits) and queue bounds + backpressure policies named per queue",
              "Identifies the irreducible external-duplicate window honestly: the PSP call is safe (their idempotency key), so the residual is typically email/push double-send (or any provider without keys) — bounded by record-before-call + status-check-on-redelivery + accepting rare duplicates, with the failure DIRECTION argued (duplicate email acceptable; duplicate charge never)"
            ],
            "solution": "(a) Topology. `order-events` is a LOG (partitioned, key = order_id): the order state machine (placed → paid → notified → …) needs per-order ordering, multiple independent consumers, replay for new models, and measurable lag — the log's five obligations. It is fed by an outbox table written in the order-placement transaction (tailed by CDC): the order commit and its event are atomic, so acceptance is never lost and never dual-written. Payment capture and notifications are QUEUE consumers fed by thin dispatchers reading the log (log discovers, queue executes): external calls are slow, retryable, per-job work — queue-shaped (retry policy, DLQ, fair scheduling), and inline execution would head-of-line-block the log's partitions. Search/inventory-display and analytics are direct log consumer groups with checkpoints. (b) Contracts. Order intake: synchronous transaction = validate, commit order + outbox row, return 201 with the client's idempotency key honored (unit 1 — double-submit safe). Payment worker: at-least-once from its queue; passes idempotency key = order_id to the PSP so the PSP deduplicates capture — the one effect where a duplicate is catastrophic, made safe by pushing dedup across the boundary; DLQ + alert on repeated failure (no silent drop of a capture — failure direction argued). Notifications: at-least-once + dedup record keyed by (order_id, notification type) in the notifier's store; residual double-send possible (see d) and acceptable. Search/display: versioned upserts keyed by listing id — naturally idempotent, order-safe via versions. Analytics: at-least-once; during overload, sample with a stated approximation grant. (c) Flash sale, arithmetic on payment capture: normal λ = 50 orders/s → burst λ = 1,000/s for T = 1,800 s. Fleet at μ = 400/s: backlog B = 600 × 1,800 = 1.08 M captures; drain at post-burst (μ − 50) = 350/s → ~51 min — if the stated capture grant is 'within 5 min', this fails: autoscale to μ ≈ 1,100/s during the window (pre-scheduled — flash sales are planned events; scale-up lag adds (λ−μ)·T_react of backlog, so scale BEFORE the sale), keeping worst delay B/μ under the grant. Search/analytics: allowed to lag (checkpoint age monitored against their grants — search minutes, analytics hours); their fleets stay fixed and drain after. Order intake protects itself: bounded queue with reject-with-retry-after above a hard admission rate (clients retry with their keys; nothing accepted is lost, and 'accepted' is the only promise made). All queue bounds + policies (block/reject/shed) written per pipeline. (d) The honest residual: the PSP path is duplicate-safe (their key); email/push providers without idempotency keys carry the irreducible window — call fired, crash before dedup record commits, redelivery re-sends. Bound it: write 'attempting' before the call, on redelivery of an 'attempting' item check provider-side status where queryable, cap retries, and accept the rare duplicate notification as priced (annoying, not harmful — the direction argument). A duplicate CHARGE, the unacceptable direction, cannot occur: that effect's dedup lives inside the PSP's transactional domain by construction.",
            "points": 3,
            "explanation": "The scenario forces every lesson at once: outbox atomicity at intake, log-vs-queue shape choices, four different idempotence embodiments, burst arithmetic under a 20× planned spike, and the impossibility theorem's residue located precisely (the keyless notification provider) with its failure direction priced. Grading follows the unit's standard: guarantees named per consumer and derived, not asserted — 'we use Kafka so it's exactly-once' is the answer this gate exists to fail."
          }
        ]
      }
    },
    {
      "id": "u5",
      "title": "Canonical Designs I: The Key-Value Core",
      "summary": "The method runs on whole systems: distributed unique IDs, the URL shortener end to end, a Dynamo-style replicated KV store with real conflict handling, and the rate limiter that guards every door.",
      "intro": "Units 1–4 built the toolkit: requirements and arithmetic, the data layer, the read path, the write path. From here the course changes mode — each lesson takes a canonical system and runs the whole method on it, start to finish, the way a design interview or a real design review would. This unit works the key-value core: the small, sharp systems that sit under everything else. First, unique ID generation — the primitive Lens has silently assumed since its first photo row, now designed properly: bit budgets, coordination-free generation, and why ID structure decides index performance. Second, the URL shortener — the classic prompt, worked end to end as a rehearsal of units 1–4 in miniature. Third, the deepest cut: a Dynamo-style replicated KV store, where the ring, quorums, and versioning from unit 2 stop being isolated results and become one coherent machine — including the part most treatments skip, what actually happens when concurrent writes conflict. Fourth, the rate limiter: the component the API contract of unit 1 promised (429, Retry-After) and every overload discussion since has needed. The gate asks you to run these designs at new coordinates: derive the bit budget, configure the quorums, bound the limiter — and defend each with the arithmetic.",
      "references": [
        "Twitter Engineering — Announcing Snowflake (2010); Instagram Engineering — Sharding & IDs at Instagram (2012)",
        "DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store (SOSP 2007)",
        "Alex Xu — System Design Interview vol. 1: unique ID generator, URL shortener, rate limiter chapters",
        "Martin Kleppmann — Designing Data-Intensive Applications, ch. 5 (leaderless replication, version vectors)",
        "Lamport — Time, Clocks, and the Ordering of Events in a Distributed System (CACM 1978) — the causality foundation",
        "Stripe / Cloudflare engineering — API rate limiting practice (token bucket at the edge)"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u5l1",
          "title": "Unique IDs at Scale",
          "estMinutes": 24,
          "builds_on": [
            "u1l4",
            "u2l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The primitive everything else assumed",
              "body": "Every design so far has written `photo_id`, `order_id`, `message_id` as if ids fell from the sky. On one machine they do — the database's auto-increment counter hands out 1, 2, 3 with perfect uniqueness and perfect ordering. The moment the write path spans machines (unit 2's partitioning, unit 4's fleets), that counter becomes what unit 1 taught you to spot instantly: a single point of coordination on the hottest path in the system. Every insert, on every shard, from every worker, queueing on one counter — the serial fraction Amdahl warned about, installed at the core.\n\nSo the ID generator is the first canonical design, and its requirements interrogation (unit 1's discipline, applied to a component) is short but exacting: **unique** across the fleet, forever — a collision is silent data corruption; **coordination-free** — any node mints ids at full speed without asking anyone; **roughly time-ordered** — because unit 1's cursor pagination sorts by (created_at, id), unit 2's clustering wants recent rows adjacent, and unit 2's B-tree lesson wants inserts appending to the right edge, not scattering; **compact** — 64 bits fits in a word, indexes stay small; and **high-rate** — tens of thousands per second per node at the horizon. Three families answer differently, and the differences are all arithmetic."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "The birthday bound (random IDs collide sooner than intuition says)",
              "statement": "If k ids are drawn independently and uniformly from a space of N possibilities, the probability that some pair collides satisfies\n\n  P(collision) ≤ k(k−1)/(2N) ≈ k²/(2N),\n\nand this bound is close to exact while it is small. Consequently collisions become likely around k ≈ √N — for a 64-bit random id, around 2³² ≈ 4 billion ids, not 2⁶⁴; and a system that has minted k ids carries a standing collision probability of roughly k²/2N.",
              "proof": "There are C(k, 2) = k(k−1)/2 pairs of ids. Each specific pair collides with probability exactly 1/N (whatever the first draws, the second matches it with probability 1/N). The probability that *some* pair collides is at most the sum of the pairwise probabilities (the union bound): P ≤ C(k,2)·(1/N) = k(k−1)/2N. For small P the union bound is nearly tight because the pair events are nearly disjoint — the standard exact form P = 1 − ∏ᵢ(1 − i/N) agrees to first order. Setting k²/2N ≈ 1/2 gives the crossover k ≈ √N. ∎\n\nRun it on the candidates. **UUIDv4** (122 random bits): k = 10¹² ids gives P ≤ 10²⁴/(2·2¹²²) ≈ 10⁻¹³ — collision-safe for any civilization-scale system; randomness is a perfectly sound *uniqueness* mechanism. **A 64-bit random id**: k = 4 × 10⁹ (Lens's photo count within a couple of years at the horizon) gives P ≈ (1.6×10¹⁹)/(3.7×10¹⁹) ≈ 43% — a coin flip on corruption; 64 random bits are not enough for a system that matters, which is why 64-bit schemes must *structure* the bits instead of randomizing them. That structure is Snowflake."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The Snowflake layout",
              "statement": "A **Snowflake id** packs uniqueness into structured 64 bits (Twitter's 2010 layout, since ubiquitous):\n\n  [ 1 sign bit ] [ 41 bits: milliseconds since a custom epoch ] [ 10 bits: machine id ] [ 12 bits: per-machine sequence within the millisecond ]\n\nUniqueness is compositional: distinct machines differ in the machine field; ids from one machine in one millisecond differ in the sequence; across milliseconds the timestamp differs. Capacity: 2⁴¹ ms ≈ **69 years** of epoch; 2¹⁰ = **1,024 machines**; 2¹² = **4,096 ids/ms/machine** (≈ 4 M ids/s per machine). Ids are k-sortable: sorting by id sorts by creation time to millisecond resolution — the property pagination, clustering, and B-tree locality wanted. Generation is a register read and an increment: coordination-free after machine-id assignment (the one, rare coordination event — done via configuration or a registration service)."
            },
            {
              "type": "example",
              "heading": "Worked example: deriving a bit budget from requirements",
              "body": "The layout is not scripture; it is the solution to a small allocation problem, and the method re-derives it per system. Requirements interrogation for a hypothetical event platform: peak mint rate 2 M ids/s fleet-wide; fleet up to 4,000 generator nodes; horizon 50 years; ids must fit 64 bits and sort by time.\n\n**Timestamp**: 50 years at millisecond resolution needs log₂(50 × 3.15×10¹⁰ ms) = log₂(1.6×10¹²) ≈ 40.5 → **41 bits**. **Machine**: 4,000 nodes → **12 bits** (4,096). **Sequence**: per-machine peak = 2 M/s spread over the fleet is small on average, but skew (unit 2!) means one hot node might take 100 k/s ≈ 100/ms → 7 bits suffices, but headroom for bursts says 10 bits (1,024/ms ≈ 1 M/s/node). Total: 1 + 41 + 12 + 10 = **64. Exactly.** The budget closes — barely, which is the real lesson: 64 bits is *tight*, and every field is a requirements decision. Need a 100-year horizon? Steal a bit from somewhere: second-resolution timestamps (costs sort granularity), fewer machines, or accept 63 usable bits. Need 16 k machines? The sequence shrinks. When the budget genuinely doesn't close, the answer is 128-bit structured ids (UUIDv7 — a millisecond timestamp followed by random bits: the time-sortability of Snowflake, the coordination-free-ness of UUIDv4, at twice the storage). The artifact to produce in a review is this paragraph: fields, widths, and the requirement each width answers."
            },
            {
              "type": "example",
              "heading": "Worked example: Instagram's variant — the database mints the id",
              "body": "Instagram's engineering team (2012) faced the same requirements with one constraint changed: no separate generator fleet — they wanted ids minted *inside* their sharded Postgres, atomically with the insert. Their layout: **41 bits of millisecond timestamp | 13 bits of logical shard id | 10 bits of per-shard sequence** — the sequence being each shard's own auto-increment counter modulo 1,024, read inside the inserting transaction.\n\nWhat this buys, and what it spends, is a compact tour of the trade space. Buys: id assignment is transactional with the row (no id-minted-but-insert-failed states); no new service to run (the generator *is* the shard); uniqueness is enforced by the machinery that already enforced per-shard counter uniqueness. Spends: minting is coupled to a database write (can't hand out ids for objects that live elsewhere — Snowflake's independence is gone); rate per shard is bounded by the shard's write throughput anyway (which is why 10 sequence bits sufficed); and the shard id must be *logical* (Instagram used thousands of logical shards mapped onto few physical machines — unit 2's virtual-nodes idea reappearing) so data can migrate without ids lying about where they live. The general design point: an id can encode *placement* (which shard owns this row — saving a lookup on every read) at the cost of freezing that placement into every stored reference. Encode logical, never physical, location — the indirection is what keeps resharding possible."
            },
            {
              "type": "text",
              "heading": "The clock is the weak link",
              "body": "Snowflake's uniqueness proof has an unstated premise: each machine's timestamp field never repeats with the same sequence — which holds only if the clock never goes **backwards**. Real clocks do: NTP corrections step time backwards by milliseconds to seconds when a drifted clock re-synchronizes. A generator that blindly trusts a stepped-back clock will re-mint timestamps it already used — with the sequence reset, collisions follow. The standard defenses, in order of rigor: **refuse** — on detecting now < last, stop minting and alert (correct, brutal: an id outage); **wait** — if the regression is small (tens of ms), spin until the clock passes the high-water mark (the common choice: availability hiccup, no corruption); **never step** — run clocks with slew-only discipline (chrony's smeared adjustments) so regressions don't occur, and keep the wait as a backstop. Note what the failure mode is *not*: gradual skew between machines. Machines disagreeing by seconds costs only sort quality (ids from a slow-clocked machine sort slightly early) — uniqueness never depends on cross-machine clock agreement, because the machine-id field partitions the space. The design habit to keep: for every 'time-based' scheme, ask separately what breaks under *backwards* time (usually correctness) versus *skewed* time (usually only ordering quality) — the two failure modes almost never have the same severity, and conflating them either over-engineers or under-engineers the clock."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Random primary keys quietly tax every insert forever.** A UUIDv4 primary key scatters inserts uniformly across the B-tree (unit 2): every insert lands on a random leaf page — cold pages fault in, pages split mid-tree, the working set becomes the whole index. Time-ordered ids (Snowflake, UUIDv7) append at the tree's right edge: hot pages stay resident, splits are rare and rightmost. On a billion-row table this is the difference between an index that lives in RAM and one that thrashes — measured in production as a mysterious 5–10× insert-throughput gap. If a random id must exist (unguessability for external URLs), store it as a secondary unique column; keep the clustering key time-ordered."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A service mints 48-bit random ids and currently holds 30 M objects, growing 50 M/year. (a) Bound today's collision probability and the probability after 3 years. (b) At what object count does collision probability reach 1%? (c) State the two distinct fixes and what each costs.",
                  "solution": "N = 2⁴⁸ ≈ 2.8×10¹⁴. (a) Today: k = 3×10⁷ → P ≤ k²/2N = 9×10¹⁴ / 5.6×10¹⁴ ≈ **1.6** — the bound exceeds 1, i.e. it gives no guarantee at all; the exact form says collision is near-certain (k is already 100× past √N ≈ 1.7×10⁷). If the system hasn't seen collisions, it's luck or undetected corruption — audit now. Three years (k = 1.8×10⁸) is far past hope. (b) k²/2N = 0.01 → k = √(0.02·N) ≈ 2.4×10⁶ — this scheme was unsafe past ~2.4 M objects, long ago. (c) Fix 1: widen the space — 128-bit ids (UUIDv4/v7): collision probability returns to negligible; costs 2× id storage and index width. Fix 2: structure the bits — Snowflake-style 64-bit (timestamp|node|sequence): uniqueness by construction, time-sortability as a bonus; costs running machine-id assignment and clock discipline. The meta-lesson: √N, not N, is a random scheme's real capacity — 2⁴⁸ 'feels' like 280 trillion but is actually ~17 million-safe.",
                  "hint": "Compare k to √N first; the bound k²/2N only means something while it's ≪ 1."
                },
                {
                  "prompt": "Derive a bit budget for a multi-tenant IoT platform: 100-year horizon, 100 k concurrently-registered devices each minting at most 100 ids/s, ids must sort by time to ~1-second granularity, and the platform wants ids ≤ 64 bits. Show whether the budget closes, and what you'd trade if it doesn't.",
                  "solution": "Timestamp at 1 s granularity: 100 years ≈ 3.15×10⁹ s → log₂ ≈ 31.6 → **32 bits**. Device field: 100 k → **17 bits** (131 k). Sequence: 100 ids/s at 1-second timestamp resolution needs a 100-deep sequence per second → **7 bits** (128). Total: 32+17+7 = 56 (+1 sign) = **57 bits — closes with 7 bits spare**. Spend the spare deliberately: widen the device field to 20 bits (1 M devices — growth headroom), or sharpen the timestamp to ~centisecond granularity (+7 bits ≈ ×128 resolution) for better sort quality; the requirements (device growth projection vs pagination granularity needs) pick. If the horizon had demanded millisecond resolution (42 bits), the budget would burst (42+17+7 = 66): trades would be second-granularity timestamps (as derived), a shorter epoch, or moving to 128-bit UUIDv7. The graded skill is exactly this: each field width traced to a stated requirement, spare bits allocated by argument rather than left implicit.",
                  "hint": "Bits per field = ⌈log₂(quantity × horizon at chosen resolution)⌉; sum and compare to 63 usable."
                },
                {
                  "prompt": "A generator node's NTP daemon steps its clock back 800 ms during a resync. Walk what happens to a naive Snowflake generator minting 2 k ids/s, compute how many ids are at risk, and specify the wait-strategy behavior including what the node's clients observe.",
                  "solution": "Naive walk: at step-back, now = t − 800 ms; the generator's timestamp field re-enters the window [t−800, t) it already minted through. At 2 k ids/s it minted ~1,600 ids in that window; re-minting the same milliseconds with a reset sequence reproduces (timestamp, machine, sequence) triples whenever the same millisecond sees sequence values it saw before — up to **~1,600 ids at risk** of exact collision (corruption in whatever table they key). Wait strategy: the generator keeps a high-water mark last_ts; on now < last_ts it refuses to mint from the past — it spins/sleeps until wall clock exceeds last_ts (800 ms), then resumes. Clients observe: id requests stall ~800 ms (a latency spike, surfaced as slow inserts; with a request timeout, some see errors and retry per unit 1's discipline) — an availability blip, zero corruption. Completing the design: alert on wait events (a stepping clock is a config bug — slew-only discipline should make steps rare), and bound the wait (a 30 s step means something is deeply wrong: refuse and page rather than block the write path half a minute). The exercise's principle: the generator trades availability for uniqueness at the exact moment the clock lies — the correct direction, chosen in advance.",
                  "hint": "How many milliseconds get revisited, at what mint rate? Then: what does 'refuse to mint from the past' cost whom?"
                },
                {
                  "prompt": "A team uses UUIDv4 primary keys on a 2-billion-row orders table and complains that bulk insert throughput has degraded 8× as the table grew, while a similarly-sized events table with Snowflake keys hasn't degraded. Explain the mechanism precisely (which pages are touched, what fits in RAM), and give the migration-safe fix for systems that also need unguessable external ids.",
                  "solution": "Mechanism: the primary-key B-tree on UUIDv4 receives inserts at uniformly random key positions — each insert lands on a random one of ~tens of millions of leaf pages. The 'working set' for inserts is therefore the ENTIRE index; once the index outgrows the buffer pool, most inserts fault a cold page from disk (SSD random read ~100 µs, unit 1's table) and dirty it, and mid-tree page splits fragment the file further. The Snowflake table's inserts all target the rightmost edge: a handful of hot pages, permanently resident, splits rare and sequential — throughput independent of table size. The 8× gap is the ratio of in-RAM appends to disk-faulting random inserts, and it worsens as the tree grows (locality degrades with size — the degradation being gradual is why it shipped). Fix: primary/clustering key becomes a time-ordered 64-bit id (or UUIDv7); the unguessable external identifier becomes a separate UUIDv4 column with a unique secondary index — that index still takes random inserts, but it is narrower, and the table's row placement plus every other index keyed by PK regain locality. Migration-safe path: add the new column, backfill, dual-write, swap the clustering key during a maintenance window (or via online schema-change tooling — unit 8's subject). The principle: uniqueness, sortability, and unguessability are three different requirements; forcing one column to serve all three is what created the tax.",
                  "hint": "Where in the B-tree does each scheme's next insert land, and does that set of pages fit in the buffer pool?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u5l1-i1",
              "front": "The five requirements of a distributed ID generator?",
              "back": "Unique fleet-wide forever (collision = silent corruption), coordination-free minting, roughly time-ordered (pagination/clustering/B-tree locality), compact (64 bits), high-rate. Auto-increment fails coordination; UUIDv4 fails ordering/compactness-at-safety."
            },
            {
              "id": "u5l1-i2",
              "front": "Birthday bound — statement and the design rule it yields?",
              "back": "k uniform draws from N: P(collision) ≤ k²/2N; likely at k ≈ √N. Rule: a random scheme's real capacity is √N — 64 random bits ≈ 4 B ids to coin-flip territory (unsafe); 122 random bits (UUIDv4) are civilization-safe."
            },
            {
              "id": "u5l1-i3",
              "front": "Snowflake layout and where its uniqueness comes from?",
              "back": "1 sign | 41 ms-timestamp (~69 yr) | 10 machine (1,024) | 12 sequence (4,096/ms/machine). Compositional uniqueness: fields partition the space — no cross-machine coordination after machine-id assignment; k-sortable by time."
            },
            {
              "id": "u5l1-i4",
              "front": "Backwards clock vs skewed clock — why different severities?",
              "back": "Backwards (NTP step) breaks UNIQUENESS (re-mints used timestamps) → refuse or wait past the high-water mark; skew between machines costs only sort quality — uniqueness never needs cross-machine clock agreement (machine field partitions). Always ask the two questions separately."
            },
            {
              "id": "u5l1-i5",
              "front": "Why not UUIDv4 as a clustering/primary key?",
              "back": "Uniform-random keys make every insert hit a random B-tree leaf: working set = whole index, cold-page faults + splits → multi-× insert degradation as the table grows. Time-ordered keys append at the hot right edge. Need unguessability? Separate secondary UUID column."
            },
            {
              "id": "u5l1-i6",
              "front": "What did Instagram's in-database ID scheme trade?",
              "back": "Minting atomic with the insert + no generator fleet, at the cost of coupling ids to DB writes and encoding shard placement. Rule: encode LOGICAL shard id (their 13 bits, thousands of logical shards) so data migrates without ids lying — virtual nodes for identifiers."
            }
          ]
        },
        {
          "id": "u5l2",
          "title": "The URL Shortener, End to End",
          "estMinutes": 25,
          "builds_on": [
            "u5l1",
            "u3l1",
            "u1l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The classic, taken seriously",
              "body": "*Design a URL shortener* is the most-assigned system prompt in the world, usually answered with a diagram and a hand-wave. Taken seriously, it is the perfect rehearsal of units 1–4 at miniature scale, with two genuinely instructive decisions inside it — how codes are generated, and what an HTTP redirect status actually commits you to.\n\nRequirements, interrogated (unit 1, compressed): create short link → long URL; redirect on hit; custom aliases optional; links live for years. Scale, from the *Three prompts* profile: 100 M new links/month ≈ **40 writes/s**; 10 B redirects/month ≈ **4,000 reads/s average, ~12 k/s peak** — 100:1 read-dominated. Latency: the redirect sits in front of *every click* — p99 < 100 ms, globally. Availability: a dead shortener breaks every link ever minted — 99.99% aspiration. Objects: ~500 bytes each (URL + metadata); 100 M/month × 500 B = 50 GB/month ≈ **600 GB/year** — a *small* dataset (unit 1's one-machine test will echo loudly). Consistency: a link, once created, is immutable — reads can be cached forever (unit 3's favorite property); creation must be read-your-writes for the creator (they immediately test their link). The profile in one sentence: tiny hot dataset, brutal read ratio, immutable values — the read path is everything, and the store is almost incidental."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "Code length arithmetic",
              "statement": "Using an alphabet of a symbols (base-a encoding; a = 62 for [0-9a-zA-Z]), codes of length L address aᴸ distinct links, so supporting N links requires L ≥ ⌈log_a N⌉. For a = 62: L = 6 covers 62⁶ ≈ 5.7 × 10¹⁰ (57 billion); L = 7 covers 62⁷ ≈ 3.5 × 10¹² (3.5 trillion). A system projecting 10¹⁰–10¹² lifetime links therefore ships 7-character codes.",
              "proof": "Each of the L positions independently takes one of a symbols, so the code space has exactly aᴸ elements; injectively mapping N links into it requires aᴸ ≥ N, i.e. L ≥ log_a N, and L integer gives the ceiling. For the constants: 62⁶ = 62²·62²·62² = 3,844³ ≈ 5.68×10¹⁰ < 10¹¹ ≤ 10¹²; 62⁷ = 62·62⁶ ≈ 3.52×10¹² ≥ 10¹². ∎\n\nThe design reading: at 100 M links/month ≈ 1.2 B/year, 6 characters last ~47 years *if* codes are allocated densely (sequential), but only until the birthday bound bites (~√(5.7×10¹⁰) ≈ 240 k links!) if codes are drawn *randomly* — the two generation strategies below differ by five orders of magnitude in effective capacity, which is why 'how long should codes be' cannot be answered before 'how are codes generated'."
            },
            {
              "type": "text",
              "heading": "Generating codes: counter, hash, or random",
              "body": "**Counter + encode** (the clean answer): mint a unique id (last lesson's machinery — Snowflake or a sharded counter), base62-encode it → dense allocation, zero collisions by construction, 6–7 chars for decades. Cost: ids are *guessable* (sequential codes let strangers enumerate your links — a privacy requirement to extract! if links can carry private URLs, add a per-code random suffix or encrypt the counter — guessability is unit 5-lesson-1's third requirement, surfacing again). **Hash the URL** (MD5/SHA truncated to L chars): same URL → same code, deduplicating repeat submissions for free — but truncation to 42 bits (7 base62 chars) puts the birthday bound at √(2⁴²) ≈ 2 M links; beyond that, collisions must be *detected and re-salted* (read-before-write on every create — a check-then-act needing the atomicity discipline of unit 1). Verdict: dedup is a nice-to-have; collision machinery on the write path is a real cost; hashing earns its place only when dedup is a stated requirement. **Pure random**: draw 7 chars, insert with a uniqueness constraint, retry on conflict — unguessable by default, collision-safe in practice while occupancy is low (retries grow as the space fills — at 1% occupancy, 1% of creates retry). A fine middle answer with the retry loop stated honestly.\n\nThe interview-grade summary: counter for density and simplicity, random for unguessability, hash only for dedup — and whichever is chosen, the create path is idempotent under the client's key (unit 1) so a retried create doesn't mint two codes."
            },
            {
              "type": "example",
              "heading": "Worked example: the full design, walked",
              "body": "Assemble it with the method's receipts. **Store**: 600 GB/year of immutable ~500 B rows, keyed by code — a replicated relational table or managed KV both pass; nothing exotic is paid for (unit 2's table: nothing binds). Partition (when needed, years out) by hash(code) — point lookups only, the partition-key principle's easiest case. **The read path is the system**: 12 k reads/s peak of immutable tiny values with power-law popularity (a viral link is read millions of times; the median link, near zero). Application cache (unit 3): hot codes in memory — even a 1 GB cache holds 2 M hot entries; expected hit ratio very high (h ≥ 0.99 is realistic for this skew); origin sees (1−h)·12 k ≈ **120 reads/s** — one modest database. Effective read latency: h·(cache ~1 ms) + miss·(DB ~5 ms) ≈ 1 ms server-side; the global p99 < 100 ms is then bought with geography (unit 3): either PoP-local read replicas of the (tiny!) table, or — since values are immutable — edge caching of the redirects themselves where the CDN permits caching 301s. Immutability is doing all the heavy lifting: no invalidation, infinite TTLs, replicate anywhere. **Create path**: 40 writes/s against the id scheme of the previous lesson; write to the primary, read-your-writes for the creator via the session pin of unit 2. **Availability**: the read path must survive the write path's death (a shortener whose reads work is 'up'): cache + replicas serve stale-free (immutable!) reads through any primary outage — an availability decomposition worth stating in any design: *separate the SLO of reads from writes when the data model permits*."
            },
            {
              "type": "example",
              "heading": "Worked example: 301 vs 302 — a status code as an architecture decision",
              "body": "The redirect returns either **301 Moved Permanently** or **302 Found** (temporary), and the choice is a genuine systems trade, not trivia.\n\n**301**: browsers and intermediaries may cache it indefinitely — subsequent clicks of the same link on that device *never hit your service again*. Reads offload to the world's browsers: your 12 k/s peak might drop to a third. The price: you have blinded yourself — no click counts, no analytics, no ability to update or kill the mapping for that user (the browser will keep redirecting from its cache even after you delete the link: the takedown problem of unit 3, now living in devices you don't control). **302/307**: every click hits your service — full analytics, instant kill-switch, at the cost of owning all the read traffic and its latency forever.\n\nRun the requirements against it: if analytics is a product feature (it always is — click counts are the shortener's business model) and takedown matters (it does — shorteners are abuse magnets), the answer is **302 with strong server-side caching** (unit 3 absorbs the traffic the browsers would have), or the modern compromise: 301 with `Cache-Control: max-age=300` — permanent semantics, bounded blindness (5-minute device cache: ~all of a user's repeat-click traffic absorbed, analytics loses only same-user-same-5-minutes repeats, takedown latency bounded at 5 min — the TTL staleness bound of unit 3, applied to the entire internet as your cache tier). The lesson generalizes: **an HTTP header can relocate your read path into infrastructure you don't operate** — priced in observability and control, the same currencies as every caching decision, because that is exactly what it is."
            },
            {
              "type": "diagram",
              "kind": "graph",
              "directed": true,
              "height": 300,
              "caption": "The shortener: reads (solid) dominate 100:1 and terminate in cache almost always; creates (dashed) mint ids and write once. Click events leave the hot path immediately via the log — unit 4's shape, in miniature.",
              "nodes": [
                {
                  "id": "u",
                  "label": "Clicker",
                  "x": 5,
                  "y": 35,
                  "tone": "gold"
                },
                {
                  "id": "cr",
                  "label": "Creator",
                  "x": 5,
                  "y": 75,
                  "tone": "gold"
                },
                {
                  "id": "edge",
                  "label": "Edge / LB",
                  "x": 24,
                  "y": 35
                },
                {
                  "id": "svc",
                  "label": "Redirect service",
                  "x": 46,
                  "y": 35
                },
                {
                  "id": "cache",
                  "label": "Cache (hot codes)",
                  "x": 68,
                  "y": 20,
                  "tone": "sage"
                },
                {
                  "id": "db",
                  "label": "Store (code → URL)",
                  "x": 68,
                  "y": 52,
                  "tone": "sage"
                },
                {
                  "id": "idg",
                  "label": "ID gen",
                  "x": 30,
                  "y": 75
                },
                {
                  "id": "log",
                  "label": "Click log → analytics",
                  "x": 46,
                  "y": 92,
                  "tone": "sage"
                }
              ],
              "edges": [
                {
                  "from": "u",
                  "to": "edge",
                  "label": "GET /aZ3x9Qk"
                },
                {
                  "from": "edge",
                  "to": "svc"
                },
                {
                  "from": "svc",
                  "to": "cache",
                  "label": "h ≈ 0.99",
                  "bold": true
                },
                {
                  "from": "cache",
                  "to": "db",
                  "label": "miss",
                  "dashed": true
                },
                {
                  "from": "svc",
                  "to": "log",
                  "label": "async event",
                  "dashed": true
                },
                {
                  "from": "cr",
                  "to": "idg",
                  "dashed": true,
                  "label": "create"
                },
                {
                  "from": "idg",
                  "to": "db",
                  "dashed": true,
                  "label": "insert once"
                }
              ]
            },
            {
              "type": "text",
              "heading": "Analytics without touching the hot path",
              "body": "Click analytics is the shortener's revenue and the redirect's enemy: the redirect must return in single-digit milliseconds, and anything synchronous added to it — a counter increment, an analytics insert — is latency and a failure dependency the SLO never authorized. The shape is unit 4's, verbatim: the redirect service **emits a click event** (code, timestamp, referrer, coarse geo) to the log and returns; consumers aggregate — per-code counts via the bucketed-counter model (unit 3's trending exercise), per-day rollups into the analytics store (unit 2's columnar row). Delivery is at-least-once; the counter consumer dedups or tolerates (a click count off by a handful under redelivery is priced — state the grant); and if the log is briefly unavailable, the redirect *still redirects* and drops the event (shed, per unit 4's menu — clicks are samples here, not artifacts; the redirect's availability outranks the count's completeness, a priority the requirements ranked for us). One sentence of design-review English captures the whole discipline: *the hot path emits and forgets; everything that can be async is async; every async consumer names its guarantee.*"
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**Why this toy is the canonical interview prompt**: in 40 writes/s it contains the entire course — requirements interrogation and profile classification (unit 1), an id-generation decision with a birthday bound (this unit), a store that nothing exotic is paid for (unit 2), a cache hierarchy carrying 99% of traffic with immutability deleting invalidation (unit 3), an async analytics pipeline with named delivery semantics (unit 4), and one HTTP header that outsources your read path to the planet's browsers. Interviewers assign it because every hand-wave has a number hiding under it; now you know which numbers."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A shortener projects 500 M links/year for 20 years. (a) Minimum code length in base62 for counter-based allocation? (b) For pure-random allocation, what length keeps the *retry rate* (fraction of creates hitting an occupied code) below 1% at end of life? (c) Reconcile the two answers into a recommendation.",
                  "solution": "Lifetime N = 10¹⁰. (a) Counter (dense): need 62ᴸ ≥ 10¹⁰ → 62⁵ ≈ 9.2×10⁸ (no), 62⁶ ≈ 5.7×10¹⁰ (yes) → **6 characters**. (b) Random: the retry (conflict) probability of a single create equals current occupancy k/62ᴸ; requiring 10¹⁰/62ᴸ ≤ 0.01 → 62ᴸ ≥ 10¹² → **7 characters** (62⁷ ≈ 3.5×10¹², end-of-life occupancy ≈ 0.3%). (Note this is occupancy arithmetic, not the birthday bound — the store's uniqueness constraint turns collisions into retries, so the question is retry *rate*, not any-collision-ever.) (c) Recommendation: if link privacy/unguessability is a requirement (usually yes), ship **7-char random** (or counter + cryptographic permutation): one extra character buys enumeration resistance and a sub-1% retry loop. If codes may be sequential-guessable, 6-char counter is maximally dense. Either way, state the retry loop (random) or the guessability posture (counter) explicitly — the length question was never answerable alone.",
                  "hint": "Counter needs 62ᴸ ≥ N. Random needs 62ᴸ ≥ N/target-retry-rate. Different inequalities, different lengths."
                },
                {
                  "prompt": "Your shortener's analytics show a single code receiving 220 k clicks/s (a superstar's tweet). The redirect fleet handles it (cache hit), but the click-event pipeline's counter consumer — keyed per code, per unit 4's per-key serialization — is now a single lane processing 220 k increments/s and lagging. Diagnose and fix without breaking count correctness, citing the relevant prior results.",
                  "solution": "Diagnosis: per-key ordering (unit 4's partitioned-log discipline) serialized all of this code's events into one partition lane — correct for state machines, needless for counters: increments are commutative, so per-key ORDER was never required, only per-event effectively-once. The whale key turned a correctness-irrelevant guarantee into a throughput ceiling (unit 2's celebrity, in stream clothing). Fix: shard the hot key's events across lanes — key by (code, hash(event_id) mod 16) (the compound-key repair of unit 2's ads exercise, applied to a stream): 16 parallel consumers each maintain a partial count with their own dedup/offset checkpoints (unit 4's corollary per lane), and the read side sums the 16 partials (the sharded-counter shape from unit 6's preview in unit 2 — scatter the rare read, never the hot write). Correctness: each event still applied exactly once within its lane; the total is a sum of exactly-once partials — order was never load-bearing for a commutative aggregate, and saying WHY it wasn't (commutativity) is the graded step.",
                  "hint": "Which guarantee did per-key ordering buy here, and does an increment need it? Then re-apply the compound-key escape."
                },
                {
                  "prompt": "Legal demands takedowns be effective within 60 seconds. Audit the three places a killed link keeps redirecting in this lesson's design — application cache, CDN-cached redirects, browser-cached 301s — and give the compliant configuration with its costs.",
                  "solution": "(1) Application cache: entries were cached with long TTLs under the immutability assumption — but a takedown is a MUTATION of the code→URL binding (to 'gone'). Fix: delete-on-takedown (cache-aside invalidation, unit 3) — sub-second, cheap; keep long TTLs otherwise. (2) CDN-cached redirects: if edges cache the 301/302 responses, takedown requires purge (minutes, best-effort — unit 3's callout) — non-compliant alone; compliant config caps edge TTL at 60 s (`max-age=60` on redirect responses) so expiry enforces the deadline even when purge lags; cost: edges re-fetch each hot code once a minute — negligible (coalesced, unit 3). (3) Browser-cached 301s: uncontrollable once issued — no purge exists for the world's browsers. Compliant config: **stop issuing long-lived 301s**: use 302, or 301 with `max-age=60`; cost: repeat same-user clicks return (~full read traffic, absorbed by the cache tier per the design). Net: the 60 s SLO propagates as a TTL ceiling through every cache you don't operate synchronous invalidation for — the revocation rule of unit 2 pricing the whole hierarchy, and the reason the 'modern compromise' in the lesson already chose bounded max-age. Immutability was the performance story; takedown is why it was 'immutable except by law', and the exception owns the TTLs.",
                  "hint": "For each cache: does an invalidation channel exist? Where none exists, the TTL is the takedown SLO."
                },
                {
                  "prompt": "Sketch the shortener's availability decomposition: which components may fail while reads still serve, what the creator experiences during a primary-store outage, and the one dependency the read path cannot lose. Then state the SLO pair you would publish.",
                  "solution": "Read path: edge/LB → redirect service → cache → replicas. Because mappings are immutable, cached and replicated copies are always correct — reads survive: primary store down (cache + replicas serve; misses for never-cached codes still resolve from replicas), analytics/log down (redirect sheds events), id generator down (creates fail; reads unaffected). The read path's irreducible dependency: the redirect service + at least one copy of the mapping (cache or replica) — protect with the redundancy arithmetic of unit 1 (2+ service instances per zone, cache replication, ≥2 read replicas across zones). Creator experience during primary outage: creates return 503 with Retry-After (reject, don't queue — unit 4's menu: intake is user-facing); already-created links redirect normally; the creator's just-made link keeps working (it's in cache/replicas). Published SLOs, decomposed per the lesson: **redirects 99.99%** (the promise the whole world depends on — achievable because immutability lets every layer serve without coordination) and **creates 99.9%** (a stricter target buys little: creation is rare, retryable, and idempotent under the client's key). Separating the two SLOs is the design's payoff — one number for both would either overspend on creates or underprotect reads.",
                  "hint": "Immutability means copies are never wrong. So which failures leave zero correct copies reachable?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u5l2-i1",
              "front": "The URL shortener's requirement profile in one line?",
              "back": "Tiny immutable values (~500 B), brutal read dominance (100:1, 12 k/s peak vs 40 writes/s), redirect p99 < 100 ms global, reads must survive write-path death. The read path IS the system; immutability powers every layer."
            },
            {
              "id": "u5l2-i2",
              "front": "Code length arithmetic — the two inequalities?",
              "back": "Counter (dense): 62ᴸ ≥ N → 7 chars cover 3.5×10¹². Random: 62ᴸ ≥ N/retry-rate (occupancy = retry probability per create). Hash-truncated: birthday bound at √space — collisions need detect-and-resalt. Length is unanswerable before generation strategy."
            },
            {
              "id": "u5l2-i3",
              "front": "Counter vs hash vs random code generation — when each?",
              "back": "Counter+encode: dense, collision-free, guessable (add permutation/suffix if links are private). Hash(URL): free dedup, but truncation → birthday collisions → read-before-write machinery; only if dedup is required. Random: unguessable, retry-on-conflict loop stated honestly."
            },
            {
              "id": "u5l2-i4",
              "front": "301 vs 302 — the architecture trade?",
              "back": "301 = the world's browsers become your cache: massive offload, but blindness (no analytics) and uncontrollable takedown. 302 = full analytics + kill-switch, you own all traffic. Compromise: 301/302 with max-age=60–300 — bounded blindness, TTL = takedown SLO."
            },
            {
              "id": "u5l2-i5",
              "front": "How does analytics avoid touching the redirect's latency?",
              "back": "Emit-and-forget: redirect publishes a click event to the log and returns; bucketed-counter consumers aggregate async (at-least-once + tolerance/dedup, grant stated). Log down → shed events, keep redirecting: clicks are samples, the redirect is the promise."
            },
            {
              "id": "u5l2-i6",
              "front": "Why publish separate read and write SLOs for the shortener?",
              "back": "Immutability makes every cached/replicated copy permanently correct, so reads survive primary, generator, and analytics outages — 99.99% redirects is buyable. Creates are rare, retryable, idempotent — 99.9% suffices. One merged SLO would overspend or underprotect."
            }
          ]
        },
        {
          "id": "u5l3",
          "title": "A Dynamo-Style Key-Value Store",
          "estMinutes": 27,
          "builds_on": [
            "u2l3",
            "u2l4",
            "u4l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Assembling the machine",
              "body": "Unit 2 proved the parts separately: consistent hashing places keys and moves only K/n on membership change (*Partitioning in Practice*); W + R > N makes read and write quorums intersect (*The Consistency You Actually Need*). This lesson assembles them — plus the pieces the proofs deliberately deferred — into the design that Amazon's Dynamo paper (SOSP 2007) made canonical and that every 'AP key-value store' since has descended from: a store that stays **writable through node failures and network partitions**, at the price of surfacing the conflicts that availability makes unavoidable.\n\nThe assembly: keys hash onto the ring (virtual nodes included); each key's **preference list** is the next N distinct physical nodes clockwise from its position — the N replicas of unit 2's quorum rule, now given addresses. Writes go to the preference list and succeed at W acks; reads gather R. So far, pure unit 2. The new machinery answers the questions unit 2's caveats left open: what happens when preference-list nodes are *down* (sloppy quorums, hinted handoff); how divergent replicas are *detected* (version vectors — the lesson's theorem); and how they *converge again* (read repair, and conflict resolution that someone must own). The through-line: every piece is the itemized bill for choosing **write-availability first**."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Preference lists, sloppy quorums, and hinted handoff",
              "statement": "For a key k with preference list [n₁ … n_N]: a **strict quorum** accepts a write only on preference-list members — unavailable members can block the write. A **sloppy quorum** instead accepts the write on the first N *reachable* nodes walking clockwise past failures: if n₂ is down, the write lands on n₁, n₃, and n_{N+1}, where n_{N+1} holds it as a **hinted replica** — tagged with the hint 'this belongs to n₂' — and delivers it to n₂ when n₂ recovers (**hinted handoff**). Sloppy quorums keep W acks achievable through failures (writes never block on a dead node), at the price that W + R > N no longer guarantees intersection with certainty — during the failure window, a read quorum drawn from the original list can miss the hinted write. The store is choosing availability over the overlap guarantee, knowingly; version vectors and read repair are what make that choice survivable."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "Version vectors characterize causality",
              "statement": "Tag each stored version of a key with a **version vector** V: a map from replica-coordinator id to a counter, where coordinating node i increments V[i] when it accepts a write that extends the version it read. Define V ≤ V′ iff V[i] ≤ V′[i] for every i. Then for two versions with vectors V, V′:\n\n(i) V < V′ (≤ and ≠) **iff** the write producing V happened-before (is in the causal history of) the write producing V′ — so V′ supersedes V and V may be discarded;\n\n(ii) V and V′ are incomparable (each exceeds the other somewhere) **iff** the writes were **concurrent** — neither saw the other; both must be kept as siblings and presented for resolution.",
              "proof": "(⇐ of i) If the write w′ causally descends from w, then w′'s coordinator began from a version whose vector already included w's entries (vectors only grow along a causal chain: each write copies the vector it read and increments its own slot). Hence V ≤ V′ componentwise, and V ≠ V′ since w′ incremented some slot beyond V. (⇒ of i) Suppose V < V′. Consider slot j where w incremented last: V[j] counts writes coordinated by j in w's history. V′[j] ≥ V[j] means w′'s history includes at least V[j] writes coordinated by j; counters at a coordinator are assigned sequentially to causally-chained versions, so including the V[j]-th write by j means including w itself (or a version that supersedes it) in w′'s causal past — w happened-before w′. (ii) is the contrapositive read both ways: if neither history contains the other, each vector exceeds the other in the slot of its own latest coordinator, so they are incomparable; conversely incomparable vectors cannot be causally ordered by (i) in either direction, hence concurrent. ∎\n\nWhat the theorem buys, stated plainly: the store can *mechanically* distinguish 'stale copy, safe to discard' from 'genuine conflict, must surface' — with no clocks involved. Timestamps cannot make this distinction: a later wall-clock time does not mean 'saw the earlier write', and last-write-wins (LWW) — keep the latest timestamp, drop the rest — is precisely the decision to *stop distinguishing* and silently discard one side of every concurrent pair."
            },
            {
              "type": "diagram",
              "kind": "sequence",
              "caption": "Sloppy quorum through a failure (N=3, W=2): with n₂ down, the write achieves W on n₁ + n₄ (hinted). A read during the window gathers R=2 from [n₁, n₃] and still sees the write via n₁ — but a read from [n₂(recovering), n₃] would not: the overlap guarantee is probabilistic until handoff completes.",
              "actors": [
                "Client",
                "n₁",
                "n₂",
                "n₃",
                "n₄ (hinted)"
              ],
              "messages": [
                {
                  "from": "Client",
                  "to": "n₁",
                  "label": "put(k, v₂) — coordinator",
                  "tone": "sage"
                },
                {
                  "from": "n₁",
                  "to": "n₂",
                  "label": "replicate",
                  "dashed": true,
                  "tone": "rust"
                },
                {
                  "note": "✂ n₂ unreachable — walk past it"
                },
                {
                  "from": "n₁",
                  "to": "n₃",
                  "label": "replicate",
                  "tone": "sage"
                },
                {
                  "from": "n₁",
                  "to": "n₄ (hinted)",
                  "label": "replicate + hint('for n₂')",
                  "tone": "sage"
                },
                {
                  "from": "n₁",
                  "to": "Client",
                  "label": "ack (W=2: n₁,n₃… and n₄ carries the hint)",
                  "tone": "sage"
                },
                {
                  "note": "later: n₂ recovers"
                },
                {
                  "from": "n₄ (hinted)",
                  "to": "n₂",
                  "label": "handoff: deliver v₂, drop hint",
                  "tone": "gold"
                }
              ]
            },
            {
              "type": "example",
              "heading": "Worked example: a conflict is born, detected, and resolved",
              "body": "The shopping cart — Dynamo's own motivating example — under a partition. Cart key k, N=3 on [n₁,n₂,n₃], W=2, R=2. Initial version: cart {A}, vector V₀ = {n₁:1}.\n\n**Partition**: the network splits; the customer's phone reaches {n₁, n₄}, their laptop reaches {n₃, n₅}. Phone adds item B: coordinator n₁ extends what it has — writes {A,B} with V₁ = {n₁:2}, sloppy-acked on n₁ + n₄(hinted for n₂). Laptop adds item C: coordinator n₃ extends *its* copy ({A}, V₀) — writes {A,C} with V₂ = {n₁:1, n₃:1}, acked on n₃ + n₅(hinted).\n\n**Detection**: partition heals; hints deliver; a read gathers R=2 and receives both versions. Compare vectors: V₁ = {n₁:2} vs V₂ = {n₁:1, n₃:1} — V₁ exceeds in slot n₁, V₂ exceeds in slot n₃: **incomparable ⇒ concurrent ⇒ siblings**, exactly as the theorem prescribes (neither write saw the other; discarding either loses a real action). Had the laptop instead written *after* seeing V₁, its vector {n₁:2, n₃:1} > V₁ would mark supersession — mechanically distinguishable, no clock consulted.\n\n**Resolution** — someone must own it, and the honest options are exactly three: (1) **application merge**: the cart merges as set union {A,B,C} — Dynamo's choice; sound because cart-add is commutative-ish, with the known wart that a *deletion* can resurrect (removed-item tombstones needed — unit 4's zombie lesson, recurring); (2) **LWW**: keep the sibling with the later timestamp — here, silently emptying either B or C from the customer's cart: the paper's own numbers made this concrete (Dynamo measured ~0.06% of reads returning divergent versions — LWW would have silently discarded a customer action in each); (3) **surface to the user** ('your cart changed on another device — review'). The design rule extracted: choose per data type, at design time — merge where the domain has a merge (sets, counters via CRDT-style structures), LWW only where dropping a concurrent write is *priced and accepted* (sessions, presence), surface where the user must arbitrate."
            },
            {
              "type": "example",
              "heading": "Worked example: configuring the store, twice",
              "body": "The same machine, tuned to two products — the tuning being the deliverable.\n\n**Session-token store** (the unit-2 exercise, completed): N=3, **W=1, R=1**, LWW resolution. Why each: sessions are per-user, single-writer (one device writes its own session at a time — concurrency between writers is structurally rare), loss-tolerable (a dropped session = one re-login), and latency-critical (every request reads it). W=1/R=1 buys minimum latency and maximum availability; the overlap guarantee is deliberately waived (unit 2's 'cache-grade' verdict, now chosen with eyes open); LWW's silent-drop cost is a re-login — priced, accepted, documented. Hinted handoff on; read repair on (cheap convergence for a store that tolerates divergence anyway).\n\n**Cart store**: N=3, **W=2, R=2**, application-merge resolution with deletion tombstones. Why: a cart is money-adjacent (losing an add is a support ticket; losing a *remove* is worse — the resurrected-item bug), multi-device concurrent by nature (the partition example is Tuesday, not an edge case), and read-your-writes-expected (unit 2's session guarantees layered on top: pin the reader to the coordinator that took their last write). W=2 survives one node down for writes; sloppy quorums keep the checkout path writable through worse; the merge function is *code the application team owns and tests* — the design must name its owner, because 'the database handles conflicts' is precisely what this store, by design, does not do.\n\nThe two configurations differ in every knob, from one requirements interrogation. That is the lesson: the Dynamo machine is not a product you adopt but a space you tune — N, W, R, resolution, and the guarantees each choice waives, all traceable to what a lost or conflicted write *costs this product*."
            },
            {
              "type": "text",
              "heading": "Convergence: read repair and anti-entropy",
              "body": "Two background mechanisms keep the replicas honest, and both fall out of machinery this course already built. **Read repair**: when a read gathers R versions and the vectors reveal some replica is stale (its version < the merged latest), the coordinator writes the superseding version back to the stale replica after answering the client — every read of a key is an opportunistic repair, which converges *hot* keys quickly (the keys read often are repaired often — the skew that plagued partitioning now working in the design's favor). **Anti-entropy** repairs *cold* keys: replicas periodically compare their key ranges and ship differences — efficiently, via Merkle trees (hash trees over key ranges: two replicas compare root hashes; matching subtrees are skipped, differing ones recursed — comparison cost proportional to the *divergence*, not the dataset). This is unit 2's reconciliation-job template (the like-count repair, the derived-model audit), graduated to a peer-to-peer protocol: same role — the backstop that bounds drift no matter what the fast path missed — same design questions (cadence, cost, and what 'repaired' means for siblings: anti-entropy merges vectors, it does not resolve conflicts; resolution still belongs to reads and their owner). With these two in place the store's guarantee can finally be stated in unit-2 vocabulary, honestly: **eventually consistent with bounded divergence, write-available through partitions, conflicts surfaced (or LWW-waived) per key-type** — every clause purchased by a mechanism this lesson named."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Last-write-wins is a data-loss policy with a reassuring name.** Under concurrency it discards one sibling *silently* — and under clock skew, 'last' is not even the last: a node with a fast clock wins conflicts it lost in real time (the skew-vs-backwards distinction of the ID lesson, biting again — LWW converts mere skew into wrongness). LWW is legitimate exactly where the discarded write's cost is consciously priced (sessions, presence, metrics) and indefensible where it isn't (carts, documents, counters). The review question that exposes it: 'show me the ticket where we decided losing a concurrent write here is acceptable' — if none exists, the store's conflict policy is an accident waiting for a customer."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "N=3, W=2, R=2, sloppy quorums enabled. Nodes for key k: preference [n₁,n₂,n₃], overflow n₄. Walk this history and state exactly what each read returns and why: (1) write v₁ succeeds normally; (2) n₁ and n₂ fail; (3) write v₂ (extending v₁) lands where? (4) both nodes recover; (5) a read at R=2 from [n₁,n₂] executes BEFORE any handoff or repair. Then explain which guarantee failed and which mechanism was designed to accept exactly this.",
                  "solution": "(1) v₁ on n₁,n₂ (and async n₃) — say all three converge: vector {c:1}. (2) n₁,n₂ down. (3) v₂'s coordinator (n₃, the reachable member) writes v₂ = {c:1, n₃:1} to n₃ + walks past the dead pair to n₄ and n₅ as hinted replicas for n₁,n₂ — W=2 achieved on n₃+n₄: the write SUCCEEDED through a double failure (the availability purchase working). (5) n₁,n₂ recover; before handoff delivers, a read gathers R=2 from [n₁,n₂]: both return v₁ ({c:1}) — unanimous, no conflict visible — the client reads **stale v₁ with no indication**, despite W+R=4 > N=3. The failed guarantee: quorum overlap — sloppy quorums traded its certainty for step (3)'s write availability; during the failure-to-handoff window the write set (n₃,n₄) and read set (n₁,n₂) draw from a stretched membership of 4+ nodes, so W+R > N no longer forces intersection (the pigeonhole's fixed-N premise was revoked). Designed acceptance: hinted handoff shrinks the window; read repair closes it on the next read including n₃/n₄; vectors mark v₁ superseded ({c:1} < {c:1,n₃:1}) when v₂ arrives. The honest contract: writes stay available through failures; reads are eventually right, 'eventually' bounded by handoff + repair — what 'AP' costs in the small print.",
                  "hint": "Track which physical nodes hold which vector at each step; then check whether the read's node-set and the write's node-set can be disjoint under stretched membership."
                },
                {
                  "prompt": "Two siblings of a user-profile key: Vₐ = {n₁:3, n₂:1} and V_b = {n₁:2, n₂:2}. (a) Ordered or concurrent? (b) A new write coordinated by n₂ is made by a client that read BOTH siblings — what vector does it carry, and what happens to the siblings? (c) A colleague proposes 'just add a timestamp field and keep the newer one' — construct the two-write scenario where that loses an update the vectors would have saved.",
                  "solution": "(a) Vₐ exceeds in n₁ (3>2), V_b exceeds in n₂ (2>1): incomparable → **concurrent siblings**; both kept. (b) A write that descends from both merges their vectors (componentwise max) and increments its coordinator: {n₁:3, n₂:3} — strictly greater than both siblings, so both are superseded and garbage-collected on subsequent reads/repair: this is how conflicts *end* — a descendant write (often the resolved/merged value) dominates the frontier. (c) LWW loss scenario: client on a laggy replica reads an old version and writes profile.phone = X at wall-time 10:00:01 (its node's clock runs 2 s fast); meanwhile another client, having read the CURRENT version, writes profile.address = Y at true time 10:00:00.5 (clock accurate). LWW compares timestamps: the phone-write's (fast-clocked) 10:00:01 wins; address = Y — a write that causally saw MORE — is discarded wholesale. Vectors would have marked the two concurrent (neither saw the other) and surfaced both for a field-wise merge preserving X and Y. The construction shows both LWW defects at once: it resolves by a clock that skew makes fictional, and it resolves whole-value, discarding orthogonal field updates that trivially merge.",
                  "hint": "(b) descendant vector = pointwise max of what was read, +1 in the coordinator's slot. (c) Make the loser the write that read fresher state — via a faster clock on the staler writer."
                },
                {
                  "prompt": "Size and justify the store for a gaming platform's player-inventory service: 40 M players, inventory ≈ 8 KB/player, 60 k reads/s and 9 k writes/s peak, one-region deployment, items are granted by the game server (single writer per player mid-session) but trades between players touch two inventories 'atomically-ish'. Choose N/W/R, resolution policy, and identify the operation this store is the WRONG tool for.",
                  "solution": "Data: 40 M × 8 KB = 320 GB — small; N=3 replication for durability/availability (960 GB total, trivial). Load: 60 k reads/s, 9 k writes/s across 3+ physical nodes via the ring — comfortable. Quorums: inventory loss is player-facing rage — writes need real durability: **W=2**; reads back player-visible state: **R=2** for overlap under normal operation (W+R=4>3), accepting sloppy-quorum windows. Resolution: mid-session writes are single-writer (the game server per player), so concurrency is rare and structural conflicts come from failover/retry races — vectors + an application merge that unions granted items with per-item tombstones for consumed ones (never LWW: 'my sword vanished' is the archetypal silently-dropped concurrent write). The wrong-tool operation: **trades** — 'remove item from A AND add to B' is a multi-key atomic invariant, exactly what a leaderless AP store does not provide (no cross-key transactions; two single-key writes can half-complete, and no merge function repairs a duplicated or vanished sword ACROSS keys). Route trades through the strong tier per unit 2's map: a transactional service (relational, or a consensus-backed log) that emits the resulting single-key inventory writes into this store — the KV store holds each player's inventory state; the trade's atomicity lives where atomicity is sold. Recognizing the operation that doesn't fit the store is the graded judgment; forcing it in is how items duplicate.",
                  "hint": "Walk each operation against the store's guarantees. Which one needs an invariant ACROSS two keys?"
                },
                {
                  "prompt": "Your Dynamo-style store shows rising 'sibling count > 4' alerts on a hot configuration key written by 6 different automation services. Explain what accumulating siblings mean operationally, why this key generates them, and give two fixes at different layers (one usage-pattern, one architectural) with their trades.",
                  "solution": "Meaning: siblings accumulate when concurrent writes outpace resolution — each write that doesn't causally descend from the current frontier adds a branch; readers receive 4+ versions to merge, and if the merge isn't deterministic across services, different readers converge differently (config divergence — the worst kind). Why this key: 6 independent writers, high write rate, none reading-then-writing through a shared path = maximal concurrency by construction — steady-state concurrent writing, which a conflict-surfacing store faithfully reports as siblings. Fix 1 (usage): read-merge-write discipline — writers read the frontier, merge, and write a descendant (pointwise-max vector), collapsing branches; 6 uncoordinated services still fork occasionally — reduced, not eliminated. Fix 2 (architectural): this key's workload — multiple writers, one authoritative value, no tolerance for divergence — is the strong tier's profile, not the AP store's: move it to a linearizable register (consensus-backed config store), or funnel writes through one owning service (single-writer discipline, unit 4's per-key lane applied organizationally). Trade: fix 2 costs the config write path availability during partitions — for configuration, almost always the right side (unit 2's map: config is nearer 'revocation' than 'cart'). Principle: chronic siblings mean the key's requirements don't match the store — listen, don't just merge harder.",
                  "hint": "Siblings = concurrency the design generated. Ask: does this KEY's product requirement tolerate divergence at all — and if not, why is it in an AP store?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u5l3-i1",
              "front": "Sloppy quorum + hinted handoff — what do they buy and break?",
              "back": "Writes land on the first N REACHABLE nodes (overflow nodes hold hinted replicas, delivered on recovery): W stays achievable through failures — write-availability. Broken: W+R>N overlap is no longer certain during the failure-to-handoff window (membership stretched past N)."
            },
            {
              "id": "u5l3-i2",
              "front": "Version vectors — what do the two comparison outcomes mean?",
              "back": "V < V′ ⟺ V's write is in V′'s causal history → superseded, discard. Incomparable ⟺ concurrent writes (neither saw the other) → keep both as siblings, surface for resolution. Mechanical causality, no clocks."
            },
            {
              "id": "u5l3-i3",
              "front": "The three conflict-resolution policies and when each is legitimate?",
              "back": "Application merge (domain has a merge: set-union carts + deletion tombstones, CRDT-ish counters); LWW (ONLY where dropping a concurrent write is priced: sessions, presence — it's silent data loss with clock-skew bias); surface to user (they must arbitrate). Chosen per key-type, at design time, with an owner."
            },
            {
              "id": "u5l3-i4",
              "front": "How does a sibling conflict actually END?",
              "back": "A write made after reading all siblings carries the pointwise-max vector +1 in its coordinator slot — strictly dominating every sibling → all are superseded and GC'd. Resolution = writing the merged descendant."
            },
            {
              "id": "u5l3-i5",
              "front": "Read repair vs anti-entropy — the division of labor?",
              "back": "Read repair: reads that see stale replicas write back the superseding version — converges HOT keys (read-often = repaired-often). Anti-entropy: periodic Merkle-tree range comparison ships diffs — converges COLD keys at cost ∝ divergence. Together: bounded drift, the reconciliation template as a protocol."
            },
            {
              "id": "u5l3-i6",
              "front": "What operations is a Dynamo-style store the wrong tool for?",
              "back": "Multi-key atomic invariants (trades, transfers, uniqueness across keys) and single-authoritative-value multi-writer keys (config): no cross-key transactions, and chronic siblings signal a strong-tier workload. Route those to the transactional/consensus tier; keep per-key, merge-able state in the AP store."
            }
          ]
        },
        {
          "id": "u5l4",
          "title": "The Rate Limiter",
          "estMinutes": 25,
          "builds_on": [
            "u1l4",
            "u4l1",
            "u4l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The promise the contract made",
              "body": "Unit 1's API contract promised `429 Too Many Requests` with `Retry-After`; unit 3's incident review showed retry storms amplifying an outage; unit 4's backpressure menu kept saying 'reject at the door.' All three point at the same missing component: the **rate limiter** — the mechanism that decides, per client and per resource, whether this request is admitted now, and that turns overload from a cascade into a clean, retryable refusal.\n\nTwo distinct requirements hide under one name, and extracting which one you're building is the unit-1 discipline applied once more. **Protection** (load shedding): keep the system alive under aggregate overload — limits are set near capacity, tuned by the arithmetic of units 1 and 4, and fairness matters less than survival. **Quota** (product policy): each API key bought 1,000 requests/hour — limits are a business contract, exactness and per-client fairness matter, and the numbers come from pricing, not capacity. The same algorithms serve both, but every parameter decision — how strict, how burst-tolerant, what happens at the boundary — answers to which requirement is in force. This lesson builds the algorithms (with the one theorem that governs them), then the distributed enforcement problem, which is unit 4's check-then-act race wearing a uniform."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The four algorithms",
              "statement": "**Token bucket**: a bucket holds up to B tokens, refilled at rate r tokens/s; a request consumes one token or is rejected. Admits sustained rate r with bursts up to B. **Leaky bucket**: requests join a queue drained at fixed rate r — output is perfectly smooth; bursts wait (or overflow) rather than pass. **Fixed window**: count requests per clock window (e.g. per minute); reject beyond the cap. Cheap, but the window boundary admits ~2× the cap in a straddling burst. **Sliding window**: count requests in the trailing interval (exactly, via a log of timestamps — memory per request; or approximately, by weighting the previous window's count — the standard practical compromise). Token bucket is the default for API limiting (bursts are usually desirable); leaky bucket where downstream demands smoothness; sliding-window approximations where per-key memory must stay O(1) and boundary exactness matters."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "The token-bucket admission bound",
              "statement": "A token bucket with rate r and capacity B, starting full, admits over ANY interval of length T at most\n\n  A(T) ≤ r·T + B\n\nrequests — sustained throughput asymptotically r, with excess bounded by the constant B regardless of the traffic pattern. Conversely, any client sending at most r sustained with bursts ≤ B is never rejected.",
              "proof": "Token conservation. Over an interval of length T, the bucket gains exactly r·T tokens from refill (refill is continuous at rate r, capped — capping only reduces gains) and began with at most B tokens. Every admitted request consumes one token, and token count never goes negative: admissions ≤ initial tokens + tokens gained ≤ B + r·T. For the converse: a client whose cumulative sends over every interval [s, t] satisfy sends ≤ r(t−s) + available-burst never finds the bucket empty — formally, if arrivals A(s,t) ≤ r(t−s) + B − (B − tokens(s)) for all intervals, induction on request times shows tokens stay ≥ 0 at each admission. ∎\n\nThe two readings of B: to the *protection* designer, B is the spike your downstream absorbs above sustained rate — set it from the burst arithmetic of unit 4 (what backlog can the fleet drain within its grant?); to the *quota* designer, B is product friendliness — how big a batch a well-behaved client may fire after idling. And the bound's 'ANY interval' clause is exactly what fixed windows lack: the fixed-window cap holds per window but 2× it can pass in an interval straddling two — the boundary bug, worked next."
            },
            {
              "type": "example",
              "heading": "Worked example: parameters from requirements, and the boundary bug in numbers",
              "body": "**Setting (r, B) for protection**: an internal search service sustains 8 k QPS comfortably and can absorb brief spikes to 12 k (queueing headroom from unit 4's arithmetic: at 12 k in / 8 k served, backlog grows 4 k/s and the p99 budget tolerates ~2 s of that ≈ 8 k queued). Gateway-enforced bucket per the whole service: r = 8,000/s, B = 8,000 — sustained load capped at capacity, worst admitted excess (the theorem) = B = one drainable second of overload. Per-client sub-buckets (say r = 100/s, B = 200 each) keep one bad client from consuming the aggregate.\n\n**Setting (r, B) for quota**: a paid tier sells 3,600 requests/hour — r = 1/s. B encodes burst friendliness: B = 1 forces perfectly-spaced requests (hostile: a page load firing 20 calls fails); B = 100 lets an idle client burst a batch, still bounded by r·T + 100 over any window. Product picks B; the theorem prices it.\n\n**The fixed-window boundary bug**: cap 600/minute, windows on clock minutes. A client sends 600 requests in 11:00:30–11:00:59 (window A: at cap, all admitted) and 600 more in 11:01:00–11:01:29 (window B: fresh count, all admitted): **1,200 requests in 59 seconds** — 2× the intended rate, entirely legal to the counter. A token bucket with r = 10/s, B = 600 admits at most 10×59 + 600 = 1,190… ≈ the same? No — the bucket *started* the burst window with ≤ 600 tokens and refills only 590 over the 59 s: ≤ 1,190 admitted *only if fully idle before*; the crucial difference is the bound applies to **every** interval, so the client cannot repeat the trick each boundary — sustained rate converges to r, while fixed windows re-arm the full cap every minute. The bug matters when limits protect real capacity: a downstream sized for 600/min receives 1,200 — the difference between a limiter and a suggestion."
            },
            {
              "type": "code",
              "heading": "Distributed enforcement: the atomic bucket (Redis + Lua)",
              "lang": "text",
              "code": "-- Naive gateway code (BROKEN — the check-then-act race, unit 4):\n--   tokens = GET bucket:{key}          -- gateway A reads 1, gateway B reads 1\n--   if tokens > 0: DECR; admit        -- both decrement: 2 admitted on 1 token\n\n-- Fix: the read-refill-judge-decrement must be ONE atomic step at the store.\n-- Redis executes a Lua script atomically — the whole script is the critical section:\n\n-- KEYS[1] = bucket key; ARGV = [rate r, capacity B, now_ms, cost]\nlocal b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')\nlocal tokens = tonumber(b[1]) or ARGV[2]          -- start full\nlocal ts     = tonumber(b[2]) or ARGV[3]\n-- lazy refill: credit elapsed time at rate r, capped at B\ntokens = math.min(ARGV[2], tokens + (ARGV[3] - ts) * ARGV[1] / 1000)\nlocal allowed = tokens >= tonumber(ARGV[4])\nif allowed then tokens = tokens - ARGV[4] end\nredis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', ARGV[3])\nredis.call('PEXPIRE', KEYS[1], 60000)             -- idle buckets self-clean\nreturn allowed\n\n-- Properties: no separate refill job (refill computed lazily from elapsed time);\n-- one round trip per decision; per-key atomicity = per-key serialization (unit 4's\n-- lane discipline, provided by the store). Shard buckets across Redis nodes by key\n-- via the ring (unit 2) — each key's decisions serialize at ITS shard."
            },
            {
              "type": "text",
              "heading": "Where enforcement lives, and what failure does",
              "body": "**Placement**: limits belong at the outermost layer that can identify the key — the API gateway/edge for per-client limits (reject before the request costs interior resources; a rejected request that reached the database already spent what limiting exists to protect), with interior per-service buckets as defense in depth (unit 4's backpressure at each door). **The latency tax**: a central atomic bucket adds a round trip per request (~0.5 ms in-DC — the unit-1 table; fine at the gateway, painful per interior hop), which motivates the standard hybrid: **local buckets with divided rate** (each of G gateways gets r/G locally — zero added latency, but skewed traffic under-admits some clients while the aggregate stays safe) or **async-synced local buckets** (admit locally, reconcile counts to the store every ~100 ms — bounded overshoot ≈ aggregate rate × sync interval, priced explicitly). Protection tolerates these approximations happily; strict quota billing tolerates them less, which is again the two-requirements split deciding the mechanism. **Failure policy**: when the limiter's store is unreachable, the gateway must choose **fail-open** (admit unlimited — protection gone; right when the limiter guards revenue-costing quota but the service can survive traffic) or **fail-closed** (reject; right when the limiter is the last defense before a fragile downstream — and catastrophically wrong for, say, login endpoints during the limiter's own outage). Per-endpoint choice, in the design doc, decided before the incident. **Response semantics**: 429 + `Retry-After` (honest hint from bucket state: time until a token), and rate-limit headers so well-behaved clients self-pace — the contract half of the component, closing the loop unit 1 opened."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**A limiter that isn't atomic is a limiter that lies under load — precisely when it matters.** The check-then-act race admits over-limit exactly during traffic spikes (many concurrent checks against one count), so testing at low traffic proves nothing. And a limiter without a stated failure policy is an incident script: the store hiccups, every gateway silently fails open, and the downstream the limiter guarded discovers the fact from its own collapse. Atomicity at the store, failure policy per endpoint, both tested — the three sentences the design review must extract."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A token bucket has r = 50/s, B = 300, currently full. A client fires 400 requests instantly, then sustains 80/s for 10 s, then stops for 20 s, then fires 400 instantly again. Compute admissions at each phase (show token arithmetic) and total, then verify against the theorem's bound for the whole 30-ish-second episode.",
                  "solution": "Phase 1 (instant 400): 300 tokens available → **300 admitted**, 100 rejected; tokens = 0. Phase 2 (80/s for 10 s): refill 50/s while draining attempts at 80/s — tokens never accumulate; admissions = refill = 50/s × 10 = **500 admitted**, 300 rejected; tokens ≈ 0. Phase 3 (idle 20 s): refill 50 × 20 = 1,000, capped at B → tokens = 300. Phase 4 (instant 400): **300 admitted**, 100 rejected. Total admitted = 300 + 500 + 300 = **1,100** over T ≈ 30 s. Bound check: r·T + B = 50 × 30 + 300 = 1,800 ≥ 1,100 ✓ (the bound is loose here because phase-3 idling wasted 700 tokens of refill against the cap — the cap is what makes the bound hold for EVERY interval: without it, idle hoarding would let a client bank unbounded burst). The rhythm to internalize: bursts spend B, sustained overrate clips to r, idling restores at most B — the three behaviors clients actually experience.",
                  "hint": "Track the token count through each phase; refill accrues at r but never past B."
                },
                {
                  "prompt": "A public API enforces 1,000 req/min per key with fixed windows and documents it as 'max ~17 req/s'. A downstream partner service is sized for exactly 2,200 req/min of one key's traffic. Construct the legal traffic pattern that breaks the partner, then fix with a token bucket whose parameters keep the documented experience but honor the partner's ceiling.",
                  "solution": "Break: the boundary bug, doubled — a client sends 1,000 requests in the last second of window 1 (legal: window 1's count caps at 1,000) and 1,000 in the first second of window 2 (fresh count, legal): **2,000 requests in ~2 seconds**, and over the two-minute span 2,000 requests — but concentrated so the partner sees a ~1,000/s spike and, over any 60 s interval straddling the boundary, 2,000 requests — near the partner's 2,200/min ceiling in half the time, with the spike far beyond any per-second sizing. Repeatable every window boundary. Fix: token bucket r = 1,000/60 ≈ 16.7/s (the documented sustained rate), B chosen from the partner's tolerance: the theorem gives any-interval admissions ≤ r·T + B; for T = 60 s, r·T ≈ 1,000, so B ≤ 1,200 keeps every 60 s window ≤ 2,200. Choose B ≈ 300–600 for burst friendliness with margin (max 60 s window: 1,300–1,600; max instantaneous spike: B itself, vs 1,000 before). Client-visible behavior: same sustained 1,000/min, bursts up to B pass, boundary exploit gone — because the bound holds over EVERY interval, not per clock window. Document B; the partner sizes to r·60 + B by contract instead of folklore.",
                  "hint": "Fixed windows re-arm at each boundary; the bucket's bound is interval-uniform. Solve r·60 + B ≤ 2,200 for B."
                },
                {
                  "prompt": "A login endpoint is limited 5 attempts/min per account (credential-stuffing defense). During a limiter-store outage, ops must pick fail-open or fail-closed. Argue the choice — then design the third option that dissolves the dilemma, using components this course has built.",
                  "solution": "The dilemma: fail-open removes the only brake on credential stuffing exactly when attackers can detect it (limiter outages are observable via timing) — a security regression at the worst moment; fail-closed locks every user out of login because a Redis node died — an availability catastrophe on the front door, and itself a denial-of-service amplifier. Neither is acceptable for THIS endpoint (protection and quota reasoning both fail: it's a security control). Third option — degrade to local approximate limiting: each gateway falls back to an in-process bucket with the per-account rate divided by gateway count (r/G, the hybrid from the lesson): no store round trip, survives the outage entirely locally. Under-division skew is acceptable here because the control is a THRESHOLD defense, not billing: even G-way over-admission (worst case all gateways see the same account: 5/min × G/G… bounded by 5/min aggregate if divided, or 5/min per gateway = 5G/min worst case if not divided — choose divided-with-jittered-allowance, e.g. ceil(5/G)+1) keeps stuffing rates within an order of magnitude of intended — versus unlimited (fail-open) or zero (fail-closed). Add: alert on fallback engagement, and reconcile counts to the store when it returns. The general design lesson: for security-shaped limits, the failure policy question is a false binary — the answer is a degraded local enforcement mode, pre-built and tested, because approximate limiting beats both extremes by orders of magnitude.",
                  "hint": "What does each failure mode cost for THIS endpoint's threat model? Then: what did the 'local buckets with divided rate' hybrid already give you?"
                },
                {
                  "prompt": "Design the complete limiting scheme for Lens's public API (mobile + third-party apps): name the key hierarchy (what gets a bucket), pick algorithm + placement per level, set the failure policy per class, and specify what the client experiences at each limit — citing the contract machinery of unit 1.",
                  "solution": "Key hierarchy, outermost first: (1) **per-IP** coarse abuse ceiling at the edge (r high, B high — catches scrapers and floods before auth; sliding-window-approx acceptable, O(1) memory across millions of IPs); (2) **per-user token** primary fairness bucket at the gateway (token bucket via atomic store: e.g. r = 10/s, B = 100 — bursts for feed refresh + prefetch, sustained bounded); (3) **per-app (API key)** for third-party apps — quota-class (tiered by plan: contractual, tighter accounting — synced buckets, smaller tolerance for approximation); (4) **per-endpoint cost classes** inside the gateway: cheap reads (feed) at the defaults; expensive operations (upload: cost 5 tokens — the Lua script's cost parameter; search: cost 2) drawing from the same user bucket so cost maps to capacity (unit 1's arithmetic: an upload costs the system ~50× a feed page — the bucket should know); (5) **interior service buckets** (protection-class, r from each fleet's measured capacity per unit 4) as defense in depth. Failure policy per class: edge/IP — fail-open (it's a coarse pre-filter; the layers below survive); per-user/per-app at gateway — degrade to local divided buckets (the login exercise's third option; alert on engagement); login/auth endpoints specifically — never fail-open (local fallback mandatory); interior protection buckets — fail-closed toward shedding (they exist to protect fragile downstreams; unit 4's menu). Client experience (unit 1's contract): 429 + `Retry-After` computed from bucket state; `X-RateLimit-Limit/-Remaining/-Reset` headers on every response so well-behaved clients self-pace; documented per tier; idempotent mutations retry safely with their keys after backoff — the limiter and the retry discipline are two halves of one contract. Every number above is a stated, revisable assumption — the deliverable is the hierarchy + policies table, not the specific constants.",
                  "hint": "Layers: IP → user → app-key → endpoint-cost → interior. For each: algorithm, atomicity need, failure mode, and what the 429 carries."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u5l4-i1",
              "front": "Protection vs quota limiting — why extract which you're building?",
              "back": "Protection (load shedding): limits ≈ capacity, from units 1/4 arithmetic; survival over fairness; approximation fine. Quota: limits = business contract (pricing); exactness and per-client fairness matter. Same algorithms, every parameter answers to which requirement."
            },
            {
              "id": "u5l4-i2",
              "front": "Token-bucket bound — statement and B's two readings?",
              "back": "Over ANY interval T: admissions ≤ r·T + B (token conservation). B = the spike downstream must absorb (protection — set from drainable backlog) or burst friendliness sold to clients (quota). 'Any interval' is what fixed windows lack."
            },
            {
              "id": "u5l4-i3",
              "front": "The fixed-window boundary bug?",
              "back": "Cap C per clock window admits ~2C in a burst straddling the boundary (fill end of window A + start of window B), re-armed every boundary — a downstream sized for C/min receives 2C. Token bucket's interval-uniform bound kills the exploit."
            },
            {
              "id": "u5l4-i4",
              "front": "Why must the distributed bucket be atomic, and how?",
              "back": "Check-then-act across gateways over-admits exactly under load (concurrent reads of one count — unit 4's race). Fix: read-refill-judge-decrement as ONE atomic operation at the store (Redis Lua script; lazy refill from elapsed time; per-key serialization at the key's shard)."
            },
            {
              "id": "u5l4-i5",
              "front": "Fail-open vs fail-closed vs the third option?",
              "back": "Fail-open: admit all when the limiter store dies (right where service survives traffic but quota lapses). Fail-closed: reject (right before fragile downstreams; wrong on front doors). Third: degrade to LOCAL divided buckets (r/G per gateway) — approximate enforcement beats both extremes for security-shaped limits. Per-endpoint, pre-decided."
            },
            {
              "id": "u5l4-i6",
              "front": "The limiter's client-facing contract?",
              "back": "429 + Retry-After (computed from bucket state), X-RateLimit-Limit/-Remaining/-Reset headers for self-pacing, documented tiers; retried mutations stay safe via idempotency keys — the limiter and unit 1's retry discipline are two halves of one contract."
            }
          ]
        }
      ],
      "masteryCheck": {
        "id": "u5-check",
        "questions": [
          {
            "id": "u5q1",
            "type": "numeric",
            "prompt": "A URL shortener must address 10¹² links using base62 codes with dense (counter-based) allocation. What is the minimum code length in characters?",
            "answer": 7,
            "tolerance": 0,
            "points": 1,
            "explanation": "Need 62ᴸ ≥ 10¹²: 62⁶ ≈ 5.7×10¹⁰ falls short; 62⁷ ≈ 3.5×10¹² suffices → L = 7. (Random allocation would need the same length judged by a different inequality — occupancy/retry rate — and hash-truncation by the birthday bound at √space: the length question is meaningless before the generation strategy is named.)"
          },
          {
            "id": "u5q2",
            "type": "numeric",
            "prompt": "A token bucket has rate r = 100 tokens/s and capacity B = 500, starting full. By the admission bound, what is the maximum number of requests it can admit over any 10-second interval?",
            "answer": 1500,
            "tolerance": 0,
            "points": 1,
            "explanation": "A(T) ≤ r·T + B = 100 × 10 + 500 = 1,500 — refill contributes r·T, the pre-existing tokens at most B (token conservation). The bound holds over EVERY interval, which is exactly the property fixed windows lack at their boundaries."
          },
          {
            "id": "u5q3",
            "type": "short",
            "prompt": "In a Dynamo-style store, a read returns two versions whose version vectors are {n₁:3, n₂:1} and {n₁:2, n₂:2}. What is the causal relationship between the two writes? (One word.)",
            "accept": [
              "concurrent",
              "concurrency",
              "incomparable",
              "conflicting",
              "siblings"
            ],
            "points": 1,
            "explanation": "Each vector exceeds the other in some slot (n₁: 3>2; n₂: 2>1) — incomparable under the componentwise order, which by the characterization theorem means neither write saw the other: they are concurrent, and both must be kept as siblings for resolution (merge, LWW-if-priced, or surface). A comparable pair would have meant supersession and safe discard."
          },
          {
            "id": "u5q4",
            "type": "mcq",
            "prompt": "A team replaces sequential 64-bit ids with UUIDv4 primary keys on a fast-growing table 'for safety.' Which outcome should they expect?",
            "options": [
              "Insert throughput degrades as the table grows: random keys scatter inserts across the whole B-tree, so the working set becomes the entire index",
              "Collision risk drops to zero and performance is unchanged — 128 bits is simply more of the same",
              "Inserts speed up because random keys spread load evenly across index pages",
              "The change is safe as long as the database uses an LSM engine, since LSMs sort by key at compaction anyway"
            ],
            "answer": 0,
            "points": 1,
            "explanation": "Time-ordered keys append at the B-tree's hot right edge (few resident pages); uniform-random keys land on random leaves — every insert may fault a cold page, and page splits scatter — so throughput degrades as the index outgrows RAM, often 5–10×. Option c is the seductive inversion: 'spreading load' across index pages is precisely the pathology, not a benefit. Option b ignores locality entirely. Option d is half-true folklore: LSMs absorb random inserts better at write time, but sort/compaction costs and read locality still favor time-ordered keys — and the premise (safety) was answerable with structured 64-bit or UUIDv7 without surrendering ordering."
          },
          {
            "id": "u5q5",
            "type": "proof",
            "prompt": "(a) Prove the birthday bound: among k ids drawn independently and uniformly from N possibilities, P(some collision) ≤ k(k−1)/2N. (b) A system mints 10⁹ ids from a 64-bit uniform-random space. Bound the collision probability numerically and give a verdict. (c) Explain why Snowflake-structured 64-bit ids escape this bound entirely, and name the one operational condition under which their uniqueness argument fails.",
            "rubric": [
              "Proves (a) via the union bound over C(k,2) pairs, with the observation that each fixed pair collides with probability exactly 1/N — stated as a proof, not an assertion",
              "Computes (b) correctly: k²/2N ≈ (10⁹)²/(2·2⁶⁴) = 10¹⁸/(3.7×10¹⁹) ≈ 0.027 — roughly a 3% collision probability — with the verdict that this is unacceptable for a correctness-critical id space (silent corruption at percent-level odds)",
              "Explains (c): Snowflake ids are not random draws — the (timestamp, machine, sequence) fields partition the space so distinct ids differ by construction (different machines, or different milliseconds, or different sequence numbers); uniqueness is compositional, and the birthday phenomenon (which arises from independent uniform draws) does not apply",
              "Names the failure condition: the clock moving backwards on a machine (NTP step) re-mints already-used (timestamp, sequence) pairs — uniqueness depends on per-machine timestamp monotonicity, defended by wait-past-high-water-mark or refuse-and-alert (cross-machine skew, by contrast, harms only sort order)"
            ],
            "solution": "(a) There are C(k,2) = k(k−1)/2 unordered pairs. For any fixed pair, the second id equals the first with probability exactly 1/N (uniformity and independence). The event 'some collision' is the union of the pair events; by the union bound its probability is at most the sum: k(k−1)/2 · 1/N. ∎ (b) k = 10⁹, N = 2⁶⁴ ≈ 1.8×10¹⁹: P ≤ (10⁹)²/(2 × 1.8×10¹⁹) = 10¹⁸/3.7×10¹⁹ ≈ 0.027 — about a **3% chance of at least one collision**, i.e. at billion-id scale a 64-bit random scheme is gambling with silent corruption at odds no serious system accepts (and the next billion ids push it further). Verdict: unusable; either widen to 128 random bits (P ≈ 10⁻²¹) or structure the 64 bits. (c) Snowflake ids are deterministic, not sampled: two ids from different machines differ in the machine field; two from one machine in different milliseconds differ in the timestamp; two from one machine in one millisecond differ in the sequence (incremented serially). Distinctness holds by construction for every pair — there are no random draws for the birthday phenomenon to act on; the 'bound' is P = 0, not a probability estimate. The uniqueness argument's one operational premise is per-machine timestamp monotonicity: if a machine's clock steps backwards (NTP correction), it re-enters already-minted milliseconds with a reset sequence and can reproduce exact ids. Defense: hold a high-water mark and wait (or refuse) whenever now < last — trading a brief availability stall for uniqueness, the correct direction. Cross-machine skew never threatens uniqueness (the machine field partitions), only sort quality. ∎",
            "points": 3,
            "explanation": "The three parts carry the lesson's full argument: the bound (why √N is a random scheme's true capacity), the numbers (why 64 random bits fail at real scale), and the structural escape (why Snowflake's uniqueness is a construction, not a probability — with the clock as its single load-bearing assumption)."
          },
          {
            "id": "u5q6",
            "type": "open",
            "prompt": "Configure a Dynamo-style KV store (N, W, R, sloppy vs strict quorums, conflict resolution, and the read-path session guarantee) for each of two workloads, then answer the shared operational question. Workload A: a device-state store for a smart-home platform — each device's state document (~2 KB) is written by that device's connection handler on every state change (single writer per key in normal operation) and read by the owner's app; a stale read briefly shows a light 'on' that is off; a lost write means the app disagrees with the physical device until its next heartbeat (self-healing within 30 s). Workload B: a collaborative shopping-list store — lists are edited concurrently by family members on separate devices, offline edits sync later, and losing anyone's added item is a visible product failure. Operational question: for each workload, what does the store do during a network partition that isolates one replica, and what does the user experience?",
            "rubric": [
              "Workload A configured for latency/availability with waived guarantees priced: N=3 (durability), W=1 (device writes ack fast; heartbeat self-healing makes lost-write cost explicit and bounded), R=1, sloppy quorums on, LWW resolution justified BY the single-writer structure (concurrency structurally rare) and the 30 s self-heal — with the stale-read cost tied to the stated product tolerance",
              "Workload B configured for conflict correctness: N=3, W=2/R=2 (overlap under normal operation), sloppy quorums for offline-tolerant availability, version vectors with APPLICATION MERGE (set union + per-item deletion tombstones) — LWW explicitly rejected because concurrent offline edits are the normal case and silent loss is a stated product failure",
              "Session guarantees placed correctly: A needs read-your-writes for the controlling app after its own command (pin to coordinator or vector-floor read) so the user sees their own toggle; B needs read-your-writes per device plus monotonic reads so a synced list never regresses — each tied to the visible anomaly it prevents",
              "Partition behavior reasoned per configuration: A — isolated replica accepts W=1 writes (sloppy) and serves R=1 reads: divergence possible, healed by handoff/read-repair + device heartbeat; user may briefly see stale state (priced). B — both sides keep accepting edits (availability chosen deliberately); on heal, vectors mark offline edits concurrent → merge unions items; users see everyone's items appear, no data lost — with tombstones preventing deleted-item resurrection",
              "Demonstrates the unit's meta-skill: identical machinery, opposite knob settings, every choice traced to a stated product cost (what a lost write / stale read / conflict costs THIS product) rather than to defaults"
            ],
            "solution": "**Workload A (device state)**: N=3 for durability of last-known state; **W=1, R=1**, sloppy quorums. Rationale: the writer is structurally single (the device's own handler), so write-write concurrency is rare — version conflicts arise mainly from retry/failover races, and **LWW is acceptable**: the discarded write's cost is a transient mismatch that the 30-second heartbeat re-converges (the product self-heals by re-writing truth), and that cost is stated and accepted. W=1 keeps state changes snappy and available through failures; R=1 keeps app reads instant; the waived overlap guarantee costs at most a briefly stale toggle — explicitly priced against the product's own tolerance ('shows on when off, briefly'). Session guarantee: after the app itself issues a command, it must see the result — read-your-writes via pinning the app's next reads to the write coordinator (or a version floor carried in the session) for a few seconds; without it the user toggles a light and watches the UI disagree — the one anomaly this product can't shrug off. **Workload B (shared lists)**: N=3, **W=2, R=2**, sloppy quorums (offline devices and partitions are the normal case — the store must accept edits at whatever replicas are reachable), **version vectors + application merge**: lists merge as item-set union, with per-item deletion tombstones (an item removed on one device must not resurrect when another device's older copy syncs — the zombie rule). LWW rejected in writing: concurrent edits are the product's central scenario, and silently dropping a family member's added item is the named failure. Read path: read-your-writes + monotonic reads per device (vector floors — a device that saw version V never renders an older list). **Partition (one replica isolated)**: A — the isolated side still takes W=1 writes and serves R=1 reads: the two sides can diverge; on heal, hinted handoff + read repair converge, LWW picks a survivor, and any wrongness is erased by the next device heartbeat; user experience: possibly a stale tile for seconds. B — both sides accept edits (that IS the design: availability during partition was chosen so offline family members can keep adding); vectors record the two branches; on heal the read path sees incomparable siblings and the merge unions them; user experience: the reunited list shows everyone's additions, deletions honored via tombstones — 'nothing anyone did was lost,' which is the requirement the whole configuration served. **Meta**: same ring, same quorums, same vectors — opposite settings, each knob's position traced to what a lost write, stale read, or surfaced conflict costs the specific product; that per-requirement derivation, not the mechanism list, is what the gate grades.",
            "points": 3,
            "explanation": "This question is the unit's thesis in exam form: the Dynamo machine is a tunable space, and competence is shown by deriving opposite configurations from opposite failure costs — plus knowing where the machinery's guarantees end (partition behavior) and what the user actually experiences there."
          }
        ]
      }
    },
    {
      "id": "u6",
      "title": "Canonical Designs II: The Social Graph",
      "summary": "The Lens feed assembled end to end with a freshness-budget ledger, a notification system that doesn't spam, and the counting machinery — sharded counters and sketches — that social scale demands.",
      "intro": "Unit 5 rehearsed the method on self-contained systems; this unit assembles the big one. The news feed has been the course's running thread since Lens was scoped — its requirements extracted in unit 1, its tables sharded in unit 2, its caches and read models built in unit 3, its fan-out machinery and delivery guarantees settled in unit 4. The first lesson finally puts every piece on one whiteboard: the complete feed architecture, with a freshness-budget ledger that allocates the 10-second grant across pipeline stages and a degradation ladder for the days when components fail. The second lesson designs the system that tells users about all this activity — notifications — where the hard problems are not throughput but restraint: collapsing, preferences, and the spam death spiral that kills products. The third builds the counting layer social products live on: sharded counters for hot objects, and the count-min sketch — with its error bound proved — for finding the heavy hitters in a firehose. The gate asks you to assemble, budget, and degrade these designs at new coordinates.",
      "references": [
        "Raffi Krikorian — Timelines at Scale (QCon 2012)",
        "Alex Xu — System Design Interview vol. 1 ch. 11 (news feed), vol. 2 (notification system, ad-click aggregation)",
        "Bronson et al. — TAO: Facebook's Distributed Data Store for the Social Graph (USENIX ATC 2013)",
        "Cormode & Muthukrishnan — An Improved Data Stream Summary: The Count-Min Sketch and its Applications (J. Algorithms, 2005)",
        "Nishtala et al. — Scaling Memcache at Facebook (NSDI 2013)"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u6l1",
          "title": "The News Feed, End to End",
          "estMinutes": 28,
          "builds_on": [
            "u4l3",
            "u3l1",
            "u1l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Everything on one whiteboard",
              "body": "This lesson is the design review the course has been preparing for: Lens's feed at 100 M DAU, every component in one picture, every arrow defensible. The requirements ledger, carried since *Scoping Lens* and *Lens by the numbers*, scaled to the horizon: 500 M feed loads/day (15 k/s peak), 10 M posts/day (300/s peak), reads 150:1 over writes; p99 feed load < 500 ms; followers see a post within ~10 s; the poster sees their own post immediately (read-your-writes); durability absolute on uploads; blocks and unfollows enforced at read time.\n\nWhat makes this lesson more than a recap is the discipline of **budget allocation**. Two budgets govern the whole design — the 500 ms latency budget on the read path, and the 10 s freshness budget on the write path — and every component consumes a slice of one or both. A design that names its components but not their budget slices is unfalsifiable: nobody can say whether it meets its SLOs until production says no. So the lesson's deliverables are two ledgers — latency and freshness, stage by stage — plus the degradation ladder: what the feed serves when each component is down, decided now rather than at 3 a.m."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The freshness budget ledger",
              "statement": "For a pipeline that must make a write visible to readers within a grant G (Lens: G = 10 s), the **freshness budget ledger** assigns each sequential stage i a budget bᵢ — its worst tolerated contribution to end-to-end lag — such that Σ bᵢ ≤ G. Stage lags are: commit-to-log lag (outbox/CDC tailing), queue wait (the burst arithmetic of unit 4 at the fan-out consumers), fan-out execution (per-post work / fleet rate), and read-side staleness (cache TTLs on the feed list or its hydration). Each budget is then a *monitorable obligation*: stage i alerts when its measured p99 lag approaches bᵢ — converting the product grant into per-team, per-component operational contracts."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Lag composes additively; budgets must too",
              "statement": "If a post becomes visible only after passing sequential stages 1…k, and stage i delays it by Lᵢ, then end-to-end lag L = Σ Lᵢ — and therefore (i) meeting the grant on every post requires Σ (worst-case Lᵢ) ≤ G, and (ii) it does NOT suffice that each stage's p99 be under G/k on average traffic: any stage's excursions (a queue burst, a hot fan-out job) consume other stages' slack, so budgets must be allocated against each stage's worst *sustained* case (unit 4's burst theorem per stage), with explicit headroom.",
              "proof": "(Additivity) The post is unavailable to readers until every stage completes; stages are sequential, so completion time is the sum of stage completion times, and lag past commit is Σ Lᵢ by construction. (i) follows: if each worst case is bounded by bᵢ and Σ bᵢ ≤ G, then L ≤ G on every path through the pipeline. (ii) Take k = 2 stages each with p99 = G/2: the pipeline's p99 is NOT bounded by G — the 1% tails need not coincide, and worse, stage lags are positively correlated under shared load (the same traffic burst inflates queue wait AND fan-out time), so P(L > G) can far exceed either stage's tail alone. Only worst-sustained-case budgeting — each stage's burst-theorem excursion bound, summed — yields a guarantee rather than a hope. ∎\n\nThe practical force of (ii): when the ledger doesn't close (Σ worst cases > G), the design must either buy capacity (shrink a stage's excursion by fleet size — unit 4's arithmetic), restructure (remove a stage from the sequential path), or renegotiate G — the same three options every budget shortfall in this course has offered, and the ledger is what makes the shortfall visible before launch."
            },
            {
              "type": "example",
              "heading": "Worked example: the write path, stage by stage",
              "body": "A post commits (photo row + outbox in one transaction — unit 3's atomicity). The ledger allocates the 10 s grant:\n\n**Stage 1 — log tailing** (outbox → `photo-events`): normal lag tens of ms; worst sustained case = tailer restart/failover ≈ 2 s. Budget b₁ = 2 s. **Stage 2 — queue wait at fan-out dispatch**: unit 4's burst arithmetic — peak post bursts (a global moment: 3× posting spike for minutes) against dispatcher capacity; sized so worst backlog delay ≤ 2 s. Budget b₂ = 2 s. **Stage 3 — fan-out execution**: per-post work capped at F* = 200 k inserts (unit 4's threshold derivation: 200 k at 10% share of a 200 k/s fleet ≈ 10 s — wait, that consumed the whole grant; re-derive: the ledger forces F* smaller or the fleet share larger — take F* = 100 k at 20% share of 200 k/s = 2.5 s worst). Budget b₃ = 3 s. **Stage 4 — read-side staleness**: the reader's next feed load must see the new entry — feed lists are read directly (no TTL cache on the list itself; it IS the store), but celebrity pulls ride a micro-TTL ≤ 2 s and hydration caches are invalidation-free content-addressed (unit 3: zero staleness). Budget b₄ = 2 s. **Ledger: 2+2+3+2 = 9 s ≤ 10 s ✓** with 1 s unallocated headroom.\n\nNote what the ledger *did*: it re-derived F* — the fan-out threshold fell out of the freshness budget, not folklore (unit 4 derived it from fleet fairness; the two derivations must both hold, and the binding one wins). And the poster's own view rides none of this: read-your-writes is served by writing the poster's own feed list synchronously at commit (one insert — their list, their post) plus session pinning for the profile page (unit 2) — the 'immediately' requirement satisfied outside the async pipeline entirely, which is why it never appears on this ledger."
            },
            {
              "type": "example",
              "heading": "Worked example: the read path against 500 ms",
              "body": "A feed load at p99, budgeted (the latency ledger — in-DC round trips ~0.5–1 ms from unit 1's table):\n\n**Edge + TLS + routing**: ~100 ms of the budget belongs to the network before Lens's servers see the request (cross-region user → nearest front door; the media itself comes from CDN edges — unit 3's geography work). **Feed assembly** (~150 ms allocated): fetch the user's feed list (one sharded memory-store read, ~1 ms; p99 with hedging ~5 ms) + celebrity merge (2–10 cached author-list probes, coalesced, ~2 ms) + read-time filter (blocks/unfollows/audience — an in-memory set probe per entry against the block cache, microseconds each; the revocation rule's standing cost) + cursor slice (unit 1's pagination on the merged list). **Hydration** (~100 ms allocated): 20 photo-metadata fetches — cache-aside tier at h ≈ 0.98 (unit 3's per-object caching): expected ~0.4 shard reads per load; p99 = the probability-of-any-miss tail, hedged. Like counts ride the metadata objects (micro-TTL — unit 3's counts row). **Response assembly + serialization**: ~20 ms. Ledger total ≈ 370 ms at p99 against 500 — closing with headroom, each line monitorable.\n\nThe rendition bytes themselves never touch this path (CDN, content-addressed, ~25 ms RTT for users near a PoP — the images *arrive* after the JSON, progressively). The two ledgers together are the feed's operational contract: freshness owned stage-by-stage by the write-path teams, latency line-by-line by the read-path teams, every line with a number, an owner, and an alert threshold."
            },
            {
              "type": "diagram",
              "kind": "graph",
              "directed": true,
              "height": 340,
              "caption": "The Lens feed at the horizon — every box paid for by a unit of this course: outbox+log (u3/u4), hybrid fan-out with F* (u4), sharded feed lists and caches on the ring (u2/u3), read-time filters for revocation (u2), CDN for bytes (u3). Solid = read path (500 ms ledger); dashed = write path (10 s ledger).",
              "nodes": [
                {
                  "id": "post",
                  "label": "Post commit",
                  "sub": "+ outbox",
                  "x": 5,
                  "y": 15,
                  "tone": "gold"
                },
                {
                  "id": "log",
                  "label": "Event log",
                  "x": 24,
                  "y": 15,
                  "tone": "sage"
                },
                {
                  "id": "fan",
                  "label": "Fan-out fleet",
                  "sub": "F ≤ F*",
                  "x": 44,
                  "y": 15
                },
                {
                  "id": "lists",
                  "label": "Feed lists",
                  "sub": "capped, ring-sharded",
                  "x": 66,
                  "y": 15,
                  "tone": "sage"
                },
                {
                  "id": "clists",
                  "label": "Celebrity lists",
                  "x": 44,
                  "y": 42,
                  "tone": "sage"
                },
                {
                  "id": "reader",
                  "label": "Reader",
                  "x": 5,
                  "y": 78,
                  "tone": "gold"
                },
                {
                  "id": "api",
                  "label": "Feed API",
                  "sub": "assemble + filter",
                  "x": 30,
                  "y": 78
                },
                {
                  "id": "hydr",
                  "label": "Hydration cache",
                  "sub": "metadata h≈0.98",
                  "x": 56,
                  "y": 78,
                  "tone": "sage"
                },
                {
                  "id": "blocks",
                  "label": "Block/audience cache",
                  "x": 30,
                  "y": 52,
                  "tone": "rust"
                },
                {
                  "id": "cdn",
                  "label": "CDN",
                  "sub": "renditions",
                  "x": 80,
                  "y": 78,
                  "tone": "sage"
                }
              ],
              "edges": [
                {
                  "from": "post",
                  "to": "log",
                  "dashed": true,
                  "label": "b₁=2s"
                },
                {
                  "from": "log",
                  "to": "fan",
                  "dashed": true,
                  "label": "b₂=2s"
                },
                {
                  "from": "fan",
                  "to": "lists",
                  "dashed": true,
                  "label": "b₃=3s",
                  "bold": true
                },
                {
                  "from": "log",
                  "to": "clists",
                  "dashed": true
                },
                {
                  "from": "reader",
                  "to": "api",
                  "label": "GET /feed"
                },
                {
                  "from": "api",
                  "to": "lists",
                  "label": "1 fetch",
                  "bold": true
                },
                {
                  "from": "api",
                  "to": "clists",
                  "label": "merge"
                },
                {
                  "from": "api",
                  "to": "blocks",
                  "label": "filter",
                  "tone": "rust"
                },
                {
                  "from": "api",
                  "to": "hydr",
                  "label": "20 fetches"
                },
                {
                  "from": "reader",
                  "to": "cdn",
                  "label": "bytes",
                  "tone": "sage"
                }
              ]
            },
            {
              "type": "text",
              "heading": "Ranking: the feed becomes a read model of a read model",
              "body": "Chronological assembly is where every feed starts; ranked feeds ('most relevant first') change the *shape* but not the architecture. Ranking needs candidate features — recency, affinity between reader and author, engagement velocity (the counting layer of lesson 3) — scored by a model at render time. The architectural decision is the same precompute inequality as always (unit 3): score-at-read (flexible, costs a model inference over ~200 candidates inside the latency ledger — tens of ms on a warmed scorer; the standard choice) versus score-at-write (bakes scores into the list — cheap reads, but scores go stale as engagement accumulates, and per-reader personalization multiplies the keyspace: the same trap as the mutual-followers exercise). Production systems converge on: candidates from the precomputed lists (cheap), features from the counting layer (lesson 3's bucketed counters, cache-served), scoring at read within an explicit latency line item, with a fallback to chronological when the scorer is slow or down. The design lesson is the through-line of the whole course: ranking did not add architecture — it added a consumer of existing read models plus one budgeted stage, and the fallback to the un-ranked feed is the degradation ladder's next rung, pre-built."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**The degradation ladder is part of the design, not the incident review.** Feed-list store degraded → serve the rate-bounded fan-out-on-read fallback from caches (unit 4's exercise arithmetic: bounded, partial, cache-first — never the raw scatter). Scorer down → chronological. Counting layer down → hide counts, serve content. Hydration cache cold → shed to shorter feeds (10 items, not 0). Block cache unreachable → **fail closed on filtering** (serve nothing you can't clear — the one rung where degrading means refusing, because the revocation rule outranks availability). Each rung named, each tested in a game day; a feed that has never rehearsed its ladder has an availability number it hasn't earned."
            },
            {
              "type": "decision",
              "heading": "Every component, and the requirement that pays for it",
              "rows": [
                [
                  "Outbox + partitioned log",
                  "Durable ordered change record — atomicity of commit + event (u3/u4)"
                ],
                [
                  "Fan-out fleet with F* threshold",
                  "10 s freshness grant at 150:1 read dominance (work equation + ledger)"
                ],
                [
                  "Capped per-user feed lists (ring-sharded memory store)",
                  "One-fetch reads inside the 500 ms ledger; memory bounded at ~1.3 TB"
                ],
                [
                  "Celebrity pull path + coalesced author-list caches",
                  "Power-law F: caps per-post work; hottest keys cache-perfect"
                ],
                [
                  "Read-time block/audience filter (fail-closed)",
                  "Revocation rule — precomputed copies may be wrong, the product never lies"
                ],
                [
                  "Hydration cache tier (h ≈ 0.98)",
                  "20 metadata fetches × 15 k loads/s against shard read capacity"
                ],
                [
                  "CDN + content-addressed renditions",
                  "2 PB/day of bytes + global 500 ms — geography and offload"
                ],
                [
                  "Synchronous self-insert + session pin for poster",
                  "Read-your-writes without touching the async pipeline"
                ],
                [
                  "FoR fallback, rate-bounded, cache-first",
                  "Degradation: list-store outage serves partial feeds, not blank ones"
                ]
              ]
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Re-run the freshness ledger for a product that tightens the grant to G = 3 s ('near-real-time feed'). Using the lesson's stage structure (tailing 2 s / queue 2 s / fan-out 3 s / read-side 2 s as the 10 s allocation), decide what must change at each stage, and identify the stage where the cost grows non-linearly.",
                  "solution": "The old worst cases sum to 9 s — three times the new grant; every stage must shrink. Tailing: 2 s → ~0.5 s means tailer failover must be sub-second — dual tailers with fast leader handoff (paying complexity, feasible). Queue wait: 2 s → 0.5 s means the dispatcher fleet must absorb posting bursts with ¼ the backlog delay — by the burst theorem, headroom must grow so (λ_burst − μ)T/μ ≤ 0.5 s: roughly 4× the burst headroom (linear-ish cost in fleet). Read-side: micro-TTLs on celebrity pulls drop 2 s → 0.5 s — cheap (hit ratio barely moves at these read rates, unit 3's reads-per-window arithmetic). Fan-out execution is the non-linear stage: b₃ = 3 s → 1 s forces F* down ~3× (to ~30–60 k at the same fleet share) — pushing MANY more authors onto the celebrity pull path, whose per-reader merge cost and cache traffic grow with the celebrity count each reader follows; past a point, most content arrives by pull and the architecture inverts toward fan-out-on-read with its scatter costs. The honest answer to product: 3 s is buyable, but the ledger shows the price curve bending at fan-out — and 5 s costs a fraction of 3 s. Exactly the arithmetic-backed negotiation the ledger exists to enable.",
                  "hint": "Scale each stage's mechanism to its new budget; watch which one changes the architecture rather than the fleet size."
                },
                {
                  "prompt": "The read-path ledger allocated 150 ms to assembly including the read-time filter. A user blocks 2,000 accounts (the product allows it), follows 1,500, and their merged candidate list runs 250 entries per load. Estimate the filter's actual cost, explain why it stays inside budget, and name the design choice that makes it O(candidates) rather than O(blocks).",
                  "solution": "The filter answers 'is this entry's author in viewer's block set (or removed audience)?' per candidate: 250 membership probes against an in-memory hash/bloom structure — ~100 ns each (unit 1's RAM reference), ≈ 25 µs total, plus one block-set fetch per load (cached per session or per request: the 2,000-entry set is a few KB — one cache read, ~1 ms). Total ≪ 5 ms of the 150 ms line: invisible. The design choice: the filter iterates the CANDIDATES probing the block set — O(candidates) with O(1) probes — rather than iterating the block list against the feed or, worse, filtering at fan-out time. Fan-out-time filtering would be O(blocks × activity) work that also goes stale (new blocks don't retro-filter pushed entries — the revocation rule again); read-time set-membership is both cheaper and the only CORRECT placement. General rule: revocation filters are made cheap by shaping them as per-candidate membership probes against a per-viewer set that is small, cacheable, and fetched once per request.",
                  "hint": "Count probes per feed load, cost per probe, plus the set fetch. Which direction of iteration keeps it linear in the small quantity?"
                },
                {
                  "prompt": "During a regional event, posting spikes 5× for 30 minutes (1,500 posts/s) while feed loads hold steady. Walk the spike through both ledgers and the degradation ladder: which budgets are threatened, what does the system do if the fan-out fleet saturates, and what do users actually observe at each severity level?",
                  "solution": "Read ledger: untouched — reads are steady, lists still serve one fetch; latency holds (the decoupling dividend of the async design: posting load and reading load are independent paths). Freshness ledger: stage 2 (queue wait) takes the hit — burst theorem: backlog B = (1,500·E[F-work] − fleet rate)·T if sustained arrivals exceed capacity. At 1,500 posts/s × E[F]=200 = 300 k inserts/s offered vs a 200 k/s fleet: backlog grows 100 k inserts/s → 180 M inserts (≈ 15 minutes of extra lag) by spike's end — the 10 s grant is blown badly for posts in the backlog. Severity levels: (1) within headroom (spike ≤ fleet + burst budget): users notice nothing. (2) Backlog growing: delivery lag rises — users see posts arriving minutes late in followers' feeds (posters still see their own instantly — the synchronous self-insert is why this degradation is survivable product-wise); alerting fires on stage-2 lag vs b₂. (3) Saturation response, per the pre-decided ladder: autoscale the fan-out fleet (planned events get pre-scaling); if capped, prioritize — deliver to active-now followers first (a quality-of-service tier inside fan-out), and/or temporarily lower F* so more authors ride the pull path (shifting work to read-time caches, which are underloaded since reads didn't spike). (4) Never: dropping fan-out jobs (a silent permanent hole in specific followers' feeds — the at-most-once failure unit 4 forbade). The exercise's point: the two-ledger structure localizes the spike (freshness suffers, latency doesn't), and every response was a knob the design already had.",
                  "hint": "Which ledger does a POSTING spike touch? Then apply the burst theorem to the stage it hits and walk the ladder."
                },
                {
                  "prompt": "A competitor ships 'edit a post after publishing.' Their feed shows edited posts inconsistently: some followers see the old caption for hours. Diagnose which parts of a hybrid-fan-out feed make edits hard, and design Lens's edit support: what propagates where, which caches are touched, and what the freshness grant for edits should be.",
                  "solution": "Why edits are hard here: the feed pipeline was built on near-immutability — feed LISTS store photo ids (not content: an edit doesn't touch 100 M lists — dodged by design), but the CONTENT lives in (a) the hydration cache (per-object metadata, cache-aside with TTL — stale until invalidated), (b) content-addressed renditions (immutable BY DESIGN — an edited image is a NEW object; old URL never changes), and (c) derived models (search index, hashtag lists — consuming edit events). The competitor's bug is almost certainly (a): no invalidation on edit, TTL measured in hours. Lens design: an edit is an event like any other — `photo_edited` (with version, unit 4's tombstone/versioning discipline) flows the log; consumers: hydration-cache invalidation (delete-on-write, unit 3 — sub-second), search/hashtag re-index (their existing grants), and for image edits, new content-addressed renditions + metadata pointer swap (old CDN copies become unreferenced, not stale — the immutability proposition preserved). Feed lists need nothing (ids unchanged); clients re-render on next load with fresh hydration. Grant extraction: caption edits visible 'within ~30 s' (one invalidation hop + client cache); image replacements 'within minutes' (transcode pipeline — same as new-photo). The design sentence that matters: because lists hold IDS and content is hydrated through invalidatable caches with immutable byte-URLs beneath, an edit touches O(caches) not O(followers) — mutability was contained at design time to the layers that can afford it (unit 3's 'push mutability to the smallest layer', paying off two units later).",
                  "hint": "Ask what each layer stores: ids, metadata, or bytes. Which layer would have to change per-follower, and how did the design avoid putting content there?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u6l1-i1",
              "front": "The two ledgers every feed design must produce?",
              "back": "Latency ledger: the 500 ms read budget allocated line-by-line (assembly, filter, hydration, serialization) — each line monitorable. Freshness ledger: the 10 s write grant allocated stage-by-stage (tailing, queue, fan-out, read-side staleness) with Σ worst-sustained cases ≤ G."
            },
            {
              "id": "u6l1-i2",
              "front": "Why must freshness budgets use worst-sustained cases, not per-stage p99s?",
              "back": "Lag adds across sequential stages, but tails need not coincide and DO correlate under shared load bursts — per-stage p99 < G/k guarantees nothing. Budget each stage's burst-theorem excursion, sum ≤ G, keep headroom."
            },
            {
              "id": "u6l1-i3",
              "front": "How does the poster see their own post 'immediately'?",
              "back": "Outside the async pipeline entirely: synchronous insert into the poster's OWN feed list at commit + session pinning for their profile reads (unit 2 read-your-writes). The 10 s grant applies to followers; the poster's path never rides the ledger."
            },
            {
              "id": "u6l1-i4",
              "front": "Where does ranking fit an existing feed architecture?",
              "back": "A consumer of existing read models: candidates from precomputed lists, features from the counting layer, scoring at read time as one budgeted latency line item, chronological as the pre-built fallback. Ranking adds a stage, not an architecture."
            },
            {
              "id": "u6l1-i5",
              "front": "The feed degradation ladder's rungs — and the one that fails closed?",
              "back": "List store down → rate-bounded cache-first FoR fallback (partial feeds); scorer down → chronological; counters down → hide counts; hydration cold → shorter feeds. Block/audience filter unreachable → fail CLOSED (serve nothing unclearable): revocation outranks availability."
            },
            {
              "id": "u6l1-i6",
              "front": "Why are post edits O(caches) instead of O(followers) in a well-built feed?",
              "back": "Feed lists hold IDS; content hydrates through invalidatable per-object caches; bytes live behind immutable content-addressed URLs (edit = new object + pointer swap). Mutability was contained at design time to layers that afford it — an edit event invalidates caches and re-indexes, never touches 100 M lists."
            }
          ]
        },
        {
          "id": "u6l2",
          "title": "Notifications Without the Spam Spiral",
          "estMinutes": 26,
          "builds_on": [
            "u4l4",
            "u4l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The system whose failure mode is being ignored",
              "body": "Every event the feed pipeline carries — likes, follows, comments, posts — is also a candidate notification, and the notification system consumes the same log the feed does (unit 4's backbone, acquiring its next consumer group exactly as promised). But its engineering profile is inverted from everything built so far. The feed's job was delivering *more*, faster; the notification system's central problem is delivering **less**: a user who receives 300 pushes a day disables notifications forever (or deletes the app), and once disabled, the product's strongest re-engagement channel is gone — permanently, per user. The failure mode is not an outage; it is *churn caused by success*.\n\nSo the design centers on restraint machinery — collapsing, batching, preferences, per-user rate limits — wrapped around a delivery pipeline that must still be reliable (a missed 'your payment failed' notification is a real failure) and must cross the one boundary this course has repeatedly flagged as irreducible: external providers (APNs, FCM, email gateways) that fire side effects you cannot transact with (unit 4's residue, now the core of a system rather than its edge case). The lesson builds the pipeline in stages: eligibility, restraint, delivery — with the restraint stage carrying the theorem."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The notification pipeline",
              "statement": "A notification system is a pipeline of four decisions per candidate event: **eligibility** — does this event type notify this user at all (product rules + the user's preference matrix: per-type, per-channel opt-outs, quiet hours)? **Collapsing** — is there an open *collapse group* for (user, object, type) that this event joins ('Ana and 41 others liked your photo') instead of spawning a new notification? **Scheduling** — send now, or hold for a digest window / quiet-hours release? **Delivery** — render per channel (push, email, in-app badge) and hand to the provider, with per-channel delivery state tracked. Each decision is a filter; the system's health metric is not throughput but the *ratio* of events entering to notifications leaving — a well-tuned system discards or merges the overwhelming majority."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "The collapse bound",
              "statement": "If notifications for a key (user, object, type) are collapsed with window W — a new send may open only when no collapse group for the key has been opened within the last W — then over any interval of length T, the sends for that key satisfy\n\n  S(T) ≤ ⌈T/W⌉,  i.e. at most one send per W regardless of the arrival rate λ of underlying events.\n\nCombined with a per-user token bucket (rate r, burst B) across all keys, total user sends over T are ≤ min(Σ_keys ⌈T/W⌉, rT + B): collapsing bounds per-object noise, the bucket bounds aggregate noise, and both bounds are arrival-rate-independent.",
              "proof": "For the collapse bound: partition the interval into consecutive half-open windows of length W anchored at the first send. A send at time t opens a group that absorbs every subsequent event for the key until t + W; therefore two sends for the key are separated by at least W, and an interval of length T contains at most ⌈T/W⌉ points pairwise separated by ≥ W. The bound is independent of λ because absorbed events update the open group (its count, its preview) without sending. The aggregate bound is unit 5's token-bucket admission bound applied to sends: over T, bucket-admitted sends ≤ rT + B; the system-wide send count is bounded by whichever constraint binds first. ∎\n\nThe design reading: a viral photo receiving 50 k likes/hour generates, for its owner, at most 12 pushes/hour at W = 5 min — and the owner's *total* across all their objects is still capped by their personal bucket (say r = 4/hour, B = 6). The two mechanisms answer different spam vectors — one hot object versus many warm ones — and both are needed: collapsing alone lets 100 objects × 12/hour through; the bucket alone turns one viral photo into the user's entire budget. Every parameter (W, r, B) is a product-extracted number, per notification type: 'payment failed' collapses never (W = 0, exempt from the bucket — correctness class); 'someone liked' collapses aggressively."
            },
            {
              "type": "example",
              "heading": "Worked example: the like storm, walked through the pipeline",
              "body": "Lens, viral photo, 50 k likes in an hour; owner's settings: likes → push enabled, quiet hours 23:00–08:00; it is 14:00. Event #1 (like from Ana, 14:00:00): eligibility passes; no open group for (owner, photo 991, like) → open a group, send push #1 ('Ana liked your photo'), record group open until 14:05. Events #2–#4,100 (14:00:01–14:05): all join the open group — the group's state accretes (count 4,100, latest actor names) with **zero sends**; the in-app notification row updates in place (its badge count rides lesson 3's counters). Event #4,101 (14:05:01): the group's window expired → close group, open a new one, send push #2 ('Ben and 4,100 others…'). Steady state: 12 pushes/hour maximum — and the owner's personal bucket (4/hour) tightens it further: pushes #5+ that hour are *bucket-rejected*, which for notifications means **downgrade, not drop**: the in-app row still updates (unlimited — it's pull, not interrupt), the push is skipped. At 23:00, quiet hours: sends hold entirely; groups continue accreting; at 08:00 the scheduler releases one digest ('overnight: 18 k likes, 3 new followers') — the digest being just a scheduled collapse across keys.\n\nCount what the user received from 50,000 events: 4 pushes, one overnight digest, and a live in-app count. The event-to-notification ratio — 50,000 : 5 — is the metric the system is tuned by, and every stage that improved it was a *filter with a stated rule*, not a heuristic buried in code."
            },
            {
              "type": "example",
              "heading": "Worked example: delivery across the irreducible boundary",
              "body": "The delivery stage inherits unit 4's hardest truth: APNs/FCM/email providers accept a side effect you cannot transact with. The consumer's contract, assembled from the course's pieces: the notification-send consumer reads from its queue (at-least-once); for each send it (1) writes 'attempting (send id)' to the delivery-state store, (2) calls the provider, (3) records the outcome. Crash between (2) and (3) → redelivery finds 'attempting' → the residue policy (unit 4's exercise, now policy): for push, check provider receipt where the API offers it, else **re-send** — a duplicate push is the cheap failure direction (mildly annoying) versus a silently lost 'your payment failed' (expensive) — the direction argued per notification class, in writing: transactional/correctness notifications choose duplicate-over-loss; social ones may choose loss-over-duplicate (at-most-once: skip on ambiguity — a lost like-push is invisible).\n\nProvider failure handling is unit 4's menu verbatim: provider brownout → the queue absorbs (bounded, with the burst arithmetic sizing the tolerable backlog against notification freshness grants — a like-push delivered 40 minutes late is worse than dropped: **stale social notifications get shed**, another per-class policy); provider rate limits → the consumer's own token bucket per provider (unit 5's limiter, pointed outward); token invalidation (uninstalled apps) → feedback processing that prunes dead device tokens, because sending to the dead is both wasted spend and provider-relationship damage. Every branch is machinery this course already built — queue, bucket, residue policy, shed-vs-drain — composed at one boundary."
            },
            {
              "type": "diagram",
              "kind": "sequence",
              "caption": "One like event through the pipeline: eligibility → collapse check (joins an open group — no send) versus group-expired (send via the provider boundary with attempting-state). The in-app row updates on every path; the push is the guarded resource.",
              "actors": [
                "Event log",
                "Eligibility",
                "Collapser",
                "Sender",
                "Provider"
              ],
              "messages": [
                {
                  "from": "Event log",
                  "to": "Eligibility",
                  "label": "like(photo 991, by Ana)"
                },
                {
                  "from": "Eligibility",
                  "to": "Collapser",
                  "label": "type on, channel on, not quiet",
                  "tone": "sage"
                },
                {
                  "from": "Collapser",
                  "to": "Collapser",
                  "label": "open group? → join, count++",
                  "tone": "sage"
                },
                {
                  "note": "no send — in-app row updates, push suppressed"
                },
                {
                  "from": "Event log",
                  "to": "Eligibility",
                  "label": "like(photo 991, by Ben) — later"
                },
                {
                  "from": "Eligibility",
                  "to": "Collapser",
                  "label": "pass"
                },
                {
                  "from": "Collapser",
                  "to": "Sender",
                  "label": "window expired → emit collapsed send",
                  "tone": "gold"
                },
                {
                  "from": "Sender",
                  "to": "Sender",
                  "label": "bucket check + write 'attempting'",
                  "tone": "gold"
                },
                {
                  "from": "Sender",
                  "to": "Provider",
                  "label": "push('Ben and 4,100 others…')",
                  "tone": "gold"
                },
                {
                  "from": "Provider",
                  "to": "Sender",
                  "label": "accepted → record outcome",
                  "dashed": true
                }
              ]
            },
            {
              "type": "text",
              "heading": "Preferences, badges, and the state nobody owns",
              "body": "Two sub-systems complete the design, both easy to underestimate. **The preference matrix** — per-user × per-type × per-channel switches plus quiet hours — is read on *every* candidate event: at 100 M DAU social-event rates that is a hot read path in its own right, served the unit-3 way (cache-aside per user, invalidated on settings change) with one non-negotiable: preference reads must be **fresh enough that opt-outs stick** — a user who disables likes-pushes and receives one 10 minutes later files the complaint that matters; opt-out is revocation-shaped (unit 2's rule — sub-minute invalidation, fail toward *not sending*). **The badge count** — the red number on the app icon and the in-app bell — is a derived counter (unread notifications per user) with a notoriously leaky lifecycle: it increments with sends, must decrement on reads/dismissals from any device, and drifts under every duplicate, race, and lost ack this pipeline can produce. The honest design: the badge is lesson 3's counter machinery with an idempotent event stream (notification-created / notification-read, keyed and versioned), *plus* the unit-2 reconciliation template — periodically recompute unread-count from the notification rows and repair the counter, because a badge that says 3 when the list shows 0 is the bug users screenshot. Neither sub-system is glamorous; both are where notification systems actually fail audits."
            },
            {
              "type": "callout",
              "tone": "danger",
              "body": "**The spam death spiral is a metrics trap: every notification sent lifts today's engagement graph and burns tomorrow's channel.** Send-volume A/B tests reliably 'win' short-term — more pushes, more opens — while opt-out and uninstall rates compound invisibly until the channel is dead for the users who mattered. The counter-discipline: opt-out rate and notification-settings-visits are first-class health metrics reviewed WITH engagement; every new notification type ships with its collapse window, bucket class, and a sunset criterion; and the per-user budget is owned by one team with veto power — because in its absence, every team's 'just one more push type' is individually rational and collectively fatal."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A user has 30 active objects each receiving steady engagement. Notification config: collapse window W = 10 min per (object, type), personal bucket r = 3/hour, B = 5 (starting full). Compute the maximum pushes this user could receive in the first hour and in a steady-state hour, and identify which mechanism binds in each regime.",
                  "solution": "Collapse ceiling: 30 objects × ⌈60/10⌉ = 30 × 6 = 180 candidate sends/hour — collapsing alone leaves the user destroyed. Bucket: first hour admits at most rT + B = 3 + 5 = **8 pushes** (burst B spends in the first minutes as objects' first groups all open, then r meters the rest); steady state: **3/hour** (bucket empty of burst, refill-bound). Binding mechanism: the bucket in both regimes — with many warm objects, collapsing bounds per-object noise but the AGGREGATE is the user's experience, and only the bucket sees the aggregate. (Flip the scenario — one viral object, huge λ — and collapsing binds: 6/hour candidates, under the bucket's 8.) The two-mechanism necessity from the theorem, verified numerically; and the overflow behavior matters as much as the number: bucket-rejected sends downgrade to in-app rows, so 172 'notifications' still exist where the user CHOOSES to look — restraint on interrupts, not on information.",
                  "hint": "Collapse bound per object × objects, then apply rT + B to the aggregate. Which is smaller in each regime?"
                },
                {
                  "prompt": "Design the 'payment failed' notification class end to end, contrasting every pipeline stage with the 'someone liked' class: eligibility, collapsing, scheduling, bucket treatment, delivery residue policy, and what happens during a 40-minute provider outage. Justify each contrast by the failure direction.",
                  "solution": "Eligibility: not preference-suppressible (a legal/correctness notice — users may opt out of marketing, not of 'your subscription lapsed'; product/legal extraction, documented) vs likes fully preference-gated. Collapsing: W = 0 — never collapse (each failure is distinct actionable state) vs aggressive 5-min windows. Scheduling: pierces quiet hours (or schedules to morning with in-app + email immediately — extract the product ruling) vs held for digest. Bucket: exempt from the social budget (correctness class rides a separate, high-limit bucket so a viral photo can't crowd out a payment notice) vs metered. Delivery residue: duplicate-over-loss — on ambiguity, re-send across channels (push AND email for redundancy), because a lost payment notice costs money and trust while a duplicate costs an eye-roll; likes choose loss-over-duplicate (skip on ambiguity). Provider outage: payment class queues and DRAINS (never shed — it's a promise; 40 minutes late still beats never, and email fallback fires meanwhile) vs social pushes past their freshness get shed (a like-push 40 min late is noise). Every contrast is one decision — which failure direction is expensive — applied at each stage; the two classes are the same pipeline with opposite signs, and the design artifact is the per-class policy table, not two codebases.",
                  "hint": "At each stage ask: for THIS class, which is worse — sending wrongly/twice, or not sending? The answers generate every contrast."
                },
                {
                  "prompt": "The badge count drifts: support tickets show badges stuck at N > 0 with empty notification lists. Enumerate three distinct mechanisms in this lesson's pipeline that produce drift, and design the repair that makes stuck badges self-healing — including why the repair must not itself notify.",
                  "solution": "Drift mechanisms: (1) duplicate increments — the send consumer redelivers (at-least-once) and the badge increment wasn't idempotent (missing the unit-4 dedup discipline on the counter event); (2) lost decrements — 'read' events from one device fail/race while another device's view marked rows read: the read-state sync across devices dropped the decrement (the classic multi-device race: row state says read, counter never heard); (3) collapse-group updates — a group accreting from 1 to 4,100 likes updates the row in place but naive implementations increment the badge per EVENT, counting absorbed events that never produced a notification. All three are counter-vs-source divergence — a derived value drifting from its derivation (unit 2's oldest lesson). Repair: reconciliation — periodically (and on app-open, the moment that matters) recompute unread = COUNT(rows where read=false) from the notification store and overwrite the counter; the badge becomes self-healing at every app launch, bounding drift's lifetime to one session. Why silent: the repair is a state correction, not user activity — pushing a badge-update through the notification pipeline would itself interrupt (and could loop: a repair triggering a sync triggering a repair); it rides the silent badge-update channel providers offer. The meta-lesson: every derived counter in this course got the same three-part treatment — idempotent updates, a known-race audit, and a reconciliation backstop — and the badge is simply the counter users stare at most.",
                  "hint": "Where can an increment fire twice, a decrement vanish, or an absorbed event count? Then: what recomputation, run when, bounds all three?"
                },
                {
                  "prompt": "Growth wants a new notification type: 'your friend just posted for the first time in a while' — projected to lift DAU 2%. Run it through the callout's governance: what must ship with it, what could make it net-negative, and design the experiment that would detect the damage the naive A/B misses.",
                  "solution": "Ships with (the governance checklist): eligibility rules (which friends? opt-out honored from day one — it's a social type, fully preference-gated); collapse window (per friend, W large — this fires at most once per friend-reactivation; but cap per USER across friends via the standard bucket, or a burst of reactivations becomes a spam day); bucket class: social, metered — it competes inside the existing budget rather than expanding it (the veto-team's default: new types don't grow total volume, they compete for it); a sunset criterion ('retire if opt-out-attributable-to-type exceeds X or engagement lift < Y at 90 days'). Net-negative mechanism: the push cannibalizes the budget of higher-value notifications (bucket competition), and its recipients — selected for being SENDERS' friends, not for wanting pings — may skew toward marginal users for whom one unwanted push triggers settings-visit → global opt-out: the type's 2% DAU lift can cost the channel for users worth more than the lift. The honest experiment: randomize at the USER level with long horizon (90 days), measuring not just opens/DAU but opt-out rate, notification-settings visits, uninstalls, and — the one naive A/Bs never hold out — TOTAL notification volume held constant between arms (the new type substitutes in treatment, so the test isolates the type's value rather than measuring 'more notifications beat fewer', which short-term always wins). Report lift NET of channel damage, per the callout: today's graph versus tomorrow's channel, both on the same page.",
                  "hint": "The naive A/B varies volume and stops early. What must be held constant, measured additionally, and run longer to see the spiral?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u6l2-i1",
              "front": "The four decisions of the notification pipeline?",
              "back": "Eligibility (product rules × user preference matrix × quiet hours) → collapsing (join an open (user, object, type) group vs new send) → scheduling (now, digest, quiet-hours hold) → delivery (per-channel render, provider handoff, state tracked). Health metric: events-in to notifications-out ratio."
            },
            {
              "id": "u6l2-i2",
              "front": "The collapse bound and why the bucket is still needed?",
              "back": "Window W ⇒ ≤ ⌈T/W⌉ sends per (user, object, type), arrival-rate-independent (sends ≥ W apart). But 100 warm objects × 6/hour still floods — the per-user token bucket (rT + B) caps the AGGREGATE. Two spam vectors, two mechanisms, both required."
            },
            {
              "id": "u6l2-i3",
              "front": "Bucket-rejected social notification — drop or downgrade?",
              "back": "Downgrade: skip the push (the interrupt is the guarded resource), still update the in-app row and badge (pull channels are unlimited). Restraint applies to interruptions, not information."
            },
            {
              "id": "u6l2-i4",
              "front": "How do notification classes set their delivery residue policy?",
              "back": "By failure direction, per class, in writing: transactional/correctness ('payment failed') choose duplicate-over-loss (re-send on ambiguity, multi-channel, never shed, pierce quiet hours per product ruling); social ('liked') choose loss-over-duplicate (skip on ambiguity, shed when stale). Same pipeline, opposite signs."
            },
            {
              "id": "u6l2-i5",
              "front": "Why are opt-outs revocation-shaped, and what does that force?",
              "back": "A user who disables a type and still receives it files THE complaint: preference reads must be fresh (sub-minute invalidation on settings change) and the pipeline fails toward NOT sending when preference state is unreachable — unit 2's revocation rule pointed at the send path."
            },
            {
              "id": "u6l2-i6",
              "front": "The governance that prevents the spam death spiral?",
              "back": "Send-volume tests win short-term while opt-outs compound: so opt-out/settings-visits/uninstalls are first-class metrics beside engagement; every type ships with collapse window, bucket class, sunset criterion; new types COMPETE inside the budget (held-volume experiments); one team owns the per-user budget with veto."
            }
          ]
        },
        {
          "id": "u6l3",
          "title": "Counters and Top-K at Scale",
          "estMinutes": 25,
          "builds_on": [
            "u2l1",
            "u4l4",
            "u3l4"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The numbers under everything",
              "body": "Social products are upholstered in numbers: like counts, follower counts, view counts, unread badges, 'trending now'. The course has met them piecemeal — the denormalized like-count (unit 2), the batched view counter (unit 4), the trending window (unit 3's exercise), the badge (last lesson) — each time deferring the same two scale problems. First, the **hot counter**: a single row incremented thousands of times per second serializes on its own lock (unit 2's hot-row warning made chronic — every increment of one viral photo's count contends on one row, and throughput caps at one row's lock rate). Second, **top-K over a firehose**: 'the 20 most-liked photos this hour' over hundreds of thousands of events per second, where the naive answer — count everything, sort — needs memory proportional to every key seen and a sort nobody budgeted.\n\nThis lesson closes both, with the two standard tools: the **sharded counter** — the compound-key escape (unit 2) applied to a single number — and the **count-min sketch**, the sublinear structure that estimates any key's frequency from a firehose in kilobytes, with an error bound you can prove and therefore *set*. Both tools are approximation-flavored, and both are governed by the course's standing rule: the approximation is legal exactly where a stated grant covers it."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The sharded counter",
              "statement": "A **sharded counter** for key k with shard factor S stores S sub-counters k#0 … k#(S−1). An increment picks shard k#(hash(source) mod S) — or uniformly at random — and increments only it: write contention per shard drops by ~S (each shard takes ~1/S of the traffic, serializing independently). A read sums the S shards — costlier and non-atomic (the shards are read at slightly different moments, so the sum is a *near-instantaneous* value, not a linearizable one). The read cost is then absorbed the unit-3 way: cache the sum with a micro-TTL sized to the display grant. S is chosen per key-class from peak increment rate ÷ per-row serialized capacity — and can escalate dynamically for keys that go viral (start S = 1, split at a rate threshold)."
            },
            {
              "type": "example",
              "heading": "Worked example: the viral photo's like counter",
              "body": "Lens's most-liked-ever moment: a photo taking 30 k likes/s at peak. Single row: a hot row serializes increments at, generously, ~2–5 k lock acquisitions/s before queueing dominates — the row is a 6–15× bottleneck, and (worse) it sits in the same table as every other photo's counts, dragging neighbors via lock queues and buffer contention. Sharded at S = 16: each shard takes ~1,900/s — comfortable; increments ride the idempotent batched pipeline (unit 4's view-counter machinery: the like events flow the log, a consumer applies batched deltas per shard with offset-as-dedup — effectively-once, contention-free). Read path: display sum cached at TTL = 2 s (the counts staleness grant of unit 3); at 100 k reads/s for this photo, the cache serves h ≈ 99.998% (reads-per-window arithmetic) — the 16-shard sum runs 0.5 times/s, invisible. Escalation policy: photos start unsharded (S = 1 — almost all photos never need more); a consumer-side rate detector splits a counter to S = 16 past 1 k increments/s (writing a marker the readers respect: sum shards if the marker exists). The complete pattern — sharded writes, batched idempotent application, micro-TTL cached reads, dynamic escalation, plus unit 2's reconciliation job re-deriving each count from the source-of-truth like rows nightly — is the standing answer for every 'this number is hot' problem in the catalogue, and it composes entirely from parts previous units built."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "The count-min sketch error bound",
              "statement": "A **count-min sketch** is a d × w matrix of counters with d independent hash functions h₁…h_d (one per row). To record an event for key x, increment M[j, h_j(x)] for every row j; to estimate x's count, return ĉ(x) = min_j M[j, h_j(x)]. After N total events, with w = ⌈e/ε⌉ and d = ⌈ln(1/δ)⌉:\n\n  (i) ĉ(x) ≥ c(x) always (never underestimates);\n  (ii) P( ĉ(x) ≤ c(x) + εN ) ≥ 1 − δ.\n\nMemory is w·d counters — for ε = 0.01%, δ = 10⁻⁶: ~27,000 × 14 ≈ 400 k counters ≈ a few MB — independent of the number of distinct keys.",
              "proof": "(i) Every event for x increments M[j, h_j(x)] in each row j, so each cell x hashes to holds at least c(x); other keys colliding into the cell only add. The minimum over rows is therefore ≥ c(x).\n\n(ii) Fix row j. The excess X_j = M[j, h_j(x)] − c(x) is the count contributed by other keys y ≠ x with h_j(y) = h_j(x). By pairwise-uniform hashing, each of the ≤ N events for other keys lands in x's cell with probability 1/w, so E[X_j] ≤ N/w ≤ εN/e. By Markov's inequality, P(X_j > εN) ≤ E[X_j]/(εN) ≤ 1/e. Rows use independent hashes, so the excesses are independent: P(every row's excess > εN) ≤ (1/e)^d ≤ (1/e)^{ln(1/δ)} = δ. The estimate — the minimum — exceeds c(x) + εN only if *every* row does, which has probability ≤ δ. ∎\n\nRead the guarantee like an engineer: the error is **relative to the whole stream** (εN, not εc(x)) — so the sketch is precise for *heavy* keys (a key holding 1% of a stream, measured with ε = 0.01%, has ≤ 1% relative error) and useless for rare ones (a key with 50 true events under εN = 10,000 might read 10,050). That asymmetry is exactly right for top-K: the keys that matter are the ones the sketch is accurate about — the structure is not a database, it is a heavy-hitter detector, and its parameters (ε against the smallest count you care to rank, δ against how often you tolerate a bad estimate) are set from the product question, not from memory limits."
            },
            {
              "type": "example",
              "heading": "Worked example: 'Trending now' assembled",
              "body": "Lens trending, production-shaped: top 20 photos by engagement in the trailing hour, refreshed each minute, over an engagement firehose of ~200 k events/s at the horizon (likes + views weighted). The unit-3 exercise sketched the counter form; the sketch completes it at firehose scale where per-key exact bucketed counters for *every touched photo* would mean tens of millions of active keys per hour.\n\nStructure per minute-bucket: one count-min sketch (ε = 0.001%, δ = 10⁻⁴ → ~2.7 M × 10 counters ≈ 100 MB — sized so εN ≈ 0.001% × 720 M events/hour ≈ 7,200, well under trending-scale counts of 100 k+) plus a **candidate heap**: since the sketch alone can't enumerate keys ('what are the top keys?' is not a query it answers — you can only ask about keys you name), the consumer maintains a min-heap of the ~10 k highest-estimated keys seen this bucket: for each event, estimate the key via the sketch; if the estimate exceeds the heap's floor, insert/update. Hourly top-K = merge the trailing 60 buckets' heaps, re-estimate candidates against the buckets' sketches, take 20; publish as one cached document (the unit-3 pattern: micro-TTL, coalesced — the hottest cheapest read in the product). Exactness where it matters: the *published* 20 get their display counts from the real (sharded) counters, not the sketch — the sketch nominates, the counters testify. Failure and rebuild: sketches are derived state fed by the log — a lost bucket rebuilds by replaying that minute's offsets (unit 4's replay, at minute granularity); the degradation rung is 'trending pauses, feed unaffected'. Every component of a system that looks exotic — streaming sketches! — resolved into the course's standard parts: a log consumer, a derived model with a rebuild path, a cached document, and one provable structure whose error was set from a product number."
            },
            {
              "type": "code",
              "heading": "The sketch + heap consumer, compact",
              "lang": "text",
              "code": "-- per minute-bucket b: sketch S_b (d x w zeroed), min-heap H_b (capacity 10k)\non event(photo_id, weight) from engagement log:      -- at-least-once; weights idempotent\n  for j in 1..d: S_b[j][h_j(photo_id)] += weight     -- record\n  est = min_j S_b[j][h_j(photo_id)]                  -- estimate (CMS read)\n  if est > H_b.floor() or H_b.contains(photo_id):\n    H_b.upsert(photo_id, est)                        -- candidate set, bounded memory\n\nevery 60s (bucket close + publish):\n  candidates = union(H_b for b in last 60 buckets)   -- ~10-60k keys\n  for k in candidates:\n    score[k] = sum over buckets of min_j S_b[j][h_j(k)]   -- re-estimate per bucket\n  top20 = argmax_20(score)\n  counts = read_sharded_counters(top20)              -- exact display numbers\n  publish cached doc {top20, counts}, TTL 60s        -- one hot key, coalesced\n\n-- notes: duplicate delivery inflates S_b slightly (weights re-added) — bounded by\n-- redelivery rate, inside the approximation grant; or dedup at the consumer (u4).\n-- sketch answers only NAMED keys — the heap exists because CMS cannot enumerate."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**Approximation is a requirements decision wearing a math costume.** Every structure in this lesson traded exactness for scale — the sharded sum is momentarily inconsistent, the cached count is seconds stale, the sketch overestimates by ≤ εN with probability 1 − δ — and every trade was legal because a grant covered it ('counts are approximate', 'trending lags ~2 min'). The order is the method's, never reversed: extract the tolerance, THEN pick the structure whose provable error fits inside it. An unstated approximation is a bug; a stated one is a design."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A counter row sustains ~3 k serialized increments/s. A livestream's viewer-count takes 45 k increments/s at peak. (a) Minimum shard factor with 30% headroom? (b) The display reads 500 k times/s — design the read path so shard-summing stays negligible, with arithmetic. (c) Why should the sharding be dynamic, and what is the escalation trigger?",
                  "solution": "(a) Required capacity 45 k / 0.7 ≈ 64 k/s of shard throughput → S = ⌈64,286 / 3,000⌉ = **22 → round to 24 or 32** (power-of-two convenience; over-sharding is cheap — reads sum a few more cells). (b) Cache the sum: at TTL = 1 s, 500 k reads/s hit the cached value with h = 1 − (1 sum)/(500 k reads) ≈ 99.9998%; the 32-shard sum executes once per second (per cache node — use coalescing so concurrent expiry doesn't multiply it, unit 3). Sum cost: 32 reads ≈ sub-millisecond. Display staleness: ≤ 1 s + micro-TTL — inside any viewer-count grant. (c) Dynamic because the workload is power-law: virtually all streams never exceed one row's capacity, and pre-sharding everything multiplies every small stream's read cost by S and its storage by S for nothing. Trigger: a rate detector at the (batched, unit-4) increment consumer — sustained rate past ~1 k/s (a third of single-row capacity, early enough to split before saturation) writes the shard marker; readers sum when the marker exists. De-escalation (fold shards back) runs lazily post-peak. The pattern: pay S only where measured heat demands it — unit 2's skew rule, applied to a single number.",
                  "hint": "(a) rate/headroom ÷ per-row capacity. (b) reads-per-TTL-window. (c) who detects heat, and what marker do readers respect?"
                },
                {
                  "prompt": "Size a count-min sketch for an ads pipeline that must flag any ad receiving ≥ 0.05% of daily impressions (N = 2 B/day), tolerating estimates inflated by at most a tenth of that threshold, with per-query failure probability ≤ 10⁻⁵. Give w, d, memory (4-byte counters), and explain why the same sketch is nearly useless for an ad with 500 true impressions.",
                  "solution": "Threshold count = 0.05% × 2 B = 1 M. Allowed inflation εN = 0.1 × 1 M = 100 k → ε = 10⁵/2×10⁹ = 5×10⁻⁵ → w = ⌈e/ε⌉ = ⌈54,366⌉ ≈ **55 k columns**. δ = 10⁻⁵ → d = ⌈ln(10⁵)⌉ = **12 rows**. Memory: 55 k × 12 × 4 B ≈ **2.6 MB** — for a stream with millions of distinct ads, versus gigabytes for exact per-key counts. Why it fails small keys: the guarantee is additive in N — ĉ ≤ c + 100 k w.h.p. — so an ad with c = 500 may read anywhere up to ~100,500: a 200× relative error, though the flagging decision (≥ 1 M?) is unaffected because 100,500 ≪ 1 M. The sketch answers 'is this key heavy?' with precision proportional to heaviness; it cannot rank or measure the tail. If the product later needs accurate counts for SMALL ads, that is a different requirement → different structure (exact sharded counters per ad, or sampled estimates) — re-extract, re-derive; the sketch's parameters encode ONE question.",
                  "hint": "Work backwards: threshold → tolerated absolute error εN → ε → w = e/ε; δ → d = ln(1/δ). Then compare εN to the small key's true count."
                },
                {
                  "prompt": "Your trending consumer (sketch + heap, per the lesson) is accused of two bugs: (1) a photo that objectively exploded at minute 58 missed the hourly top-20 published at minute 60; (2) after a consumer crash-restart mid-minute, that minute's trending scores ran slightly high. Adjudicate each: real bug, expected behavior within a grant, or mis-configuration — with the mechanism.",
                  "solution": "(1) Mechanism check: an explosion at minute 58 has only 2 of 60 buckets of accumulation — the hourly sum ranks it against photos with 60 buckets of steady engagement: missing the top-20 is ARITHMETICALLY CORRECT for a trailing-window sum, and whether it's a product bug depends on what 'trending' means — most products want recency-weighted trending (exponential decay across buckets, or shorter windows) precisely so explosions surface. Verdict: not a pipeline bug; a requirements gap — the window/weighting was never extracted as a product decision. Fix: weight bucket b by decay^age, or publish both 'top this hour' and 'surging now' (10-min window). (2) Mechanism: crash-restart with at-least-once delivery re-applied some events' weights into the bucket's sketch (the code comment's caveat: duplicates inflate estimates; offset-as-dedup wasn't used for sketch updates because the sketch lives in memory, not in the checkpoint's transactional domain — unit 4's atomicity premise, unmet by design). Verdict: expected behavior INSIDE the approximation grant if redelivery windows are small (a few seconds of re-applied events against a minute bucket ≈ small inflation, and the published counts come from exact counters anyway); becomes a real bug only if restarts are frequent or grants are tight — the honest design either rebuilds the open bucket by replay-from-bucket-start on restart (cheap: ≤ 1 min of events — the stated rebuild path) or documents the inflation bound. Both adjudications turn on the same discipline: name the grant, check the mechanism against it — 'bug' is a statement about requirements, not vibes.",
                  "hint": "(1) What does a trailing SUM structurally favor? (2) Which unit-4 premise does an in-memory sketch break, and what does the rebuild path cost?"
                },
                {
                  "prompt": "Follower counts on Lens profiles: read on every profile view (50 k/s), incremented on follows (~600/s aggregate, but a celebrity gaining 5 k followers/min during a moment), displayed with K-notation above 10 k ('1.2M'). Design the full counter stack — and identify which piece of this lesson's machinery you can OMIT because of the display rule, with the reasoning.",
                  "solution": "Stack: per-user follower counters, unsharded by default (600/s aggregate is nothing; per-user rates are tiny) with dynamic sharding for celebrity moments (5 k/min ≈ 83/s — actually still under single-row capacity! run the arithmetic before sharding: even the hot case doesn't force S > 1; keep the escalation path built but expect it rarely) — the exercise's first catch: heat instincts must survive contact with the numbers. Increments via the idempotent follow-event consumer (dedup on (follower, followee) — a follow is naturally idempotent set-insertion, unit 1's PUT semantics: re-follows can't double-count by construction, which is cheaper than dedup records). Reads: cache with TTL tiered by display precision — and here is the omission: above 10 k, the display truncates to K/M notation, so a '1.2M' rendering is unchanged by ±50 k of drift — the display rule IS a staleness grant of enormous width: TTL for big accounts can be minutes (h → 1 at 50 k reads/s), and the micro-TTL machinery (coalescing, 1–2 s refresh) is needed only for SMALL counts where '47 followers' must tick to '48' promptly — exactly the counts that are cold and cheap anyway. Omitted: the count-min sketch entirely — there is no top-K/heavy-hitter question here, just per-key exact counts; reaching for the sketch because 'counters at scale' pattern-matched would add a structure whose one question nobody asked. Reconciliation: nightly re-derive from the follows table (the standing backstop). The exercise's two lessons: run the arithmetic before sharding, and read the DISPLAY rule as the grant it secretly is.",
                  "hint": "Check the hot case against single-row capacity before sharding; then ask what precision '1.2M' actually requires, and which tool answers a question nobody asked."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u6l3-i1",
              "front": "The sharded counter — mechanism and full pattern?",
              "back": "S sub-counters; increments hash to one shard (contention ÷ S); reads sum shards, cached at micro-TTL sized to the display grant. Full stack: sharded writes + batched idempotent application (log consumer) + cached sums + DYNAMIC escalation (split on measured rate) + nightly reconciliation from source rows."
            },
            {
              "id": "u6l3-i2",
              "front": "Count-min sketch — structure and guarantee?",
              "back": "d rows × w columns, one hash per row; record = increment all d cells; estimate = min over rows. Never underestimates; P(ĉ ≤ c + εN) ≥ 1−δ with w = e/ε, d = ln(1/δ). Memory independent of distinct-key count."
            },
            {
              "id": "u6l3-i3",
              "front": "Why is CMS error 'right' for top-K and wrong for the tail?",
              "back": "Error is additive in the WHOLE stream (εN, not εc): heavy keys get small relative error, rare keys can read 100× high. It's a heavy-hitter detector, not a database — set ε from the smallest count you rank, and get exact display numbers from real counters."
            },
            {
              "id": "u6l3-i4",
              "front": "Why does the CMS need a candidate heap beside it?",
              "back": "The sketch answers only NAMED keys — it cannot enumerate 'what are the top keys'. The consumer keeps a bounded min-heap of highest-estimated keys seen (insert when estimate beats the floor); top-K = merge heaps, re-estimate candidates, publish one cached document."
            },
            {
              "id": "u6l3-i5",
              "front": "The proof skeleton of the CMS bound?",
              "back": "Per row: expected collision excess ≤ N/w ≤ εN/e; Markov ⇒ P(excess > εN) ≤ 1/e. Independent rows ⇒ all d fail with probability ≤ e^(−d) = δ; the min exceeds c + εN only if every row does. Never-under: own counts always included."
            },
            {
              "id": "u6l3-i6",
              "front": "Two pre-sharding sanity checks this lesson drilled?",
              "back": "(1) Run the arithmetic: even 'celebrity' rates (83/s) can sit under single-row capacity — shard on measured heat, not vibes; escalate dynamically. (2) Read the display rule as a grant: '1.2M' truncation tolerates ±50 k drift → minutes of TTL for big counts; precision is only owed where digits actually change."
            }
          ]
        }
      ],
      "masteryCheck": {
        "id": "u6-check",
        "questions": [
          {
            "id": "u6q1",
            "type": "numeric",
            "prompt": "A feed pipeline's stages have worst-sustained lags: log tailing 1.5 s, dispatch queue 2 s, fan-out execution 2.5 s, read-side staleness 2 s. What is the tightest freshness grant G (in seconds) the design can honestly promise?",
            "answer": 8,
            "tolerance": 0.5,
            "points": 1,
            "explanation": "Sequential stage lags add: Σ = 1.5 + 2 + 2.5 + 2 = 8 s — the composition proposition. Promising less requires shrinking a stage (capacity, restructure) — and note that per-stage p99s summed would NOT be an honest bound: tails correlate under shared bursts, which is why the ledger uses worst-sustained cases."
          },
          {
            "id": "u6q2",
            "type": "numeric",
            "prompt": "Notifications for one (user, object, type) key are collapsed with a 15-minute window, and the user's personal bucket allows r = 2 sends/hour with burst B = 4 (starting full). For a single viral object, what is the maximum number of pushes this user can receive in the first hour?",
            "answer": 4,
            "tolerance": 0,
            "points": 1,
            "explanation": "Collapse bound: ⌈60/15⌉ = 4 candidate sends/hour for the single key. Bucket admits up to rT + B = 2 + 4 = 6 in the first hour. The binding constraint is the smaller: min(4, 6) = 4 pushes. (With many warm objects the bucket would bind instead — the two mechanisms guard different spam vectors, and the answer is always the min of the applicable bounds.)"
          },
          {
            "id": "u6q3",
            "type": "short",
            "prompt": "A streaming pipeline must identify which keys are heavy hitters in a 200 k events/s firehose using a few megabytes of memory, tolerating overestimates bounded relative to total stream size. What standard data structure does this? (Two or three words.)",
            "accept": [
              "count-min sketch",
              "count min sketch",
              "countmin sketch",
              "cms",
              "count-min"
            ],
            "points": 1,
            "explanation": "The count-min sketch: d×w counters with per-row hashing, estimate = min over rows; never underestimates, and P(ĉ ≤ c + εN) ≥ 1−δ at w = e/ε, d = ln(1/δ) — memory independent of distinct keys. Paired in practice with a candidate heap, since the sketch answers only named keys and cannot enumerate the top."
          },
          {
            "id": "u6q4",
            "type": "mcq",
            "prompt": "A feed team proposes enforcing blocks by filtering at fan-out time ('never insert a blocked viewer's feed entry') and removing the read-time filter to save latency. What is wrong with this?",
            "options": [
              "Blocks created AFTER fan-out don't retro-filter already-pushed entries, so the blocked content keeps appearing — revocations must be enforced at read time over precomputed state",
              "Nothing — write-time filtering is strictly better since it does the work once instead of per read",
              "Fan-out filtering is impossible because the fan-out consumer cannot know the block list",
              "The read-time filter is only needed for celebrities on the pull path, so it can be removed for pushed entries"
            ],
            "answer": 0,
            "points": 1,
            "explanation": "A block is a revocation: entries pushed before the block exist in the list, and finding one (viewer, author) pair among billions of entries to delete is the needle problem — so precomputed copies are allowed to be wrong and the render filters against CURRENT block state (cheap: per-candidate set-membership, microseconds). Option b is the seductive efficiency argument that ignores time; option c is false (the consumer can read block state — it's just insufficient); option d misses that pushed entries are exactly the stale ones. Write-time filtering is a fine optimization ON TOP of, never instead of, read-time enforcement."
          },
          {
            "id": "u6q5",
            "type": "proof",
            "prompt": "Prove the count-min sketch guarantee: for a sketch with d rows, w columns, independent pairwise-uniform hashes, after N total events, (a) ĉ(x) ≥ c(x) always, and (b) P(ĉ(x) ≤ c(x) + εN) ≥ 1 − δ when w = ⌈e/ε⌉ and d = ⌈ln(1/δ)⌉. (c) A teammate wants to use the same sketch to report accurate counts for keys with ~100 true events in a stream of N = 10⁹ at ε = 10⁻⁵. Rule on this with the bound's structure.",
            "rubric": [
              "Proves (a): every event for x increments x's cell in every row, and colliding keys only ADD — so each row's cell ≥ c(x), hence the min ≥ c(x)",
              "Proves (b) per-row: the excess in row j is the mass of other keys colliding into x's cell; by pairwise uniformity E[excess] ≤ N/w ≤ εN/e; Markov gives P(excess > εN) ≤ 1/e",
              "Completes (b) across rows: independence of the d hashes makes the row-failure events independent, so P(all rows exceed εN) ≤ (1/e)^d ≤ δ; the min exceeds c + εN only if every row does",
              "Rules correctly on (c): εN = 10⁻⁵ × 10⁹ = 10⁴ — the additive error bound (10,000) dwarfs the true count (100), so estimates for such keys are meaningless (up to 100× relative error); the sketch's error is additive in N, making it a heavy-hitter tool — small-key accuracy requires a different structure (exact counters, sampling), i.e. a re-derivation from the actual requirement"
            ],
            "solution": "(a) On every event for x, the cell M[j, h_j(x)] is incremented in each row j, so after N events M[j, h_j(x)] ≥ c(x) for all j — other keys hashing into the same cell contribute only non-negative increments. The estimate min_j M[j, h_j(x)] is a minimum of quantities each ≥ c(x), hence ≥ c(x). ∎ (b) Fix row j and let X_j = M[j, h_j(x)] − c(x): the total count of events for keys y ≠ x with h_j(y) = h_j(x). Each such event collides with probability 1/w (pairwise uniformity), so E[X_j] ≤ N/w ≤ N·ε/e = εN/e. X_j ≥ 0, so Markov applies: P(X_j > εN) ≤ E[X_j]/εN ≤ 1/e. The d rows use independent hash functions, so the events {X_j > εN} are independent: P(∀j: X_j > εN) ≤ e^{−d} ≤ e^{−ln(1/δ)} = δ. The estimate exceeds c(x) + εN iff the minimum does, i.e. iff every row's cell does — probability ≤ δ. Hence P(ĉ ≤ c + εN) ≥ 1 − δ. ∎ (c) Denied. The guarantee is additive in the stream: with ε = 10⁻⁵ and N = 10⁹, εN = 10,000 — a key with c = 100 may legitimately read anywhere up to ~10,100: two orders of magnitude of relative error, within spec. Shrinking ε to make εN ≈ 10 (ε = 10⁻⁸) needs w ≈ e/ε ≈ 2.7×10⁸ columns — hundreds of MB per row and the memory advantage is gone. The sketch answers 'how heavy are the heavy keys' — its error floor is a fraction of the WHOLE stream, so tail keys drown in collision mass by construction. Accurate small-key counts are a different requirement: exact (sharded) counters for a bounded keyset, or sampling with stated variance — pick the structure whose provable error fits the actual question. ∎",
            "points": 3,
            "explanation": "The proof is two classic moves — Markov per row, independence across rows — and part (c) is the engineering half: reading εN as an error FLOOR relative to the stream, which makes the sketch a heavy-hitter instrument and not a counting database. Setting ε from the smallest count you need to rank is the design step the bound exists to enable."
          },
          {
            "id": "u6q6",
            "type": "open",
            "prompt": "Design the activity system for a professional network ('LinkedIn-shaped'): 60 M DAU; follows + connections; a home feed (posts, shares — read 6×/day per user, ~2 M posts/day, mean 400 followers, max 20 M); notifications for connection requests (must never be lost), post engagement (high volume), and job alerts (batched daily by design); profile-view counters ('47 people viewed your profile') with a premium feature showing viewer lists. Deliver: (a) the feed architecture with its two ledgers sketched (grant: posts visible ≤ 30 s; feed p99 400 ms); (b) the notification classes with collapse/bucket/residue policies per class; (c) the counter design for profile views including the premium list; (d) the two places where read-time enforcement is non-negotiable, with reasons.",
            "rubric": [
              "Feed: hybrid fan-out derived from the numbers (360 M feed loads/day vs 2 M posts — read-dominance ≈ 180:1 favors push; W_FoW = 2 M × 400 = 800 M inserts/day ≈ 8 k/s — affordable; F* threshold for the 20 M-follower tail with read-time merge), with a freshness ledger allocating the 30 s grant across tailing/queue/fan-out/read-side and a latency ledger for the 400 ms read (list fetch + merge + filter + hydration), each with plausible numbers",
              "Notification classes contrasted by failure direction: connection requests — transactional class (never collapse away individual requests, duplicate-over-loss residue, never shed, exempt or high-limit bucket); post engagement — social class (aggressive collapse windows + per-user bucket, loss-over-duplicate, shed when stale); job alerts — scheduled digest by design (daily batch, collapse across the day, marketing-grade opt-out); policies stated per class, not globally",
              "Profile-view counter: increments via idempotent batched log consumers; sharding decision made from arithmetic (per-profile view rates are modest — dynamic sharding path noted for celebrity profiles); display count cached with TTL read from the display grant; the premium VIEWER LIST recognized as a different data product — an event-sourced list (who, when) with retention and privacy filtering, not a counter — because a count and a list have different requirements",
              "Read-time enforcement, both named with reasons: (1) blocks/visibility on the feed (revocations can't retro-filter pushed entries — filter at render against current state, fail closed); (2) the viewer list / view notifications against privacy settings (private-mode viewers must be excluded at READ time since settings change after events are recorded — a revocation-shaped privacy rule; alternatively connection-request or job-alert opt-outs enforced fresh at send time) — any two revocation-shaped placements with the mechanism argued",
              "Numbers are carried throughout (fan-out insert rate, ledger sums ≤ grants, collapse/bucket bounds) and at least one explicit deliberate OMISSION or downgrade is argued (e.g. no CMS — no heavy-hitter question here; exact counters suffice; or no real-time job alerts — batch by requirement), showing the method's 'every component paid for' discipline"
            ],
            "solution": "(a) Feed. Numbers: 60 M × 6 = 360 M loads/day (~3.6 k/s avg, ~11 k/s peak) vs 2 M posts/day (~23/s): 180:1 read-dominated → fan-out on write; W_FoW = 2 M × 400 = 800 M inserts/day ≈ 8 k/s average (25 k/s peak) — a small fleet of set-inserts. Celebrity tail: 20 M-follower accounts get F* (derive from the freshness ledger: 30 s grant, allocate tailing 3 s / queue 5 s / fan-out 15 s / read-side 5 s → at a 50 k/s fan-out fleet with 25% per-post share, F* ≈ 50 k × 15 × 0.25 ≈ 190 k → set 150 k) with read-time merge from cached author lists. Latency ledger (400 ms): edge 80 / assembly 120 (list fetch ~5 ms p99 hedged, celebrity merge ~5, block+visibility filter ~5, cursor slice) / hydration 120 (~15 objects, h ≈ 0.98 cache) / serialization 20 — sums ~340 with headroom. Poster sees own post: synchronous self-insert + session pin (outside the ledger). Degradation ladder: list-store outage → rate-bounded cache-first pull fallback; scorer (if ranked) → chronological. (b) Notifications. Connection requests: transactional — every request is individually meaningful: no collapsing away identity (collapse only into 'you have 3 pending' summaries that preserve each), duplicate-over-loss on provider ambiguity, never shed, pierce digest batching; separate high-limit bucket. Post engagement: social — collapse per (user, post, type) W = 10 min, personal bucket (say 3/hr, B = 5), overflow downgrades to in-app, loss-over-duplicate, shed stale (>15 min) pushes during provider outages. Job alerts: batch-by-design — daily digest window, collapse across all matches, marketing-grade eligibility (aggressive opt-out honoring, sunset criteria), never pierces quiet hours. Preference matrix cached with revocation-grade invalidation; fail toward not-sending for social/marketing, toward multi-channel redundancy for transactional. (c) Profile views. Increment path: view events → log → batched idempotent consumer (offset-as-dedup) → per-profile counters, UNSHARDED by default — arithmetic: even a hot profile at 100 k views/day ≈ 1.2/s is nowhere near row capacity; dynamic sharding trigger kept for viral moments (news events). Display: '47 people viewed' cached, TTL 60 s (the digit-change grant — and above 1 k views the display rounds, widening the grant further). The premium viewer LIST is a different product: an event-sourced store (viewer id, timestamp) keyed by profile, retention 90 days, capped per profile, fed by the same log — because 'who' is a list with privacy semantics, not a number: it pays list storage (bounded by cap × profiles) and carries read-time privacy filtering. Explicit omission: no count-min sketch anywhere — no heavy-hitter question exists in this product's requirements; pattern-matching 'counters at scale → sketch' would add an unpaid component. (d) Read-time enforcement, non-negotiable: (1) Feed blocks/visibility ('connections-only' posts): pushed entries predate blocks and audience changes — render filters every candidate against current block/visibility state, fail closed (revocation outranks availability). (2) The premium viewer list vs private mode: a viewer who browsed publicly then enabled private mode — and the reverse — must be filtered against CURRENT privacy settings at read time (and view events from private-mode sessions are never attributed at write time); recorded events cannot be trusted to reflect present consent — the same revocation shape, applied to privacy. Both are instances of the course's rule: every precomputed artifact upstream of the render is allowed to be wrong; the read path is the last point that can tell the truth, so that is where truth is enforced.",
            "points": 3,
            "explanation": "The gate's design synthesizes all three lessons on a new product: the fan-out decision and both ledgers re-derived from fresh numbers, notification classes generated by failure-direction analysis rather than copied, counters right-sized by arithmetic (with the premium list correctly recognized as a different data product), and revocation-shaped enforcement placed at read time twice. The deliberate-omission line is graded seriously — knowing which lesson's machinery a product does NOT need is the same skill as knowing which it does."
          }
        ]
      }
    },
    {
      "id": "u7",
      "title": "Canonical Designs III: Real-Time",
      "summary": "Inverting request/response: persistent connections and the gateway tier, chat with ordering and exact sync, and presence — the ephemeral state that wants to be lost.",
      "intro": "Every system in this course so far speaks request/response: the client asks, the server answers, the connection closes. Real-time features invert the arrow — a message arrives for you, a friend comes online, someone is typing — and the server must deliver news to a client that didn't ask. That inversion is expensive in a specific, quantifiable way: it forces the one thing unit 1 taught you to avoid — per-user state on the server tier, in the form of a held connection. This unit builds real-time in three layers. First, the connection problem itself: why polling arithmetic forces persistent connections at scale, and the gateway tier — with its registry, heartbeats, and reconnect storms — that holds them. Second, chat: Lens's DMs designed end to end, where per-conversation sequence numbers give ordering and exact missed-message recovery, delivery states ride the receipt pipeline, and the group-size spectrum quietly re-runs unit 4's fan-out economics at different constants. Third, presence — online dots, last-seen, typing — the rare workload where losing data is correct: at-most-once delivery, heartbeat timeouts, and aggressive debouncing, because ephemeral state that self-heals every few seconds should never be treated like data. The gate asks you to size the connection tier, prove the sync protocol, and assemble a live system from all three lessons.",
      "references": [
        "Rick Reed — Scaling to Millions of Simultaneous Connections (WhatsApp, Erlang Factory 2012)",
        "Discord Engineering — How Discord Stores Billions of Messages (2017); Maintaining Millions of Concurrent Connections",
        "Alex Xu — System Design Interview vol. 1, ch. 12 (chat system)",
        "Slack Engineering — Real-time Messaging (flannel / edge presence architecture talks)",
        "Martin Kleppmann — Designing Data-Intensive Applications, ch. 8 (unreliable networks, timeouts)"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u7l1",
          "title": "The Connection Problem",
          "estMinutes": 26,
          "builds_on": [
            "u1l2",
            "u4l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The arrow reverses",
              "body": "HTTP's shape — client opens, asks, gets an answer, closes — has quietly carried every design in this course, and it carries a hidden gift: **the server holds nothing between requests**. Unit 1's stateless tier, the thing that made scale-out trivial, is a direct consequence of the request/response direction. Real-time features break the direction: when Ana sends Ben a DM, the *server* has news for Ben, and Ben's device hasn't asked. Something must bridge the gap between 'the server knows now' and 'Ben's screen shows it now', and every bridge is a trade between three currencies: **notification latency** (how stale Ben's screen may be), **request load** (how often clients ask 'anything new?'), and **held state** (connections the server keeps open per user).\n\nThe bridges, in escalating commitment: **short polling** — the client asks every t seconds; pure request/response, no held state, latency and load set by t. **Long polling** — the client asks and the server *holds the request open* until news arrives or a timeout; latency collapses to near-zero, but the held request is a connection in all but name. **Server-sent events (SSE)** — one long-lived HTTP stream, server-to-client only; ideal for feeds of updates. **WebSocket** — one long-lived bidirectional connection; the full inversion, and the default for chat. The lesson's first job is to show, with arithmetic, why the polling end of this spectrum collapses at scale — and then to engineer what the persistent end actually costs: the gateway tier."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The polling trade (and why it forces connections)",
              "statement": "N clients short-polling every t seconds impose request rate R = N/t on the server, and news arriving at a random moment waits, in expectation, t/2 (worst case t) before the polling client sees it. Therefore achieving mean notification delay d with short polling costs R = N/(2d) requests per second — the product (delay × load) is fixed at N/2, and improving one degrades the other proportionally. Persistent connections break the trade: delivery latency becomes one network transit (~ms), and the recurring cost converts from CPU-heavy request processing at rate N/t to *held connection state* for N clients plus keepalive traffic at the (much longer) heartbeat interval.",
              "proof": "Each of N clients issues one request per t seconds: aggregate R = N/t. News for a given client arrives uniformly at random within that client's polling interval (arrival is independent of poll phase), so the wait until the next poll is uniform on [0, t]: mean t/2, maximum t. Setting mean delay d = t/2 gives t = 2d and R = N/(2d); thus R·d = N/2 — a constant of the workload, independent of any tuning. For the persistent alternative: delivery requires no client request (the server writes to the open connection), so delay is transit time; the standing costs are per-connection memory and file descriptors (state proportional to N, not to N/t), plus heartbeats at interval h ≫ t contributing N/h background messages — orders of magnitude below polling rates for equal freshness. ∎\n\nRun the numbers once and the conclusion is permanent: 10 M online users wanting 1-second freshness cost R = 10M/2 = **5 M requests/s** of polling — a fleet the size of a large product's entire traffic, ~all of it answering 'nothing yet'. The same 10 M users on WebSockets cost ~10 M held connections (a handful of gateway nodes, next block) and deliver in milliseconds. Short polling survives only where N is small or freshness is loose (an internal dashboard at t = 30 s); every consumer real-time product lives on the persistent side."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The connection gateway tier",
              "statement": "A **connection gateway** is a stateful edge service whose only jobs are: hold persistent connections (WebSocket/SSE) for online clients; authenticate them once at connect; maintain liveness via **heartbeats**; and shuttle small frames between clients and backend services. A **connection registry** maps user → (gateway node, connection id) — the routing table that lets any backend deliver to any online user — maintained by the gateways themselves (register on connect, deregister on disconnect, entries expiring on missed heartbeats so a crashed gateway's registrations self-clean). Gateways are deliberately *thin*: no business logic, minimal per-connection memory (tens of KB), so one node holds hundreds of thousands to millions of connections (WhatsApp's Erlang servers famously exceeded 1–2 M each). Everything behind the gateways remains stateless request/response — the inversion is contained at the edge, on purpose: the gateway tier is the one place in the architecture allowed to be stateful-per-user, so nothing else has to be."
            },
            {
              "type": "example",
              "heading": "Worked example: sizing Lens's gateway fleet",
              "body": "Lens DMs at the horizon: 100 M DAU, and (extract the assumption) ~20% online-connected at peak → **20 M concurrent connections**.\n\n**Memory**: a tuned WebSocket connection costs ~20–50 KB (kernel socket buffers + TLS state + userspace bookkeeping — take 35 KB): 20 M × 35 KB ≈ **700 GB fleet-wide** — 3 nodes' worth of RAM at 256 GB, but memory isn't the binding constraint. **Per-node ceiling**: file descriptors and event-loop throughput cap a well-tuned node around ~1 M connections; at a 60% utilization target (unit 1's headroom discipline — and here headroom is also *failover absorption*): 20 M / (1 M × 0.6) ≈ **34 nodes**, deployed across zones. **Traffic through a node**: 600 k connections × (1 message per user per few minutes + heartbeats at 30 s) ≈ ~25 k frames/s — light; gateways are connection-bound, not throughput-bound, which is exactly why they scale by connection count. **Registry**: 20 M entries of (user → node, conn id, expiry) ≈ a few GB in a replicated KV store (unit 5's machinery; W=1/R=1-grade — registry staleness self-heals via heartbeat expiry and delivery retry, so the AP configuration is correct here), or sharded in-memory with the ring.\n\n**The failover walk** (the sizing's real test): one gateway node dies → 600 k clients disconnect and reconnect ~simultaneously. Reconnects are expensive (TLS handshake + auth + registry write ≈ real CPU): 600 k arriving over, say, 30 s of jittered backoff = 20 k connects/s against the surviving fleet — this, not steady state, is what the 40% headroom and the *jitter in the client's reconnect policy* (unit 1's backoff discipline, now load-bearing at fleet scale) were budgeted for. A fleet sized to 95% utilization survives steady state and dies at the first node failure — the unit-4 recovery lesson, wearing connections."
            },
            {
              "type": "example",
              "heading": "Worked example: delivering one frame",
              "body": "Ana (connected to gateway G7) sends Ben a DM; Ben is connected to G21. The full path, with each hop's justification:\n\n(1) Ana's frame arrives at **G7**, which does nothing smart — it forwards the send to the **message service** (stateless, request/response: the gateway stays thin). (2) The message service runs the whole unit-4 pipeline in miniature: validate, persist the message (the durable step — ack nothing before this), publish the event. (3) Delivery: look up Ben in the **registry** → (G21, conn 4471) → push the frame to G21 → G21 writes it down Ben's socket. Server-side transit: a few in-DC round trips ≈ **single-digit ms** (unit 1's table) — the latency the polling proposition promised. (4) Ben offline (no registry entry, or delivery to a stale entry fails)? The message is already durable; the delivery step *falls through to the notification pipeline* (unit 6's machinery — push notification, badge) and Ben's device syncs on next connect (next lesson's protocol). (5) Ana's device shows 'sent' when the service's ack (post-persist) returns — not when G7 receives the frame: acks mean durability, never proximity.\n\nTwo design invariants fell out of the walk, and they organize the next lesson: **the connection is a delivery optimization, never the source of truth** (persistence precedes any ack; a dropped socket loses nothing but freshness), and **every delivery has a fallback chain** — socket → push notification → sync-on-connect — so 'online' is an optimization tier, not a correctness condition."
            },
            {
              "type": "diagram",
              "kind": "graph",
              "directed": true,
              "height": 300,
              "caption": "The gateway tier contains the statefulness at the edge: thin gateways hold connections and consult the registry; everything behind them stays stateless request/response. Ben offline → delivery falls through to the notification pipeline (dashed).",
              "nodes": [
                {
                  "id": "ana",
                  "label": "Ana",
                  "x": 5,
                  "y": 25,
                  "tone": "gold"
                },
                {
                  "id": "ben",
                  "label": "Ben",
                  "x": 5,
                  "y": 75,
                  "tone": "gold"
                },
                {
                  "id": "g7",
                  "label": "Gateway G7",
                  "sub": "600k conns",
                  "x": 28,
                  "y": 25
                },
                {
                  "id": "g21",
                  "label": "Gateway G21",
                  "x": 28,
                  "y": 75
                },
                {
                  "id": "msg",
                  "label": "Message service",
                  "sub": "stateless",
                  "x": 55,
                  "y": 50,
                  "tone": "sage"
                },
                {
                  "id": "reg",
                  "label": "Registry",
                  "sub": "user → gateway",
                  "x": 78,
                  "y": 28,
                  "tone": "sage"
                },
                {
                  "id": "store",
                  "label": "Message store",
                  "x": 78,
                  "y": 62,
                  "tone": "sage"
                },
                {
                  "id": "notif",
                  "label": "Notification pipeline",
                  "x": 55,
                  "y": 92,
                  "tone": "rust"
                }
              ],
              "edges": [
                {
                  "from": "ana",
                  "to": "g7",
                  "label": "WS frame"
                },
                {
                  "from": "g7",
                  "to": "msg",
                  "label": "send"
                },
                {
                  "from": "msg",
                  "to": "store",
                  "label": "persist FIRST",
                  "bold": true
                },
                {
                  "from": "msg",
                  "to": "reg",
                  "label": "where is Ben?"
                },
                {
                  "from": "msg",
                  "to": "g21",
                  "label": "deliver"
                },
                {
                  "from": "g21",
                  "to": "ben",
                  "label": "push frame",
                  "bold": true
                },
                {
                  "from": "msg",
                  "to": "notif",
                  "label": "offline fallback",
                  "dashed": true,
                  "tone": "rust"
                }
              ]
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Connections are state, and every operational event becomes a mass-disconnect.** A deploy that restarts gateways doesn't 'roll' invisibly like a stateless tier — each restarted node severs hundreds of thousands of live connections, and severed clients reconnect in a storm (the thundering herd of unit 3, made of TLS handshakes). The disciplines: drain gateways slowly (stop accepting, let connections migrate over minutes, then restart); jittered exponential reconnect backoff *in the client*, shipped long before you need it (a client update takes weeks to reach the fleet — the one component you can't hotfix during the incident); and connect-rate limiting at the front door (unit 5's limiter guarding your own reconnect storm). Gateway deploys are capacity events; schedule them like one."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "An ops dashboard serves 2,000 internal users needing ≤ 5 s freshness; a consumer app serves 8 M online users needing ≤ 1 s. For each: compute the short-polling request rate, compare to a persistent-connection design, and give the verdict — including the one the arithmetic says is fine as polling.",
                  "solution": "Dashboard: mean delay 5 s → t = 10 s → R = 2,000/10 = **200 req/s** — trivial; persistent connections would save nothing measurable and add a gateway tier + registry + reconnect handling for 2,000 users. Verdict: short-poll (or SSE if trivially available); the proposition's product R·d = N/2 = 1,000 is just small. Consumer app: d = 1 s → t = 2 s → R = 8M/2 = **4 M req/s**, ~all answering 'nothing new' — an enormous fleet doing no useful work; persistent: 8 M connections ≈ 10–14 gateway nodes (at ~1 M × 0.6 each) with millisecond delivery. Verdict: connections, decisively. The graded skill is running BOTH numbers before choosing: N/2d against per-connection costs — polling is not 'wrong', it is priced, and at small N·(1/d) it is the cheaper correct answer (no registry, no reconnect storms, no stateful tier). The failure mode this exercise inoculates against is cargo-culting WebSockets onto a 2,000-user dashboard because 'real-time means WebSockets'.",
                  "hint": "R = N/(2d) for each. Then ask what the gateway tier costs to run for each N."
                },
                {
                  "prompt": "Size a gateway fleet: 30 M peak concurrent connections, 45 KB/connection, nodes cap at 900 k connections, 65% utilization target, zone-redundant across 3 zones such that losing a full zone leaves the survivors under 90% utilization. Give node count and placement, and show the zone-loss check.",
                  "solution": "Base: 30 M / (900 k × 0.65) ≈ 51.3 → 52 nodes ≈ 18 per zone × 3 = 54 for symmetry. Zone-loss check: losing a zone removes 18 nodes; 30 M connections re-land on 36 survivors → 30M/36 ≈ 833 k/node = 92.6% of the 900 k cap — **fails the ≤ 90% requirement**. Solve for n nodes total (n/3 per zone): 30M / (2n/3) ≤ 0.9 × 900 k → n ≥ 30M × 3 / (2 × 810 k) ≈ 55.6 → **57 nodes (19 per zone)**: after zone loss, 30M/38 ≈ 789 k = 87.7% ✓. Memory sanity: 30 M × 45 KB ≈ 1.35 TB fleet-wide — spread over 57 nodes ≈ 24 GB each: not binding. The structure to internalize: connection tiers are sized by the FAILOVER case (zone loss + reconnect storm absorption), not steady state — the same 1/(1−ρ) recovery logic as unit 4's queues, applied to sockets; and note the reconnect storm of a full ZONE (10 M clients) still needs jittered backoff spread over minutes to keep connect-rate within the survivors' handshake capacity — a second check the design must state.",
                  "hint": "Size for the survivors: (total connections)/(nodes remaining after zone loss) ≤ 0.9 × cap. Then sanity-check memory and the reconnect rate."
                },
                {
                  "prompt": "A team keeps the registry in a strongly consistent store 'because message delivery must be reliable', adding ~15 ms and an unavailability window during failovers to every send. Critique using the lesson's invariants, and specify the registry's actual consistency requirement.",
                  "solution": "The critique rests on the invariant: the connection is a delivery OPTIMIZATION; the message store is the source of truth. A stale registry entry costs one failed delivery attempt, which falls through the fallback chain (retry lookup → push notification → sync-on-connect) — the message is never lost, only its fast path. So the registry needs: fast reads on every send (it's on the hot path), high write availability at connect/disconnect storms (exactly when a strongly consistent store is degraded — failover windows coincide with reconnect storms, the worst possible correlation), and *self-healing* staleness: entries carry heartbeat-refreshed expiry, so a crashed gateway's registrations age out and a stale delivery attempt triggers re-lookup. That is an AP profile: unit 5's store at W=1/R=1-grade, or sharded in-memory maps. The 15 ms and the failover unavailability bought nothing — reliability was never the registry's job, and the strong store made the system LESS available by putting a CP component's failure modes on the hot path of every send. The general diagnosis (unit 2's map, again): consistency requirements attach to what a stale read COSTS — here, one retry — not to how important the feature sounds.",
                  "hint": "Walk what a stale registry entry actually costs, given the fallback chain. Then re-derive the requirement from that cost."
                },
                {
                  "prompt": "During a gateway deploy done wrong (all nodes restarted within 2 minutes), the platform suffered 25 minutes of degraded real-time delivery despite all nodes being back in 3 minutes. Reconstruct the mechanism using this unit's and unit 3–5's machinery, and list the four defenses that would each have shortened the incident.",
                  "solution": "Reconstruction: restarting everything severed ~all connections (say 20 M). Clients reconnected aggressively — without (or with too-weak) jitter, the reconnect offered load hit tens of thousands of TLS handshakes + auths + registry writes per second, far above the fleet's connect-rate capacity (handshakes are CPU-heavy — 10–100× a frame's cost). Queues at the gateways and the auth service grew (unit 4's ρ > 1: backlog); connects timed out; timed-out clients retried, ADDING load (retry amplification, unit 3's incident mechanism); the auth service's degradation spilled onto normal API logins (shared dependency). The system stabilized only when enough clients' exponential backoff stretched their retry intervals past the fleet's drain rate — 25 minutes of self-inflicted DDoS. Defenses, each individually shortening it: (1) staggered draining deploys (never sever more than a node's worth at once — converts one 20 M storm into 30 small absorbable ones); (2) jittered exponential backoff in the client, with a full-jitter first attempt spread over minutes for mass-disconnect events (flatten the offered curve below capacity); (3) connect-rate limiting / admission control at the front door (unit 5: reject-with-retry-after beyond X connects/s — fail fast and cheap instead of timing out expensively; protects auth); (4) auth-token resumption (reconnects present a short-lived resume token, skipping full auth — cuts per-reconnect cost several-fold, raising the storm capacity directly). The meta-lesson: statefulness at the edge means DEPLOYMENT is a load event; the deploy runbook is part of the architecture.",
                  "hint": "Follow the load: severed connections → reconnect rate vs handshake capacity → queues → timeouts → retries. Which knob attacks each stage?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u7l1-i1",
              "front": "The polling trade — formula and its fixed product?",
              "back": "N clients polling every t: load R = N/t, mean delay t/2 (worst t). So R·d = N/2 is FIXED — freshness and load trade linearly. 10 M users at 1 s freshness = 5 M req/s of mostly-empty polls: the arithmetic that forces persistent connections."
            },
            {
              "id": "u7l1-i2",
              "front": "What does a persistent connection convert the cost into?",
              "back": "From request rate N/t (CPU per poll) to held STATE: ~20–50 KB and a file descriptor per connection, plus heartbeats at long intervals. Delivery latency becomes one transit. Connection tiers scale by connection count, not throughput."
            },
            {
              "id": "u7l1-i3",
              "front": "The gateway tier's design rules?",
              "back": "Thin (no business logic — hold sockets, auth once, heartbeat, shuttle frames); ~1 M conns/node tuned; a registry (user → gateway, heartbeat-expiring entries) for routing; ALL statefulness contained at this edge so everything behind stays stateless request/response."
            },
            {
              "id": "u7l1-i4",
              "front": "The two delivery invariants of connection-based systems?",
              "back": "(1) The connection is an optimization, never the source of truth: persist BEFORE any ack; a dropped socket loses freshness, not data. (2) Every delivery has a fallback chain: socket → push notification → sync-on-connect — 'online' is a fast path, not a correctness condition."
            },
            {
              "id": "u7l1-i5",
              "front": "What consistency does the connection registry actually need?",
              "back": "AP-grade: stale entries cost one failed fast-path attempt (fallback chain absorbs it) and self-heal via heartbeat expiry. Strong consistency on the registry puts CP failure windows on every send's hot path — exactly during reconnect storms. Cost of a stale read, not importance, sets the requirement."
            },
            {
              "id": "u7l1-i6",
              "front": "Why are gateway deploys capacity events, and the four storm defenses?",
              "back": "Restarts sever live connections → reconnect storms of TLS+auth (10–100× frame cost) → queue/retry amplification. Defenses: staggered drains; client-side jittered exponential backoff (shipped in advance); connect-rate admission control; cheap resume tokens instead of full re-auth."
            }
          ]
        },
        {
          "id": "u7l2",
          "title": "Chat: Ordering, Sync, and Delivery States",
          "estMinutes": 28,
          "builds_on": [
            "u7l1",
            "u4l4",
            "u2l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The requirements chat actually has",
              "body": "*The Connection Problem* built the transport; this lesson builds the product on top: Lens DMs, scoped the unit-1 way. Functional: 1:1 and group conversations; text + media; delivery states (sent / delivered / read); history, searchable on-device; **multi-device** — a phone and a laptop seeing the same conversation identically. Non-functional, ranked: **no message ever lost** (durability absolute — a vanished message is the product's cardinal sin); **per-conversation order identical for all members** (Ana and Ben must see the same transcript; cross-conversation order is meaningless and therefore free — the unit-4 lesson about which pairs need ordering, arriving pre-answered); delivery latency < 1 s online (the transport's job); offline delivery complete and exact on reconnect; read/write ratio ≈ 1:few (each message written once, read by a handful — the *Three prompts* profile from unit 1, now being cashed).\n\nThat last number quietly rules out an entire architecture: chat is *not* a feed. The feed's 150:1 read dominance justified precomputing per-reader copies (fan-out on write); chat's ~1:1 ratio with bounded membership makes the **conversation itself the natural store** — one sequence of messages per conversation, which every member's device pulls from and stays in sync with. Unit 2 already sharded this exact table by conversation_id; unit 4 already gave per-key ordered lanes. What remains is the protocol that makes sync *exact* — and it rests on one small mechanism worth proving."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "Per-conversation sequence numbers give order and exact recovery",
              "statement": "Let the message service assign each accepted message in conversation c a sequence number seq(m) from a per-conversation counter that increments by exactly 1, atomically with the message's persistence. Then:\n\n(i) **Total order**: (c, seq) totally orders c's messages, and every member rendering by ascending seq displays the identical transcript.\n\n(ii) **Gap detection**: a device holding a set S of c's messages can detect incompleteness locally: S is complete up to its maximum iff the seqs in S are exactly {1, …, max(S)} — any hole is a missed message, detectable without asking the server.\n\n(iii) **Exact sync**: a device that was offline holding high-water mark h = max(S) recovers exactly the missed messages with one range query — 'c's messages with seq > h' — and after applying them is provably complete: no duplicates, no losses, regardless of how many deliveries were dropped, duplicated, or reordered in transit.",
              "proof": "(i) Integers under < are a total order; each message receives a distinct seq (increment-by-1 from a single per-conversation counter, atomic with persistence — two messages cannot receive the same value); rendering by seq is therefore the same sequence on every device. (ii) The counter emits consecutive integers starting at 1, so the set of ALL messages up to max(S) has seqs exactly {1,…,max(S)}; S equals that set iff it contains each of those integers — a local check (|S| = max(S) with distinct elements, or explicit hole-scan). Any transit failure (dropped push) manifests as a hole; any duplication as an already-present seq (idempotently ignored — set semantics). (iii) The server's range query returns precisely the messages with seq ∈ (h, current]; union with S (which is complete through h by the device's own check, per (ii)) yields seqs {1,…,current} — complete by (ii)'s criterion. Deliveries lost while offline are in the range; duplicates collapse by seq identity; reordering is repaired by the sort. ∎\n\nThe theorem is small but it is the entire sync story: the socket pushes are *best-effort acceleration* (any subset may arrive, in any order, twice), and correctness rides on seq + one range query at reconnect — the transport invariant of the last lesson ('the connection is never the source of truth') realized as protocol. Contrast the wrong designs it displaces: client-side timestamps (skewed clocks reorder transcripts — unit 5's clock lesson), server timestamps (ties + no gap detection), or UUIDs (unique but detect nothing)."
            },
            {
              "type": "example",
              "heading": "Worked example: one message, every failure door",
              "body": "Ana → Ben, walked with unit-4 rigor. Ana's device mints a **client message id** (idempotency key, unit 1 — minted once per logical send, reused on every retry) and sends over her socket. The message service: (1) dedup-checks the client id (retry of a send whose ack was lost → replay stored result — no double message); (2) in ONE transaction against c's shard (unit 2's conversation-sharded store): assign seq = counter+1, persist the message, record the client-id mapping (the corollary of unit 4, all three legs); (3) acks Ana — her UI flips to ✓ 'sent'. **Only now** does delivery begin: registry lookup → push frame to Ben's gateway(s) — note the plural: multi-device means Ben's phone AND laptop each hold connections, each receiving the frame; devices that miss it (asleep, dropped) are covered by (iii) at their next sync. Ben's device receives, persists locally, acks delivery → the service records per-device delivery state → Ana sees ✓✓ 'delivered' (delivered = *some device*; a per-device breakdown is product choice). Ben opens the conversation → his device sends a **read cursor** ('read through seq 47' — a high-water mark, not per-message events: one tiny state per (member, conversation), idempotent, monotonic — the badge-count lessons of unit 6 pre-applied) → Ana sees 'read'.\n\nEvery arrow has its failure answered by machinery already built: Ana's send retried (client id dedups); service crash mid-transaction (atomic — nothing half-persisted, retry re-runs); push lost (seq gap at Ben's next receive or sync repairs); read cursor lost (monotonic — next cursor supersedes); Ben offline entirely (notification pipeline fallback, unit 6, with chat's collapse rules: per-conversation collapse, transactional-grade for DMs)."
            },
            {
              "type": "diagram",
              "kind": "sequence",
              "caption": "The delivery-state ladder: ack-on-persist (✓), per-device delivery (✓✓), and the read cursor — each state owned by a different party, each transition idempotent and monotonic.",
              "actors": [
                "Ana",
                "Service",
                "Store",
                "Ben-phone",
                "Ben-laptop"
              ],
              "messages": [
                {
                  "from": "Ana",
                  "to": "Service",
                  "label": "send(client_id, text)"
                },
                {
                  "from": "Service",
                  "to": "Store",
                  "label": "TX: seq=48, persist, map client_id",
                  "tone": "sage"
                },
                {
                  "from": "Service",
                  "to": "Ana",
                  "label": "ack seq 48 → ✓ sent",
                  "tone": "sage"
                },
                {
                  "from": "Service",
                  "to": "Ben-phone",
                  "label": "push frame (seq 48)",
                  "tone": "gold"
                },
                {
                  "from": "Service",
                  "to": "Ben-laptop",
                  "label": "push frame (seq 48)",
                  "dashed": true,
                  "tone": "rust"
                },
                {
                  "note": "laptop asleep — frame lost; seq gap will repair at next sync"
                },
                {
                  "from": "Ben-phone",
                  "to": "Service",
                  "label": "delivered(48)",
                  "tone": "gold"
                },
                {
                  "from": "Service",
                  "to": "Ana",
                  "label": "✓✓ delivered",
                  "tone": "gold"
                },
                {
                  "from": "Ben-phone",
                  "to": "Service",
                  "label": "read cursor := 48"
                },
                {
                  "from": "Service",
                  "to": "Ana",
                  "label": "read",
                  "dashed": true
                },
                {
                  "from": "Ben-laptop",
                  "to": "Service",
                  "label": "later: sync since h=45 → [46,47,48]",
                  "dashed": true,
                  "tone": "sage"
                }
              ]
            },
            {
              "type": "example",
              "heading": "Worked example: the group-size spectrum re-runs fan-out economics",
              "body": "Groups stress the conversation model along one axis — membership M — and the analysis is unit 4's work equation with chat's constants. A message to a group of M costs: **write side** — one persist (the conversation store is shared: no per-member copy — this is the anti-feed choice paying off) plus M−1 *delivery attempts* (registry lookups + frames to online members, push notifications to offline ones). **Read side** — nothing precomputed; each device syncs the shared sequence.\n\nM = 8 (family chat): 7 delivery attempts per message — trivial. M = 500 (community): 499 attempts × message rate; a chatty group at 1 msg/s costs ~500 frames/s — noticeable but linear and bounded; delivery becomes a small fan-out job (unit 4's chunked worker, at-least-once, idempotent by seq). M = 50,000 (broadcast channel): 50 k attempts *per message* is a fan-out storm for content most members won't read promptly — the celebrity problem's exact shape, and the same hybrid answer: **stop pushing, let them pull**. Large channels flip delivery to *notify-lazily* (batched/collapsed notifications, no per-member frames) and members' devices sync the sequence when opened — plus unit 3's caching (the channel's recent page is one hot key, coalesced) because 50 k members opening after a post is a read stampede on one conversation shard. The spectrum's design output is a threshold M* (derived, like F*, from delivery-fleet rate × latency grant vs sync-read capacity ≈ hundreds-to-low-thousands) with the two modes on either side — the third time this course has derived push-vs-pull from the same inequality, which is the point: it is one idea wearing three systems."
            },
            {
              "type": "text",
              "heading": "History, media, and the storage bill",
              "body": "The message store is unit 2's design (shard by conversation_id, cluster by (conversation_id, seq) — the range query of the theorem is one contiguous scan) with retention economics worth making explicit. Messages are small (~300 B with metadata — the unit-1 estimate) but *forever*: users treat chat history as an archive, so the store grows monotonically — 800 M messages/day ≈ 250 GB/day ≈ 90 TB/year (the unit-1 arithmetic, now a line item), tiered the unit-2 way: hot recent partitions on fast storage, older ranges compressed and cold-tiered (per-conversation access skews overwhelmingly recent — the working-set lesson; Discord's public write-ups walk exactly this migration). Media rides the unit-3 pipeline unchanged: upload → object store, content-addressed, message carries the pointer; the CDN serves it (with signed URLs — DM media is private by construction, the revocation lesson pre-applied). On-device search: the client indexes its local copy — free, private, and offline-capable; server-side search is a *product decision to extract* (it requires the server to index content — a privacy posture change, and with end-to-end encryption it is structurally impossible: E2EE moves keys to devices, reducing the server to a blind router of ciphertext + the seq/sync machinery — which, note, still works: the theorem never looked inside a message)."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Multi-device is where naive chat designs die — audit every state against 'phone AND laptop'.** Delivery: per-device (the laptop's missed frame is invisible if 'delivered' is per-user). Read cursors: per-member but device-shared (reading on the phone must clear the laptop's badge — the cursor syncs *down* to devices too). Sync high-water marks: per-device (each device has its own h). Client message ids: per-logical-send (a message drafted on the phone and retried from the laptop after handoff is an edge worth deciding). Push notifications: suppressed for devices with live sockets that acked delivery, else duplicated ping-and-frame. The test that catches all of it: run every flow with two devices, one of them asleep — the asleep device is the adversary."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A chat startup assigns message order by server receive-timestamp (ms precision) instead of per-conversation counters. Enumerate three concrete user-visible bugs this ships, tie each to the property of the theorem it lacks, and explain what their 'fetch messages since timestamp T' sync misses.",
                  "solution": "Bug 1 — divergent transcripts: two messages in the same millisecond (or from two service instances with microsecond clock skew) tie or invert; different devices render different orders (violates (i): timestamps are neither distinct nor consistently ordered — no total order). Bug 2 — undetectable loss: a device that missed a push has NO way to know — timestamps are not consecutive, so absence leaves no hole (violates (ii): gap detection needs consecutive assignment; 'nothing between 10:01:02.113 and 10:01:02.507' is indistinguishable from 'nothing sent'). Bug 3 — sync boundary errors: 'since T' with ms precision either re-fetches boundary messages (≥ T: duplicates, needing dedup the client wasn't built for) or skips same-timestamp stragglers (> T: silent loss — a message persisted at T by a slower instance AFTER the sync read). And clock regression on a service instance (unit 5's NTP step) can assign an 'earlier' timestamp to a later message, breaking even the eventual order. What their sync misses structurally: completeness is unverifiable — the client can never prove it has everything (no (iii)); every fix (dedup sets, overlap windows, tombstone probes) is a partial re-invention of what seq gives by construction: distinct, consecutive, atomic-with-persist integers. One counter per conversation replaces all of it.",
                  "hint": "Test each theorem clause against timestamps: distinct? consecutive? atomic with persistence? What does each failure look like on screen?"
                },
                {
                  "prompt": "Derive the group-mode threshold M* for a platform where: the delivery fleet sustains 400 k frames/s at 30% allocatable to any single message's fan-out; the online-delivery grant is 2 s; large-channel pull syncs hit a per-conversation cache serving 50 k reads/s per hot channel with coalescing. Show both sides and state the operational rule.",
                  "solution": "Push-side bound: one message's fan-out must fit the grant within its fleet share: M* ≤ 400 k × 0.30 × 2 s = **240 k frames** — but that lets one channel monopolize 30% of delivery for 2 s; a saner per-message budget (say 5% share) gives M* ≈ 40 k. Pull-side check: above M*, members sync on open — a post to a 50 k channel followed by (say) 20% opening within a minute = 10 k syncs/min ≈ 170/s against the cached recent page (50 k/s capacity, coalesced): comfortable by 300×; even 100% opening in 10 s (5 k/s) holds. So the pull side is nowhere near binding and the push-side fairness budget dominates: **M* ≈ 30–40 k** with the 5% share, or lower if the fleet also carries DM traffic bursts (state the share as the real decision). Operational rule: conversations with M ≤ M* get per-member frame delivery + normal notifications; above M*, no per-member frames — lazy collapsed notifications + sync-on-open, recent page cached. Same derivation shape as F* (unit 4) and the same honest conclusion: the threshold is a budget allocation made visible, not a constant of nature — write down the share it assumes.",
                  "hint": "Push: fleet rate × per-message share × grant. Pull: opens/s vs cached-page capacity. Which binds?"
                },
                {
                  "prompt": "Design the offline-to-online reconnect sequence for a device that was off for 3 days, holding high-water marks for 40 conversations, during which 6 conversations got new messages (one gained 4,000 messages), 2 conversations were created, and 1 group removed this user. Specify the protocol messages, the order of operations, and the two places naive designs over-fetch or leak.",
                  "solution": "Protocol: (1) connect + auth (resume token, last lesson); (2) the device sends its conversation-state digest: {conversation_id: h} for its 40 known conversations; (3) the server diffs against authoritative state and returns a sync plan: per-conversation new-message counts and top seqs ({c₇: h=210→890, …}), the 2 new conversations (full metadata + initial page), and c₁₉: removed (a tombstoned membership — the device must drop local render access per current membership; unit 2's revocation enforced at sync). (4) The device fetches ranges — prioritized, which is the first over-fetch trap: naive designs pull ALL missed messages (4,000 for the big group) before rendering anything; correct designs fetch the most-recent PAGE of each active conversation first (what the user will see), background-fill the rest lazily (the archive can trickle — the conversation list becomes usable in one round trip). Gap integrity per the theorem: each fetched range unions with local state; holes trigger re-fetch. (5) Push down: read cursors that moved on OTHER devices (the user read things on their phone — the laptop's badges must clear), delivery acks owed upward. The second trap — the leak: the removed group. Naive: server returns 'c₁₉: h=340→512, here are the messages' because membership wasn't checked at sync time — delivering 3 days of a conversation the user was removed from: sync MUST filter every conversation and range against CURRENT membership (read-time enforcement, the course's revocation rule, at the sync endpoint — the one path that touches everything). Notification badge: recompute from synced state (unit 6's reconciliation-on-open), never trust incremental pushes across a 3-day gap.",
                  "hint": "Digest → diff → prioritized ranges → cursor down-sync. The traps: what renders first, and what does the server check per conversation before returning ranges?"
                },
                {
                  "prompt": "Product wants 'edit and delete messages, propagated to all members and devices.' Extend the seq protocol to support it without breaking the theorem's three guarantees, and state what 'delete' can and cannot promise — on-device and for E2EE deployments.",
                  "solution": "Extension: edits and deletes are NEW protocol events in the same sequence — an edit of message 47 is appended as seq 91: {type: edit, target: 47, new_body, version} — never an in-place mutation of seq 47's record. This preserves all three guarantees mechanically: order (i) — events are ordered like messages, and all devices apply edit-91 after original-47 (a device syncing from scratch applies both in seq order — convergent); gap detection (ii) and exact recovery (iii) — an edit/delete missed offline is just a hole in the range, repaired by the same range query (contrast in-place mutation: a device that synced seq 47 BEFORE the edit and was offline during it holds a stale body with NO detectable gap — mutation breaks (iii) silently, which is why append-only is forced, the unit-4 tombstone/versioning lesson as protocol). Devices materialize current state: message 47 renders its latest edit; deletes render as tombstones ('message deleted') or vanish per product choice. Conflict rule for racing edits: highest (seq) wins — the sequence IS the arbiter; no vectors needed because the server serializes per conversation. What delete promises: removal from server store (after tombstone propagation + retention window), removal from compliant clients' render and local stores on sync. What it cannot promise: recipients' devices already displayed/screenshotted it; a device offline FOREVER retains its copy; and under E2EE the server can't even verify client compliance — 'delete for everyone' is a cooperative protocol among clients, not an enforcement, and the product copy must not imply otherwise (extract the honest wording as a requirement). Retention/legal deletes additionally purge cold tiers and backups — unit 3's takedown ledger, applied to chat.",
                  "hint": "What operation shape keeps (iii) true for a device that was offline during the change? Then separate what the server controls from what recipients' devices already have."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u7l2-i1",
              "front": "Why is chat a conversation-model, not a feed-model, system?",
              "back": "Read/write ≈ 1:few with bounded membership: no read dominance to justify per-reader precomputed copies. One shared sequence per conversation, synced by member devices — the fan-out inequality with chat's constants choosing pull."
            },
            {
              "id": "u7l2-i2",
              "front": "Per-conversation seq numbers — the three guarantees?",
              "back": "(i) Total order: identical transcripts on every device (distinct consecutive ints, atomic with persist). (ii) Local gap detection: complete iff seqs = {1..max}. (iii) Exact sync: one range query 'seq > h' recovers precisely the missed messages — pushes are best-effort acceleration only."
            },
            {
              "id": "u7l2-i3",
              "front": "The delivery-state ladder and each state's semantics?",
              "back": "✓ sent = acked AFTER atomic persist (never before); ✓✓ delivered = some device acked receipt (per-device underneath); read = the member's read CURSOR (monotonic high-water mark per (member, conversation) — not per-message events) advanced past it. All idempotent, all monotonic."
            },
            {
              "id": "u7l2-i4",
              "front": "How do edits/deletes extend the protocol safely?",
              "back": "As appended events in the same sequence (edit of 47 = new seq 91 targeting 47) — never in-place mutation, which silently breaks exact recovery for offline devices. Racing edits: highest seq wins (the server-serialized sequence is the arbiter). Deletes = tombstones; 'delete for everyone' is cooperative, not enforced."
            },
            {
              "id": "u7l2-i5",
              "front": "The group-size spectrum's rule?",
              "back": "Delivery cost is M−1 attempts per message: small groups push per-member frames; above M* (derived from delivery-fleet share × latency grant vs cached sync-read capacity — same shape as F*), flip to notify-lazily + sync-on-open with the recent page cached. Push-vs-pull, third appearance."
            },
            {
              "id": "u7l2-i6",
              "front": "The multi-device audit and the sync-time security check?",
              "back": "Per-DEVICE: delivery acks, sync high-water marks. Per-MEMBER, device-synced: read cursors (phone read clears laptop badge). Test every flow with 'two devices, one asleep'. And sync must filter every conversation/range against CURRENT membership — else reconnect leaks conversations the user was removed from."
            }
          ]
        },
        {
          "id": "u7l3",
          "title": "Presence: State That Wants to Be Lost",
          "estMinutes": 24,
          "builds_on": [
            "u7l1",
            "u4l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The inverted workload",
              "body": "Presence — the green dot, 'last seen', 'Ana is typing…' — looks like a small feature and is routinely engineered like one more data pipeline: events, storage, delivery guarantees. That instinct is exactly backwards, and this lesson exists to invert it. Presence state has three defining properties that make it the *opposite* of every workload since unit 1. It is **self-healing**: the next heartbeat, the next keystroke, the next connect re-asserts the truth within seconds — any error's lifetime is one refresh interval. It is **loss-tolerant by definition**: a dropped 'typing' indicator harms no one; the product requirement is a *vibe*, not a ledger. And it is **high-frequency**: at 20 M concurrent users, presence transitions and heartbeats outnumber messages by orders of magnitude.\n\nPut those together and the engineering conclusions all flip sign: **at-most-once** delivery is correct (unit 4's ack-before-processing side, finally at home — a lost update is cheaper than any machinery to recover it, because the next update supersedes it anyway); **no durable storage** for live state (RAM at the edge; the only persisted artifact is 'last seen', written lazily); **shed under load** as the default overflow policy; and the design's real problem is not delivering presence reliably but **not drowning in it** — the fan-out of everyone's transitions to everyone's watchers is the number that can eat a fleet, and debouncing, subscription scoping, and piggybacking are the tools that keep it small."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Heartbeat presence",
              "statement": "A client is **online** iff the server has observed a liveness signal within the last T seconds (the timeout); signals arrive every h seconds (the heartbeat interval), with T = k·h for a small integer k (the tolerance — how many consecutive signals may be lost before the client is declared offline). Transitions: online→offline fires on timeout expiry (never on an explicit signal alone — crashed clients send no goodbye); offline→online fires on any signal. **Last seen** = the time of the last observed signal, persisted lazily. The signal need not be an application message: a healthy TCP/WebSocket connection with transport-level keepalives IS a liveness signal, which is why presence naturally lives at the gateway that already holds the connection."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The heartbeat trade: detection delay, false offlines, and load",
              "statement": "With heartbeat interval h, timeout T = k·h, and independent per-heartbeat loss probability p (network drops, scheduling delays):\n\n(i) **Detection delay**: a client that vanishes is marked offline after at most T = k·h (expected ≈ T − h/2);\n(ii) **False-offline rate**: a healthy client is wrongly marked offline when k consecutive heartbeats are lost: probability p^k per window — driven down geometrically by k;\n(iii) **Load**: N connected clients cost N/h signals/s fleet-wide.\n\nThe three pull in different directions: shrinking h sharpens detection and multiplies load; raising k suppresses false offlines and delays detection. There is no free point — (h, k) is chosen per product from what a late 'offline' costs versus what a flapping dot costs versus what N/h costs.",
              "proof": "(i) The server declares offline when no signal arrives for T: a client vanishing immediately after its last signal is detected at that signal's time + T; vanishing uniformly within an interval gives expectation T − h/2 (the last signal is on average h/2 old at vanish time). (ii) A healthy client is declared offline iff every one of the k heartbeats scheduled within a timeout window is lost; with independent losses that is p^k (correlated losses — a wifi blip longer than kh — are the residual, and they are true unreachability from the server's view). (iii) Each client emits 1/h signals per second; summing gives N/h. Independence of the three expressions in their governing parameters gives the stated trade structure. ∎\n\nWorked instantly: h = 30 s, k = 3 (T = 90 s), p = 1%: false-offline probability 10⁻⁶ per window (one spurious flap per ~million windows — invisible), detection within ~90 s, and 20 M clients cost 667 k signals/s — which sounds enormous until the next block moves almost all of it off the application layer entirely."
            },
            {
              "type": "example",
              "heading": "Worked example: presence at the gateway — the free lunch",
              "body": "The naive architecture routes 667 k heartbeats/s from clients through gateways to a presence service that updates a store — a firehose engineered at unit-4 standard for data nobody may ever read. The production architecture deletes almost all of it by **piggybacking**: the gateway already knows liveness — the connection is open, transport keepalives are flowing (WebSocket ping/pong at the protocol layer, costing no application message at all). So: each gateway tracks its own connections' liveness locally (RAM: a timestamp per connection it already holds); the **presence service** holds only a coarse aggregate — user → (online?, last-seen, gateway) — updated on *transitions* (connect, timeout, disconnect), not on heartbeats.\n\nThe arithmetic collapse: transitions per user per day ≈ dozens (app opens/closes, network changes) versus heartbeats ≈ 2,880/day — the presence service's write load drops from 667 k/s to (20 M × 30)/10⁵ ≈ **6 k transitions/s**: two orders of magnitude, bought by placing the observation where the state already lived (the course's oldest move — don't ship data to the computation when the computation can sit on the data). 'Last seen' persists from the same transitions, lazily batched (unit 4's view-counter machinery — a last-seen 30 s stale is inside any sane grant). The exercise of *reading* presence — the fan-out side — is where the remaining engineering lives, next."
            },
            {
              "type": "example",
              "heading": "Worked example: the fan-out that could eat the fleet — and the three knives",
              "body": "Delivering the green dot: when Ana comes online, who gets told? Her 300 contacts? Naively: every transition fans out to all contacts' devices — 6 k transitions/s × 300 = **1.8 M presence frames/s**, triple the entire message traffic, for dots mostly rendered in closed apps. The three knives, in the order they cut:\n\n**Subscription scoping** (the biggest): push presence only to devices *currently rendering it* — a client viewing its chat list subscribes to the ~30 visible contacts; closing the screen unsubscribes. Watchers-per-transition drops from 300 contacts to the handful actively watching: the 1.8 M/s collapses toward tens of thousands. Presence becomes a **subscription product** (materialized only where watched — unit 3's precompute inequality answering 'don't': ρ per (watcher, target) pair is tiny, so compute on demand for viewers only). **Debouncing**: a user on flaky mobile flaps online/offline every few seconds; raw delivery renders a strobing dot. Per-user transition smoothing (report offline only after stable-offline for ~30 s; coalesce flaps within a window) cuts transition volume ~severalfold and matches the product's actual question ('is Ana around?', not 'is Ana's TCP session up this instant'). **Batching**: subscribed deliveries piggyback on existing frames or flush on a ~2 s tick — presence latency of seconds is imperceptible, and batching turns per-transition frames into per-tick digests.\n\n'Typing…' is the same machinery at its extreme: scoped to the open conversation only, debounced at source (send 'typing' at most every 4 s while keys fall), TTL'd at the receiver (indicator self-clears in ~6 s — no 'stopped typing' message needed: absence IS the signal, the heartbeat pattern in miniature), at-most-once, never stored, shed first under any load. The whole feature is ~someone's afternoon *because* every guarantee was set to the cheapest setting the requirement permits — which is the lesson."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Presence is a privacy surface wearing a feature costume.** 'Last seen', online dots, and read receipts leak behavioral data users care about intensely — and every messenger has re-learned it: settings arrive (hide last-seen, per-contact visibility), and settings are *revocations* (unit 2's rule, once more): visibility checks belong at read/delivery time against current settings — a subscription established when Ana was visible must stop delivering when she hides — and the reciprocity rules products adopt ('hide yours, lose theirs') are product requirements to extract, not engineering afterthoughts. Cache visibility rules with revocation-grade invalidation, and fail toward *not showing*."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Real-time is complete as a layer: the gateway tier holds the inversion at the edge (with the polling arithmetic that forced it and the storm disciplines that keep it operable), chat rides sequence numbers and the sync theorem so that correctness never depends on any socket, and presence demonstrates the opposite discipline — recognizing state whose cheapest correct treatment is to let it be lost. Between them, the three lessons close the canonical-design arc: the course has now designed storage cores, social pipelines, and live systems, each derived from its requirement profile rather than pattern-matched. What no lesson has yet done is operate any of this — survive the failures, watch the metrics, migrate the schemas, and defend the whole design in review. That is the final unit's territory: production."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Choose (h, k) for two products and defend each: (a) a trading floor's 'counterparty desk online' indicator where a stale ONLINE costs real money (someone routes an urgent order to an empty desk) but a false OFFLINE merely prompts a phone call; (b) a social app's friend-list dots where flapping looks broken and nobody acts on the dot urgently. Then state which product could justify abandoning heartbeat-timeout presence entirely, and for what.",
                  "solution": "(a) The asymmetry: stale-online is the expensive direction → sharp detection: small T — h = 5 s, k = 2 (T = 10 s): vanished desks detected inside 10 s; false-offline at p = 1% is 10⁻⁴ per window — a rare spurious phone call, priced as acceptable; load N/h is fine at desk-count N. (b) Flapping is the expensive direction → suppress false transitions: h = 30 s, k = 3 (T = 90 s) PLUS debounced offline-reporting (stable-offline 60 s before the dot grays): detection lag of ~2 min is invisible for a social dot; false-offline ~10⁻⁶; load at social N dominates, so the long h is also the cheap choice. The general rule: identify which error direction the product punishes, point k (and debouncing) at that direction, and let h follow from load. Abandonment case: the trading floor could replace inference with FACT for a subset — desk presence derived from an authenticated hardware/session signal (badge-in, active order-entry session): where an authoritative source of the state exists, heartbeat inference is the fallback, not the design. Social apps have no such source — inference is the only game.",
                  "hint": "For each: which wrong answer costs more — showing present-when-gone, or absent-when-present? Set k and debouncing against THAT direction."
                },
                {
                  "prompt": "A presence service update ships per-heartbeat writes to a replicated store 'for accuracy' and at-least-once delivery of every transition to all subscribers 'for reliability'. Traffic: 25 M concurrent, h = 20 s, ~40 transitions/user/day, mean 4 active watchers per transition. Compute both loads, then re-derive the correct design's numbers and name the principle each 'improvement' violated.",
                  "solution": "As shipped: per-heartbeat writes = 25M/20 = **1.25 M writes/s** against a replicated store (×N replication amplification — a monster fleet for data that expires in 20 s); at-least-once transition delivery = (25M × 40)/10⁵ = 10 k transitions/s × 4 watchers = 40 k deliveries/s PLUS the dedup/retry machinery at-least-once demands (unit 4's corollary — dedup records for... green dots), and redelivered stale transitions can arrive AFTER newer ones, rendering wrong states unless versioned: reliability machinery actively making the product worse. Correct design: heartbeats terminate at gateways (transport keepalives — ~0 application load); the store sees transitions only: **10 k writes/s** (125× less), single-copy RAM + lazy last-seen persistence (self-healing state needs no durability — its 'restore' is the next heartbeat); delivery at-most-once, latest-state-wins (each frame carries current state + timestamp; receivers keep the newest — supersession IS the correctness mechanism, no dedup needed), batched on 2 s ticks: ~thousands of digest frames/s. Principles violated: (1) durability for self-healing state (its lifetime is one refresh — persistence buys nothing the next heartbeat doesn't); (2) at-least-once for supersedable data (the retry machinery protects updates whose loss the NEXT update repairs free — and reordered redelivery is worse than loss); (3) shipping observations off the node that already holds the state. The one-line diagnosis: they engineered presence as if it were messages — the exact inversion this lesson exists to prevent.",
                  "hint": "Compute both loads as shipped, then apply: gateway-local liveness, transition-only writes, at-most-once latest-wins delivery. What does each delta cost/save?"
                },
                {
                  "prompt": "Design 'typing…' for Lens group chats (M up to 500): emission rules, delivery scoping, receiver behavior, aggregate rendering ('3 people are typing'), and the load analysis showing why this feature must never touch the message pipeline. Include the one failure mode worth handling.",
                  "solution": "Emission: client sends a typing signal at most once per 4 s while input is active (source debounce — keystroke-rate emission would be absurd), directly over the socket, marked ephemeral (at-most-once: gateways forward without persistence, retry, or ack). Scoping: delivered ONLY to members with that conversation currently open (the subscription knife — in a 500-group, perhaps 3–15 people are looking; the other 485 get nothing, and their next open doesn't backfill stale typing state — it has no meaning in the past). Receiver: 'Ana typing' with TTL 6 s, self-clearing on expiry or on Ana's message arriving (the message supersedes the promise of one); no 'stopped typing' events exist — absence is the signal. Aggregate: the receiving client renders from its local set of live indicators ('Ana and 2 others…'); the server never aggregates — each indicator is independent ephemeral state, and client-side rendering means the aggregation logic ships in the UI where the product iterates it freely. Load: 500-group, 10 concurrent typists, 4 s debounce = 2.5 signals/s × ~10 open-viewers = 25 frames/s per very active group — noise; and because signals are at-most-once and shed-first, a load spike degrades typing dots invisibly while messages (durable pipeline, untouched) flow normally: the pipelines MUST be separate so the cheap feature can be dropped without touching the promise-bearing one (unit 4's shed policy needs a shed-able lane). Failure worth handling: the stuck indicator — Ana's 'typing' delivered, then her app crashes: no clear signal ever comes. The TTL already solves it (self-clears in 6 s) — which is the design's quiet elegance: expiry-based state needs no cleanup protocol, BECAUSE it was built to be lost.",
                  "hint": "Debounce at source, scope to open-viewers, TTL at receiver, aggregate client-side. Then: what happens on a load spike, and why must that not share the message lane?"
                },
                {
                  "prompt": "Lens ships 'hide my online status from everyone except close friends.' Walk a status change (Ana hides at 14:00, having been visible) through the presence system: every place her visibility is currently materialized, the propagation each needs, the reciprocity rule's enforcement point, and the residual leak an audit should flag.",
                  "solution": "Materialization inventory (the audit's first artifact): (1) active subscriptions — devices currently watching Ana's dot hold live subscription state at gateways/presence service: the settings change must revoke non-close-friend subscriptions NOW (revocation-grade: the subscription list is filtered against current visibility on change-commit, and delivery stops within the invalidation window — seconds); (2) rendered dots on watchers' screens — client state: the revocation must push a 'presence unavailable' (or offline-equivalent) frame to de-render, else screens show the pre-hide truth until next transition (a settings change IS a transition for delivery purposes); (3) the presence service's stored last-seen — reads after 14:00 must filter by viewer relationship (read-time enforcement: the check runs per-read against current settings + close-friends list, both cached with revocation-grade invalidation, failing toward hidden); (4) any derived surfaces — 'active now' rails, chat-header status: same read-time filter, same cache rules. Reciprocity ('hide yours, lose theirs' — extract whether Lens adopts it): enforced at READ time on Ana's own requests — her subscription requests for others' presence are denied while her setting is hidden; NOT by mutating others' data (it's a property of the viewing relationship, evaluated per read — cheap, always current). Residual leak the audit flags: **inference channels** — read receipts, 'typing…', delivery-state transitions (✓✓ appearing means her device is on), and last-seen visible to close friends being screenshot-shareable: hiding the dot without aligning receipts/typing to the same visibility rule leaks the same signal through adjacent features. The design ruling: presence visibility settings must govern the whole FAMILY of liveness signals, or the setting is cosmetic — and that scope decision is a product extraction, written down, not an engineering default.",
                  "hint": "Inventory every surface where 'Ana is online' exists right now (subscriptions, screens, stores, adjacent signals). Which need push-revocation vs read-time filtering — and what still leaks?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u7l3-i1",
              "front": "The three defining properties of presence state, and what they flip?",
              "back": "Self-healing (next heartbeat re-asserts truth), loss-tolerant (a dropped update harms nothing), high-frequency (heartbeats ≫ messages). Flips: at-most-once delivery is CORRECT, no durable storage for live state, shed-first under load — the inversion of every data pipeline before it."
            },
            {
              "id": "u7l3-i2",
              "front": "The heartbeat trade — three formulas?",
              "back": "Detection delay ≤ T = k·h; false-offline probability p^k per window (geometric in k); load N/h signals/s. Point k and debouncing at whichever error direction the product punishes; h follows from load."
            },
            {
              "id": "u7l3-i3",
              "front": "Why does presence live at the gateway, and what's the arithmetic win?",
              "back": "The gateway already holds the connection — transport keepalives ARE liveness; track locally, report only TRANSITIONS to the presence service. 667 k heartbeats/s → ~6 k transitions/s: two orders of magnitude, by placing observation where the state lives."
            },
            {
              "id": "u7l3-i4",
              "front": "The three knives that tame presence fan-out?",
              "back": "Subscription scoping (push only to devices currently RENDERING it — the biggest cut), debouncing (stable-offline windows kill flapping and cut transitions), batching (per-tick digests piggybacked on existing frames). Typing = the same machinery: scoped to the open conversation, source-debounced, receiver-TTL'd."
            },
            {
              "id": "u7l3-i5",
              "front": "Why at-most-once + latest-wins needs no dedup for presence?",
              "back": "Each frame carries current state; receivers keep the newest — SUPERSESSION is the correctness mechanism (the next update repairs any loss free). At-least-once would add dedup machinery AND reordered redelivery can render stale state: reliability machinery making it worse."
            },
            {
              "id": "u7l3-i6",
              "front": "Presence privacy — where do visibility settings enforce?",
              "back": "Revocation-shaped: push-revoke live subscriptions + de-render frames on change; read-time filtering (viewer relationship vs current settings) on last-seen and every derived surface; reciprocity evaluated per-read on the viewer's own requests. Audit inference channels — receipts/typing leak the same signal; the setting must govern the whole liveness family."
            }
          ]
        }
      ],
      "masteryCheck": {
        "id": "u7-check",
        "questions": [
          {
            "id": "u7q1",
            "type": "numeric",
            "prompt": "6 M online clients need a mean notification delay of 1.5 seconds via short polling. What aggregate request rate (requests/s) does this impose?",
            "answer": 2000000,
            "tolerance": 100000,
            "points": 1,
            "explanation": "Mean delay = t/2, so t = 3 s; R = N/t = 6,000,000/3 = 2 M requests/s — almost all answering 'nothing new'. The product R·d = N/2 is fixed: this is the arithmetic that forces persistent connections for large-N, tight-freshness products, converting the cost into ~6 M held connections (a handful of gateway nodes) instead."
          },
          {
            "id": "u7q2",
            "type": "numeric",
            "prompt": "A gateway fleet must hold 24 M concurrent connections. Nodes cap at 1 M connections and the design targets 60% utilization so failover and reconnect storms can be absorbed. How many nodes are required?",
            "answer": 40,
            "tolerance": 2,
            "points": 1,
            "explanation": "24 M / (1 M × 0.6) = 40 nodes. The 40% headroom is not waste — it is the failover absorption (a dead node's 600 k connections re-land on survivors) and reconnect-storm capacity (TLS handshakes cost 10–100× a frame). Connection tiers are sized by the failure case, not steady state."
          },
          {
            "id": "u7q3",
            "type": "short",
            "prompt": "In the chat sync protocol, what mechanism lets a device detect locally — without asking the server — that it is missing messages in a conversation? (Two or three words.)",
            "accept": [
              "sequence numbers",
              "sequence number gaps",
              "seq gaps",
              "gap detection via sequence numbers",
              "per-conversation sequence numbers",
              "consecutive sequence numbers"
            ],
            "points": 1,
            "explanation": "Consecutive per-conversation sequence numbers, assigned atomically with persistence: a device's set is complete up to max(S) iff its seqs are exactly {1..max(S)} — any hole is a missed message, detectable locally, and one range query 'seq > h' recovers exactly what's missing. Timestamps and UUIDs cannot do this: they are not consecutive, so absence leaves no evidence."
          },
          {
            "id": "u7q4",
            "type": "mcq",
            "prompt": "Which statement correctly explains why chat delivers via a shared conversation store while the social feed precomputes per-reader copies?",
            "options": [
              "Chat's read/write ratio is ~1:few with bounded membership, so per-reader copies buy nothing; the feed's 150:1 read dominance makes precomputed per-reader lists pay by the fan-out work equation",
              "Feeds require stronger consistency than chat, and per-reader copies are how strong consistency is achieved",
              "Chat messages are smaller than feed entries, so a shared store is only viable for small payloads",
              "WebSockets can only deliver from a shared store, while HTTP requires precomputed lists"
            ],
            "answer": 0,
            "points": 1,
            "explanation": "It is the precompute/fan-out inequality with different constants: the feed's extreme read dominance (ρ/ω ≈ 150) justifies paying E[F] writes per post to make reads one fetch; chat's ~1:1 ratio with bounded, enumerable membership makes the shared per-conversation sequence the cheap and correct shape (and large broadcast channels flip modes again at M*, exactly like celebrities at F*). Options b–d attach the difference to consistency, payload size, or transport — none of which is the driver; the ratio is."
          },
          {
            "id": "u7q5",
            "type": "proof",
            "prompt": "Prove the chat sync theorem: with per-conversation sequence numbers assigned consecutively (increment by exactly 1) and atomically with message persistence, show (a) all devices rendering by seq display identical transcripts; (b) a device can verify completeness locally; (c) a device holding contiguous history through high-water mark h, after fetching 'seq > h' from the server and unioning, is provably complete — even if socket pushes were dropped, duplicated, or reordered. (d) Exhibit the failure that breaks (c) if the counter can skip values (e.g. a crashed transaction burns a sequence number).",
            "rubric": [
              "(a) argued from distinctness + total order of integers: atomic increment-with-persist means no two messages share a seq, so ascending-seq rendering is the same total order everywhere",
              "(b) argued from consecutiveness: the set of all messages through max(S) has seqs exactly {1..max(S)}, so completeness is the local check 'no holes' (|S| = max with distinct seqs); any dropped push manifests as a detectable hole, duplicates collapse by seq identity",
              "(c) argued as a union: local contiguity through h + the server's exact range (h, current] yields {1..current}, which is complete by (b)'s criterion; transit failures are irrelevant because correctness rides on the store's range query, not on push delivery",
              "(d) constructs the skip failure: if seq 47 is burned (assigned but never persisted), every device forever sees a hole at 47 — gap detection cannot distinguish 'message missing' from 'number never used', so clients re-fetch indefinitely or must give up, destroying the completeness criterion; hence assignment must be atomic with persistence (no burned numbers), or the protocol needs explicit gap-fill markers/tombstones for burned values"
            ],
            "solution": "(a) The counter increments by 1 atomically with each persist: two messages cannot receive the same value (the increment and the row commit together — a failed transaction assigns nothing), so seqs are distinct integers, and distinct integers under < form a total order. Every device sorting by seq renders the same sequence — transcripts are identical. ∎ (b) Because assignment is consecutive from 1, the set of ALL persisted messages with seq ≤ max(S) has seqs exactly {1, 2, …, max(S)}. A device checks completeness locally: its seqs are distinct and fill {1..max(S)} (equivalently |S| = max(S)). A push lost in transit leaves a hole — detectable; a duplicated push presents an already-held seq — idempotently ignored; a reordered pair is repaired by the sort. ∎ (c) Let the device hold exactly {1..h} (verified by (b)). The server's range query returns exactly the persisted messages with seq ∈ (h, current] — the store is the source of truth, so this set is complete for the range regardless of what pushes were dropped/duplicated/reordered. The union holds seqs {1..h} ∪ (h..current] = {1..current}: complete by (b)'s criterion, with no duplicates (seq identity dedups the union). ∎ (d) Suppose the counter can burn values: seq 47 is allocated, the transaction crashes, message 47 never exists, and 48+ are assigned. Every device now permanently detects a hole at 47; the completeness criterion 'seqs = {1..max}' is unsatisfiable, and the client cannot distinguish 'I am missing message 47' (must re-fetch) from '47 never existed' (must ignore) — re-fetch loops or false incompleteness forever. This is why the theorem requires assignment ATOMIC with persistence (counter and row in one transaction: a crash assigns nothing); systems that cannot guarantee it must persist explicit tombstones for burned seqs ('47 = void') so the gap check treats them as filled. ∎",
            "points": 3,
            "explanation": "The proof is elementary — integers, pigeonhole-style counting, one union — and that is the point: the entire correctness of chat sync rides on one atomicity property (seq assigned with persist) plus arithmetic every device can check offline. Part (d) is the engineering heart: the difference between 'consecutive' and 'merely increasing' is the difference between a self-verifying protocol and an unfalsifiable one."
          },
          {
            "id": "u7q6",
            "type": "open",
            "prompt": "Design live audience interaction for a streaming platform: a broadcaster streams to 200 k concurrent viewers; viewers see a live chat (anyone can post; the room may produce 2,000 messages/s at peaks), live viewer count, and 'the broadcaster is live' notifications to 2 M followers when the stream starts. Deliver: (a) the connection architecture with fleet sizing (state your assumptions); (b) the chat design for a 200 k-member 'conversation' — what breaks from the DM model and what replaces it, including what each viewer actually receives at 2,000 msg/s; (c) the viewer-count and go-live notification designs with their guarantee classes; (d) the load-shedding priority order when the platform is overloaded, justified by this unit's principles.",
            "rubric": [
              "(a) Persistent connections justified by the polling arithmetic at 200 k viewers with sub-second interactivity; gateway fleet sized with stated assumptions (connections/node, utilization headroom for failover/reconnect storms — e.g. 200 k plus margin over ~1 M-conn nodes means a small fleet, but zone redundancy and storm absorption argued); registry/thin-gateway structure reused",
              "(b) Recognizes the DM model breaks twice: per-member delivery frames (200 k × 2,000/s is 400 M frames/s — impossible) and per-viewer rendering of 2,000 msg/s (unreadable): replaces with room-fanout via gateway-level multicast/subscription (one frame per gateway per tick, fanned locally) AND sampling/rate-limiting of what each viewer receives (a viewport-rate stream, e.g. ~10–20 msg/s sampled or ranked, with per-viewer posting rate-limited via unit-5 buckets); sequence numbers retained per room for the messages that ARE stored/replayed, or explicitly downgraded with the ephemerality argued as a stated product grant",
              "(c) Viewer count as a presence-style aggregate: gateway-local connection counts, aggregated on a tick (1–2 s), delivered at-most-once/latest-wins, display-rounded (the display grant); go-live notifications through unit-6 machinery: fan-out to 2 M followers as a notification-pipeline job (collapse per stream-start, per-user buckets, push-provider boundary residue policy) — NOT through chat connections; the burst (2 M pushes) sized/queued with unit-4 arithmetic",
              "(d) Shedding order derived from guarantee classes: typing/presence-grade ephemera first, then chat sampling degrades further (viewers receive fewer messages — at-most-once state, self-healing), viewer-count tick slows; NEVER shed: message persistence for the stored transcript (if promised), go-live transactional-ish notifications (or argued as shed-able with product grant), and the stream itself; the order justified by which data self-heals vs which is a promise",
              "Assumptions stated as numbers (connections/node, tick intervals, sample rates, notification burst arithmetic) and at least one explicit re-derivation from earlier units (fan-out inequality at M ≈ 200 k, the collapse/bucket bounds, or the burst-drain theorem for the go-live push wave)"
            ],
            "solution": "(a) Connections: 200 k viewers with sub-second chat need persistent connections (polling at d = 1 s would cost N/2d = 100 k req/s of empty polls and still feel laggy; connections cost 200 k × ~35 KB ≈ 7 GB — trivial). Fleet: at 1 M-conn nodes and 60% target, 200 k viewers is sub-one-node — but deploy ≥ 3 across zones for redundancy and reconnect-storm absorption (a node loss dumps its share; jittered client backoff shipped in advance), and the platform hosts many concurrent streams, so gateways are shared multi-tenant infrastructure sized on total platform concurrency. Thin gateways + registry as per the unit; viewers subscribe to the room on join. (b) The DM model breaks at both ends. Delivery: per-member frames = 200 k × 2,000/s = 4×10⁸ frames/s — dead on arrival; replace with **room multicast**: the chat service publishes each accepted message once to a room stream; each GATEWAY holding room subscribers receives one copy per tick and fans locally to its connections (per-message cross-fleet cost = gateway count, not viewer count — the M* flip taken to its limit: pure pull/multicast above the threshold). Consumption: 2,000 msg/s is unreadable — each viewer receives a **sampled/ranked slice** (~10–20 msg/s: random sample + always-include broadcaster/mod messages + the viewer's own), batched on ~500 ms ticks; posting is per-user rate-limited (token bucket: e.g. 1 msg/2 s, B = 3 — protection class, also the moderation surface). Room seq numbers still assigned at accept (order for those stored; the transcript/replay product decision is extracted: if VOD chat replay is promised, messages persist through the unit-2 store and the sampled LIVE view is a stated grant — viewers see a sample, the archive holds all). (c) Viewer count: presence economics — each gateway counts its room connections locally; an aggregator sums per 2 s tick; delivered at-most-once latest-wins to viewers, display-rounded ('198K') — the display grant makes ±1 k drift invisible; no durability (self-healing from live connections). Go-live: NOT a chat feature — a unit-6 notification job: stream-start event → notification pipeline → 2 M followers with per-user eligibility/preferences, collapse (one per stream-start), bucket class social-but-timely; the push wave is a burst job (2 M sends against provider rate limits — unit-4 drain arithmetic: at 50 k sends/s, a 40 s wave; acceptable for 'live now', stated), provider-boundary residue per unit 6 (loss-over-duplicate here: a missed go-live push is priced, a duplicate is annoying — argued, either direction defensible if stated). (d) Shedding order under overload, by self-healing class: (1) typing/reaction ephemera — gone first, invisibly; (2) chat sample rate degrades (viewers get 5 msg/s instead of 15 — at-most-once state, the product thins gracefully); (3) viewer-count tick slows to 10 s; (4) non-live notification classes defer. Never shed: stream media itself, message PERSISTENCE for accepted messages (if replay is promised — an accepted message is an artifact), moderation actions (safety class — revocation-shaped, fail closed), and payment-grade events. Justification: shed what supersedes itself, protect what is a promise — the unit's inversion principle applied as an ordered runbook.",
            "points": 3,
            "explanation": "The scenario forces every lesson at once at hostile scale: the polling arithmetic and gateway sizing (a), the fan-out inequality driven past M* into multicast plus the novel move — sampling the CONSUMPTION side when even correct delivery exceeds human bandwidth (b), presence-grade aggregates and unit-6 notification machinery at a 2 M burst (c), and a shedding runbook derived from guarantee classes rather than improvised (d). Grading rewards stated assumptions, re-derived thresholds, and the explicit separation of self-healing state from promises."
          }
        ]
      }
    },
    {
      "id": "u8",
      "title": "Production",
      "summary": "Failure as a design input: dependency arithmetic and blast radius, observability and error budgets, migrations that change the engine mid-flight, and the design review that ties the whole method together.",
      "intro": "Seven units built and assembled the systems; this unit makes them survivable, observable, changeable — and defensible. It is the difference between an architecture that works in the diagram and one that works in year three. The first lesson systematizes what every earlier unit handled locally: failure as arithmetic — hard versus soft dependencies, the serial-availability product that caps any design, blast radius, timeout budgets, and the retry discipline that keeps recovery from becoming the second outage. The second builds the instruments: the golden signals, error budgets and burn-rate alerting, the percentile-aggregation trap, and capacity planning as a forecast with lead times rather than a scramble. The third confronts the hardest operational truth — every schema, shard count, and service boundary you chose will someday need to change under live traffic — and builds the migration discipline: expand–contract with its compatibility invariant, dual-write and backfill with verification, and rollback-ability as a property you either preserve or knowingly destroy. The final lesson is the capstone the whole course has been rehearsing: the design review — presenting a design as a derivation, and dismantling one that isn't. The gate is exactly that review.",
      "references": [
        "Google — Site Reliability Engineering, chs. 3–6 (SLOs, error budgets), 22 (cascading failures); The SRE Workbook, ch. 5 (alerting on SLOs)",
        "Martin Kleppmann — Designing Data-Intensive Applications, ch. 4 (schema evolution, compatibility)",
        "Martin Fowler — StranglerFigApplication; ParallelChange (expand-contract) — martinfowler.com",
        "Dean & Barroso — The Tail at Scale (CACM 2013)",
        "Brandur Leach — Feature flags and progressive delivery practice (stripe.com/blog engineering archive)"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u8l1",
          "title": "Failure Arithmetic and Blast Radius",
          "estMinutes": 26,
          "builds_on": [
            "u1l3",
            "u3l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "From anecdotes to arithmetic",
              "body": "Every unit of this course has handled failure locally — the redundancy theorem (unit 1), the cold-cache cliff (unit 3), poison messages (unit 4), sloppy quorums (unit 5), the degradation ladder (unit 6), reconnect storms (unit 7). This lesson assembles those instincts into a discipline that can be run on any design in an afternoon: enumerate the dependencies, classify each as hard or soft, multiply out the availability ceiling, bound each failure's blast radius, and rehearse the walks. The organizing insight is the one unit 1 proved and everything since has echoed: **availability composes multiplicatively through serial dependencies and is rescued only by independence** — redundancy multiplies unavailabilities in parallel, but every *hard serial* dependency multiplies availabilities down. A design's availability is therefore not a property you add at the end with 'HA' checkboxes; it is the product of a list, and the design work is making that list short, soft, and independent."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Hard and soft dependencies, blast radius, failure domains",
              "statement": "A dependency of service S on component C is **hard** if C's unavailability makes S's core function unavailable (S cannot answer without C), and **soft** if S degrades but still serves (worse answers, missing features, stale data) — the distinction is a *design decision*, not a property of C: the same cache is hard if S has no fallback and soft if S falls through to the origin or serves degraded results. The **blast radius** of a failure is the fraction of users, requests, or functionality it takes down — bounded by partitioning the fleet (per-shard, per-zone, per-tenant isolation) so one failure's reach is 1/N, not 1. A **failure domain** is a set of components that fail together (a rack, a zone, a deploy wave, a config version, a certificate); redundancy counts only across domains — two replicas in one domain are one replica (unit 1's caveat, now a definition)."
            },
            {
              "type": "theorem",
              "kind": "theorem",
              "name": "Serial availability composition (and the soft-dependency escape)",
              "statement": "If service S has hard dependencies C₁ … C_n that fail independently, S's availability satisfies\n\n  A(S) ≤ A(S's own tier) × ∏ᵢ A(Cᵢ):\n\nten hard dependencies at 99.9% each cap S below 99.0% regardless of S's own quality. Converting dependency Cⱼ to soft removes A(Cⱼ) from the product entirely (replacing it with a *quality* cost during Cⱼ's downtime), so the availability ceiling is set by the count and quality of hard dependencies alone.",
              "proof": "S serves a request only if its own tier works AND every hard dependency works (by definition of hard: any one down blocks the core function). For independent failures, P(all up) is the product of the individual availabilities — hence the bound (an inequality because correlated failures only make it worse, and S's own tier includes whatever redundancy it deploys). Numerically: 0.999¹⁰ ≈ 0.990 — ten well-run hard dependencies donate ~9 nines-hours of monthly downtime to S before S's own code fails once. For the escape: if Cⱼ down no longer blocks S (S serves degraded — stale cache, absent recommendations, default config), then S's availability event no longer includes Cⱼ's, and the factor A(Cⱼ) leaves the product; what remains is a product over the (shorter) hard list. ∎\n\nTwo corollaries organize real architecture reviews. First, the **dependency budget**: a 99.95% target permits roughly one 99.99%-grade hard dependency's worth of donated downtime per handful — so the hard list must be *counted*, and every proposed addition ('the feed now calls the ML ranking service synchronously') must either bring 99.99%+ quality or arrive soft. Second, **softening is an engineering act, not a wish**: the fallback path must exist, be correct, be load-tested (unit 4's rate-bounded FoR fallback — a fallback that overloads its target is a second outage, unit 3's borrowed-capacity lesson), and be *exercised* — an untested fallback is a hard dependency wearing a costume."
            },
            {
              "type": "example",
              "heading": "Worked example: the Lens feed dependency audit",
              "body": "Run the discipline on unit 6's feed read path. Enumerate and classify:\n\n**Hard**: the gateway/LB tier (own tier — redundant across zones); the feed API fleet (own tier); the feed-list store (hard *as designed* — but unit 6 built the rate-bounded cache-first fallback, converting it to soft-with-degradation: partial feeds, higher latency); the block/audience filter's state (deliberately hard the OTHER way — fail closed: its unavailability blocks serving, by policy; so it stays on the hard list and must be engineered to 99.99%+: replicated in-memory, multi-zone). **Soft by construction**: hydration caches (miss → shard reads at degraded latency — soft while origin headroom holds, the audited condition); the scorer (→ chronological); counters/trending (→ hidden); CDN (→ slower media from origin-shield, catastrophically expensive but *available* — soft with a cost meter); notification, search, analytics (absent features, core untouched).\n\nThe product: own tier (say 99.99% with zone redundancy) × block-state (99.99%) × the *residual* hard slice of the list-store fallback (the fallback itself depends on the cache tier and shard headroom — audit it: call it 99.99% engineered) ≈ **99.97% ceiling** — meeting a 99.9% SLO with margin, and the margin is *legible*: every factor is a line item with an owner. Compare the same architecture with naive classifications — list store hard (99.9%), scorer hard (99.5% — it's a young ML service), counters hard (99.9%) — product ≈ 99.2%: the SLO missed *by architecture*, before any incident. Identical components; the difference is entirely which dependencies were engineered soft. That table — dependency, class, fallback, availability, owner — is the deliverable this lesson adds to every design."
            },
            {
              "type": "example",
              "heading": "Worked example: timeout budgets and the retry amplifier",
              "body": "Failure classification says what happens when a dependency dies; **timeout budgets** govern the messier case — a dependency that is merely *slow*, which is worse, because slowness propagates upstream as thread-pool exhaustion (Little's law: rising W at fixed λ inflates L until the pool is gone — unit 1's formula as a failure mechanism). The discipline: the edge's 500 ms budget is a **deadline propagated downstream** — each hop passes its remaining budget (500 → API 450 → feed-list 100 / hydration 150 → shard 80), and every call's timeout is set from the *budget*, not from folklore; a call that cannot finish inside the remaining deadline should fail *immediately* (there is no point starting a 200 ms query with 80 ms left). Nested wrongly — inner timeouts longer than outer — the outer layer gives up while inner work continues, burning capacity on answers nobody will receive.\n\nOnto slow dependencies, layer the **retry amplifier**: if every tier retries 3×, a request crossing 3 tiers can multiply into 3³ = 27 attempts at the bottom exactly when the bottom is slowest (the unit-3 incident, generalized). The discipline is a *retry budget*: retries happen at ONE designated layer per failure class (usually the edge, with idempotency keys per unit 1, jittered backoff per unit 3), inner tiers fail fast upward; plus **circuit breakers** at each client of a flaky dependency — after a threshold of failures, stop calling for a cooling window and serve the soft-dependency fallback immediately (converting repeated timeout-waits into instant degradation, and giving the dependency air to recover instead of a retry storm). The breaker is the mechanical enforcement of the soft classification: it is *how* 'degrade instead of wait' actually executes at 3 a.m."
            },
            {
              "type": "callout",
              "tone": "danger",
              "body": "**The failure walk is a rehearsal, not a document.** For each row of the dependency table, someone must have actually done the thing: killed the cache tier in staging and watched origin headroom hold; tripped the breaker and seen chronological feeds serve; drained a zone and measured the reconnect storm. Game days exist because the gap between 'the fallback exists' and 'the fallback works under load with the real config' is where outages live — and because the *humans* are part of the system: a runbook nobody has executed is a hypothesis, and an alert nobody has drilled is noise scheduled for the worst moment."
            },
            {
              "type": "checklist",
              "heading": "The failure-design checklist (run it on every design)",
              "items": [
                "Enumerate every dependency of the core function; classify each hard or soft, with the fallback named for every soft one",
                "Multiply the hard list's availabilities; compare the ceiling to the SLO with margin",
                "Verify redundancy counts only across failure domains — racks, zones, deploy waves, config pushes, certificates",
                "Propagate the edge deadline: every inner timeout nests inside its parent's remainder; serial chains sum within the parent",
                "Retries at ONE designated layer with idempotency keys and jittered backoff; circuit breakers at every client of a flaky dependency",
                "Bound each failure's blast radius: per-shard, per-zone, per-wave — and give outsized keys their own domain",
                "Rehearse: every fallback exercised under load in a game day within the last quarter; every runbook executed by a human"
              ]
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A checkout service has hard dependencies: auth (99.95%), inventory (99.9%), pricing (99.9%), payment gateway (99.9% external), fraud scoring (99.5%), and its own tier (99.99%). (a) Compute the availability ceiling. (b) The SLO is 99.9%. Propose the minimal set of soften-or-improve changes that meets it, with the product recomputed and each change's degraded-mode behavior stated.",
                  "solution": "(a) Product: 0.9999 × 0.9995 × 0.999 × 0.999 × 0.999 × 0.995 ≈ **0.9915 — about 99.15%**, missing 99.9% by ~6×: over 6 hours/month of donated downtime, dominated by fraud scoring (0.995 alone donates 3.6 h). (b) Attack the worst factors by softening: fraud scoring → soft: on unavailability, apply a conservative rules-based fallback (hold orders above a risk threshold for async review, pass small ones) — removes 0.995 from the product; degraded mode = slightly higher manual-review queue, stated and priced. Pricing → soft: serve last-known-good cached prices with a bounded staleness (unit 3's machinery; degraded mode = price changes lag minutes during pricing outages — extract product sign-off). Recompute: 0.9999 × 0.9995 × 0.999 × 0.999 ≈ **0.9974 — 99.74%**: still short! The remaining big factors are inventory and payment. Inventory cannot soften at CHECKOUT (overselling — unit 2's strong tier), so improve it: multi-zone replication to 99.99% engineering target. Payment is external and hard by nature: add a second provider with failover (parallel redundancy on the one dependency that can't soften: 1−(0.001)² if truly independent, ≈ 99.9999% for the pair, realistically 99.99% given correlated integration bugs). Final: 0.9999 × 0.9995 × 0.9999 × 0.999(pricing soft-residual ≈ dropped) × 0.9999 ≈ **99.92%** ✓. The lesson's shape: soften what the product can degrade, engineer or duplicate what it can't, and let the arithmetic — not vibes — pick which.",
                  "hint": "Multiply first; then for each factor ask 'can checkout still serve a degraded answer without this?' — soften those, and only engineer/duplicate the irreducibly hard ones."
                },
                {
                  "prompt": "An API's edge budget is 800 ms. The call tree: edge → orchestrator → (catalog ‖ reviews ‖ recommendations in parallel) → catalog additionally calls pricing serially. Current timeouts, set by folklore: orchestrator 1,000 ms; catalog 600 ms; pricing 500 ms; reviews 400 ms; recommendations 900 ms. Identify every violation of deadline discipline, then assign a correct budget tree with rationale, including which branch should be a breaker-protected soft dependency.",
                  "solution": "Violations: orchestrator (1,000) exceeds the edge's 800 — it can keep working 200 ms after the caller is gone; recommendations (900) exceeds both — worst offender, and it's the least essential branch; catalog (600) + pricing (500) serially can consume 1,100 inside a supposed 600 — the serial chain's inner timeout must fit the OUTER's remainder, so pricing's 500 is incoherent with catalog's 600 unless catalog's own work is ≤ 100. Correct tree, top-down from 800: edge 800 → orchestrator 700 (reserve 100 for edge overhead + serialization) → parallel branches each get ≤ 650 BUT sized by role: catalog 550 (core content — of which its own work ~150, pricing gets 350, and pricing failures beyond that fail fast up); reviews 300 (nice-to-have; a slow reviews tier shouldn't drag the page); recommendations 250 with a **circuit breaker + static fallback** ('popular items') — it is the classic soft dependency: personalized recs down = generic recs served, zero user-visible failure, and the breaker converts its bad days into instant fallbacks instead of 250 ms waits on every request. General rules extracted: budgets nest strictly (inner < outer's remainder, serial chains sum within their parent), parallel branches are budgeted by criticality not equality, deadlines propagate with the request, and any call that can't finish in the remaining budget fails immediately rather than starting.",
                  "hint": "Walk top-down: each node's timeout ≤ parent's remainder; serial children must SUM within the parent; then ask which branch the page can live without."
                },
                {
                  "prompt": "A platform runs active-active in 2 zones. Enumerate five failure domains that the two 'independent' zones may secretly share, give a historical-shaped incident for each, and state the audit question that exposes it.",
                  "solution": "(1) **The deploy pipeline**: both zones receive the same bad release (or config push) minutes apart — the most common correlated failure in industry postmortems; audit: 'what is the time gap and health-gate between zone rollouts?' — staged waves with bake time are the fix (a deploy wave IS a failure domain). (2) **Configuration/feature-flag store**: one global flag flip breaks both zones simultaneously; audit: 'can a single config write reach both zones inside one blast window?' — stage flags like code. (3) **Shared control plane / DNS / cert authority**: an expired certificate or DNS misconfiguration takes both zones at the same instant (certificates expire globally, not per-zone); audit: 'list everything with a global expiry or single admin surface.' (4) **A shared external dependency**: both zones call the same payment provider, auth service, or cloud-region-level service (zones in one region share regional services: IAM, metadata, sometimes power grid); audit: 'trace each hard dependency to its own failure domains — do both zones' paths converge anywhere?' (5) **The client population itself**: a mobile release with a crash loop or retry-storm bug hits all zones from outside (unit 7's reconnect storms are client-driven); audit: 'which failure modes originate in code we shipped to devices, and what admission control guards the doors?' The meta-answer: 'independent zones' is a claim about INFRASTRUCTURE; correlated failure lives in the layers above and beside it — software, config, time, and shared services — and the redundancy theorem's independence premise must be audited layer by layer, not assumed from the network diagram.",
                  "hint": "Think in layers above the hardware: code, config, certificates, external services, clients. What reaches both zones through one channel?"
                },
                {
                  "prompt": "Design the blast-radius architecture for Lens's feed-list store (unit 6: ~100 M users' lists on a ring-sharded memory fleet): partitioning choices, per-shard and per-zone bounds, how a bad deploy's radius differs from a bad node's, and the one place where per-user isolation is worth its cost.",
                  "solution": "Node failure: with consistent hashing + virtual nodes (unit 2), one node's death cold-starts ~1/N of users' lists (N ≈ 30: ~3.3% of users get fallback-served feeds while regeneration runs — the unit-6 ladder, radius 1/30). Bound regeneration load per the borrowed-capacity audit; replicate each list to 2 cache nodes (radius per node → near 0 for reads, at 2× memory — a priced choice). Zone: spread nodes across 3 zones so zone loss = 1/3 radius at worst, absorbed by replication placement (replicas never share a zone — failure-domain-aware placement, the definition applied). Bad DEPLOY is the different beast: a code bug reaches ALL nodes on the rollout schedule — radius controlled by wave structure, not sharding: canary 1 node (radius 3%) → bake against golden signals → wave by zone with gates; plus the client-side kill switch (serve FoR fallback fleet-wide) as the deploy-independent escape. The contrast to internalize: sharding bounds DATA-PLANE radius (node/zone events); only staged rollout bounds CONTROL-PLANE radius (code/config events) — a perfectly sharded fleet with a big-bang deploy has a blast radius of 1.0 several times a week. Per-user isolation worth buying: the CELEBRITY lists (unit 4's F* accounts) — a few thousand keys whose loss/corruption degrades millions of feeds (every follower's merge path): pin them to a dedicated replicated shard-set with stricter change control and their own canary — tenant isolation priced by blast radius per key, the rare case where a key EARNS its own failure domain.",
                  "hint": "Separate data-plane radius (what sharding/replication bound) from control-plane radius (what only deploy waves bound). Then ask which few keys have a radius far above their size."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u8l1-i1",
              "front": "Hard vs soft dependency — and why it's a design decision?",
              "back": "Hard: its downtime blocks the core function. Soft: service degrades but serves (stale, partial, default). The same cache is hard without a fallback and soft with one — softening is engineering (a correct, load-tested, EXERCISED fallback), not classification."
            },
            {
              "id": "u8l1-i2",
              "front": "Serial availability composition — formula and corollary?",
              "back": "A(S) ≤ A(own tier) × ∏ A(hard deps): ten 99.9% hard deps cap S below 99.0%. Corollary — the dependency budget: count the hard list; every addition must arrive 99.99%-grade or soft. Softening removes its factor from the product entirely."
            },
            {
              "id": "u8l1-i3",
              "front": "Timeout budget discipline?",
              "back": "The edge SLO is a deadline propagated downstream: each hop passes remaining budget; inner timeouts nest strictly inside outer (serial chains sum within parent); a call that can't finish in the remainder fails immediately. Wrong nesting burns capacity on answers nobody receives."
            },
            {
              "id": "u8l1-i4",
              "front": "The retry amplifier and its two disciplines?",
              "back": "Per-tier retries multiply: 3 tiers × 3 retries = 27 bottom attempts at the worst moment. Fix: retry at ONE designated layer (edge, idempotent, jittered backoff), inner tiers fail fast; circuit breakers convert repeated waits into instant fallbacks and give the dependency air."
            },
            {
              "id": "u8l1-i5",
              "front": "Data-plane vs control-plane blast radius?",
              "back": "Sharding/replication/zone-spread bound data-plane radius (node, zone events → 1/N). Only staged rollout with canaries, bake gates, and wave structure bounds control-plane radius (code, config, flags, certs) — deploy waves and config pushes ARE failure domains reaching every shard at once."
            },
            {
              "id": "u8l1-i6",
              "front": "What makes a failure walk real rather than paperwork?",
              "back": "Rehearsal: the fallback actually exercised under load (game days) — cache killed in staging, breaker tripped, zone drained, runbook executed by a human. The gap between 'exists' and 'works under real config and load' is where outages live."
            }
          ]
        },
        {
          "id": "u8l2",
          "title": "Observability, Error Budgets, and Capacity",
          "estMinutes": 25,
          "builds_on": [
            "u8l1",
            "u1l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Instruments before incidents",
              "body": "Unit 1 defined SLIs and SLOs as requirements; this lesson builds the instrument panel that makes them operable — because an SLO nobody measures is a wish, and a dashboard nobody can interpret at 3 a.m. is decoration. The frame is Google SRE's **four golden signals**, which are exactly the quantities this course's arithmetic has been computing all along, now as time series: **latency** (as percentile distributions, never averages — the unit-1 lesson, with a new trap below), **traffic** (the λ of every Little's-law and burst calculation), **errors** (the SLI's complement, sliced by class — a 500 is not a 429), and **saturation** (how close each resource is to its ceiling: the ρ of unit 4, the headroom of every sizing exercise — the *leading* indicator the other three lag). Everything else — logs, traces, per-component metrics — exists to answer the question these four raise: *what changed, and where?* Traces especially: in a system that is now ten services deep, the request-scoped trace (one id propagated with the deadline of last lesson, spans per hop) is what converts 'p99 is up' into 'p99 is up because the hydration path's shard 7 is slow' in minutes instead of meetings."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Error budgets and burn rate",
              "statement": "For an SLO of target fraction s over window W (e.g. 99.9% over 30 days), the **error budget** is the permitted unreliability: B = (1 − s) × W of bad time (or bad-request fraction) — for 99.9%/30 d, 43.2 minutes. The **burn rate** r of an ongoing incident is the rate of budget consumption relative to the sustainable pace: r = (current bad fraction)/(1 − s); at burn rate r, the whole window's budget exhausts in W/r. Burn-rate **alerting** replaces threshold alerts: page when the budget is being consumed fast enough to matter — conventionally a fast window (e.g. r ≥ 14.4 over 1 h: 2% of a 30-day budget per hour) for sudden breakage and a slow window (r ≥ 3 over 6 h) for smoldering degradation, each requiring the condition to hold in both a long and short lookback so recovered blips self-clear. The budget is also a *policy instrument*: budget remaining funds risk (deploys, migrations, experiments); budget exhausted freezes it — converting reliability from a feelings negotiation into an account balance."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Percentiles do not average (aggregate histograms, not quantiles)",
              "statement": "The p99 of a merged workload is not any weighted mean of the per-shard p99s: for latency distributions F₁ … F_k with per-shard quantiles q₁ … q_k at level p, the merged distribution's quantile at level p can be far from Σwᵢqᵢ in either direction, and averaging quantiles has no statistical meaning. Correct aggregation requires merging the *distributions* (histograms/sketches) and reading the quantile from the merge.",
              "proof": "A counterexample suffices, and one suffices forever. Shard A: 99 requests at 10 ms, 1 at 1,000 ms → p99(A) = 10 ms (the 99th of 100 ordered values). Shard B: identical — p99(B) = 10 ms. Average of p99s: 10 ms. Merged: 200 requests, 198 at 10 ms, 2 at 1,000 ms → the 99th percentile boundary sits at the 198th value: p99(merged) = 10 ms here — now tilt the weights: let A serve 60 requests (59 × 10 ms, 1 × 1,000) and B serve 140 (137 × 10 ms, 3 × 1,000 ms) — p99(A) = 10, p99(B) ≈ 1,000 (the 139th of 140 ordered values is 1,000 ms); 'average p99' weighted by traffic = 0.3×10 + 0.7×1,000 = 703 ms, while the true merged p99 (200 values, 4 slow) = the 198th value = **1,000 ms**; reweight slow requests onto the small shard and the error flips sign. The mean-of-quantiles carries no information about how tail mass distributes across shards — only the merged distribution does. Practical corollary: export histograms (fixed or sketch-based buckets — t-digest/HDR-class) from every instance; merge histograms (bucket-wise addition, which IS valid); compute quantiles from the merged histogram. Dashboards that 'avg()' a p99 series across hosts are displaying a number with no referent. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: Lens's burn-rate alerts, configured",
              "body": "Feed SLO: 99.9% of requests under 500 ms, 30-day window → budget = 0.1% × 30 d = **43.2 minutes** of bad time (or 0.1% of requests, request-weighted — choose request-based: it self-adjusts for traffic).\n\n**Page (fast burn)**: bad-fraction ≥ 14.4 × 0.1% = 1.44% sustained over 1 h *and* over the trailing 5 min (the two-window guard: the 5-min leg makes the alert clear promptly when the incident ends; the 1-h leg keeps blips from paging). At 14.4×, the monthly budget dies in ~50 hours — this is 'wake someone'. **Ticket (slow burn)**: ≥ 3× over 6 h + trailing 30 min — a 3× burn kills the budget in 10 days: someone should look this week, not this minute. **No alert at all** on CPU, queue depth, or cache hit ratio *as pages* — those are causes, not symptoms: they become dashboard context and ticket-grade warnings (the unit-4 queue signals, the unit-3 hit-ratio floors) that explain a page, but the page itself fires on what users experience (the SLI). This is the alerting philosophy in one line: **page on symptoms, diagnose with causes** — because cause-based pages either fire when users are fine (fatigue → ignored pager → the real one missed) or stay silent while users suffer through a cause nobody predicted.\n\nOne Lens-specific subtlety: the SLI must be measured where users are — at the edge/client, not the API tier (a gateway-tier outage is invisible to API-side metrics: the requests never arrive; unit 7's fleet made this failure mode live). Synthetic probes from outside close that hole."
            },
            {
              "type": "example",
              "heading": "Worked example: capacity planning as a dated forecast",
              "body": "Capacity planning is the arithmetic of unit 1 run *forward* with lead times attached. Lens's shard fleet: current peak 140 k reads/s against 200 k/s capacity (ρ = 0.70 — at the headroom target). Growth: traffic ×1.8/year (product forecast — a stated, revisable assumption). Question: *when* does peak cross the 70% line, and what must be true before then?\n\nPeak(t) = 140 k × 1.8^t → crosses 140 k → 200 k × 0.7 = 140 k... it is AT the line now; crosses absolute capacity (200 k) at t = ln(200/140)/ln(1.8) ≈ 0.61 yr ≈ **7 months**. Lead time to add capacity: hardware/quota 6–10 weeks, plus the resharding migration (next lesson) if shard *count* must grow: 8–12 weeks of careful work. So the decision point is **now minus already** — which is the point of the exercise: at ×1.8/year, '7 months of runway' is ~3 months of decision room after subtracting lead times, and the plan (order in month 1, migrate months 2–4, land at ρ = 0.5 with 14 months of new runway) gets written and dated. Two disciplines complete it: **load-test to the claimed capacity** — the 200 k/s figure must come from a test that includes the failure configuration (one zone down, cache cold — last lesson's walks), not from multiplying node specs; and **forecast the derived quantities too** — storage (unit 1's TB/year lines), connection counts (unit 7), log throughput — each with its own crossing date, because the resource that binds first is rarely the one everyone watches (the unit-1 binding-constraint discipline, now with dates on it)."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Alert fatigue is an availability risk, not an annoyance.** Every page that a human acknowledges-and-ignores trains the on-call to acknowledge-and-ignore; the pager that cried wolf is silent-equivalent on the night it matters. The hygiene loop: every page gets one of three verdicts in review — actionable (keep), not actionable but informative (demote to ticket/dashboard), noise (delete) — and a pager that fires more than a few times a week per rotation is itself an incident. The symmetric failure is quieter: dashboards accreting panels nobody can interpret. The test for both instruments is the same: *in the last real incident, did this alert or panel change what a responder did?* If not, it is cost — attention is the scarcest resource in the room at 3 a.m."
            },
            {
              "type": "decision",
              "heading": "Signal triage: where each measurement belongs",
              "rows": [
                ["SLI burn rate (latency/error SLO degrading now)", "Page — dual-window fast burn; ticket at slow burn"],
                ["Freshness-grant consumption (queue oldest-age at ~80% of grant)", "Page — a user-facing promise measured upstream"],
                ["A cause with derived arithmetic to a minutes-away cliff (hit ratio vs origin-saturation floor)", "Page — with the derivation documented on the alert"],
                ["Resource saturation trending toward capacity (CPU, disk, connections)", "Ticket + capacity-forecast input — leading indicator, not an emergency"],
                ["Queue depth, cache hit ratio, GC pauses, per-host anomalies", "Dashboard — diagnosis context for pages, never pages themselves"],
                ["Synthetic probes from outside the edge", "Page on failure — the only view that sees gateway-tier death"]
              ]
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "An API's SLO is 99.95% over 28 days. (a) Compute the error budget in minutes. (b) An incident runs at 2.5% bad-request rate: what is the burn rate, and how long until the budget is gone? (c) Design the two-tier burn alert (page + ticket) with thresholds and dual windows, and state what each tier's response mode is.",
                  "solution": "(a) B = (1 − 0.9995) × 28 d = 0.0005 × 40,320 min = **20.16 minutes** per 28 days. (b) Burn rate r = 0.025/0.0005 = **50×**; exhaustion in W/r = 28 d/50 ≈ **13.4 hours**. (c) Page tier: catch anything that would eat the month's budget in ~a day or less — r ≥ 14 sustained over 1 h AND over the trailing 5 min (fast clear); at 0.9995, that's bad-fraction ≥ 0.7%: response mode = immediate human intervention, incident process. Ticket tier: r ≥ 2–3 over 6 h AND trailing 30 min (budget death in 9–14 days): response = investigate within the working day, no page. Everything below burns slower than the budget replenishes in practice and belongs on dashboards. Note the design grammar: thresholds are expressed in BURN RATES (portable across SLOs), each tier pairs a long window (stability) with a short one (prompt clearing), and the response mode is part of the alert's definition — an alert without a designed response is a notification, not an alert.",
                  "hint": "B = (1−s)×W; r = bad-fraction/(1−s); exhaustion = W/r. Tiers: ~14× pages, ~3× tickets, dual windows each."
                },
                {
                  "prompt": "A dashboard shows 'p99 latency (avg across 40 hosts)' at a healthy 45 ms while support tickets report multi-second requests. Using the aggregation proposition, explain three distinct ways this display can be lying, and specify the correct pipeline from instance measurements to the dashboard number.",
                  "solution": "Lie 1 — mean-of-quantiles: the display averages 40 per-host p99s; tail mass concentrated on a few hosts (one bad disk, one hot shard) vanishes into the mean — the proposition's counterexample live: hosts at 10 ms p99 dilute one host at 4,000 ms into ~45 ms 'average p99'. Lie 2 — unweighted averaging: even if quantile-averaging were meaningful (it isn't), equal host weights misrepresent unequal traffic — a hot host's tail counts 1/40th regardless of serving 30% of requests. Lie 3 — per-host quantiles hide REQUEST-level structure entirely: if slow requests are a class (a specific endpoint, a specific tenant) spread thinly across all hosts, every host's p99 can be clean while the affected class's p99 is seconds (percentile-of-mixture vs mixture-of-percentiles, the same trap one level down — slice by endpoint/tenant, not just host). Correct pipeline: every instance exports a HISTOGRAM (fixed buckets or a mergeable sketch — HDR/t-digest class) per (endpoint, …) slice; the aggregation layer merges histograms by bucket-wise addition (valid, associative, weighting automatic since counts carry traffic); quantiles are computed from the MERGED histogram, per slice and overall; the dashboard reads those. Rule to keep: quantiles are computed last, merged never.",
                  "hint": "Who gets diluted: a bad host, a hot host, or a bad request-class? Then: what object CAN be validly merged, and where in the pipeline do quantiles get computed?"
                },
                {
                  "prompt": "Lens's on-call gets four recurring pages: (1) 'shard CPU > 85% for 10 min'; (2) 'feed SLI burn rate 15× over 1 h'; (3) 'cache hit ratio < 0.97'; (4) 'queue oldest-item age > 8 s on the fan-out queue' (freshness grant: 10 s). Triage each into page / ticket / dashboard using the symptom-vs-cause philosophy, with the reasoning — including the one that looks like a cause but is arguably a symptom.",
                  "solution": "(1) CPU: cause-class — high CPU with healthy SLIs is Tuesday (a batch job, a deploy warming); page only if it CO-OCCURS with symptom burn. Verdict: dashboard context + ticket if sustained (capacity signal for the forecast, last example). (2) Feed SLI burn 15×: the definitional page — users are experiencing it now, budget dying in ~2 days. Page. (3) Hit ratio < 0.97: cause-class BUT unit 3 derived that 0.975 is the floor where origin saturates — i.e. below it, a user-visible cliff is minutes away even if the SLI hasn't moved yet. Verdict: this is the legitimate 'leading indicator' exception — a cause promoted to page-grade because the derived arithmetic shows the symptom follows within minutes and the recovery action (warm/shed) is time-critical; document the derivation ON the alert. (4) Queue age 8 s vs a 10 s grant: the interesting one — it reads like an internal cause, but the grant IS a user-facing promise (followers see posts within 10 s), so oldest-age approaching the grant is a SYMPTOM of the freshness SLI, just measured upstream where it's cheap and early. Verdict: page at 8 s (80% of grant) with the burn-style dual window. The refined philosophy: page on symptoms, where 'symptom' means 'a user-facing promise measurably degrading' — including freshness grants and derived cliffs with documented arithmetic — and keep raw resource metrics as diagnosis, not pagers.",
                  "hint": "For each: is a user-facing promise degrading NOW or provably within minutes? Resource metrics page only via a documented derivation to a cliff."
                },
                {
                  "prompt": "Build the capacity one-pager for Lens's object storage and media pipeline at the 100 M-DAU horizon: current 2 PB stored growing 200 TB/month, transcode fleet at ρ = 0.55 with uploads growing ×1.6/year, CDN egress 2 PB/day at h = 0.98 with the contract renewing in 5 months. For each line: the crossing date (state your capacity assumptions), the lead time, and the dated decision. Which line is the sleeper?",
                  "solution": "Storage: at 200 TB/month against (assume) 4 PB provisioned: 10 months of runway; lead time for quota/cluster expansion 4–8 weeks → decision date ~month 7; but growth compounds with DAU — re-forecast quarterly, and the real line item is COST trajectory (200 TB/month × $/TB-month compounds forever — flag lifecycle policies: cold-tier old renditions, the unit-2 tiering lesson, as the cheaper-than-capacity move). Transcode: ρ = 0.55 at ×1.6/year crosses the 0.7 target at ln(0.7/0.55)/ln(1.6) ≈ 0.51 yr ≈ **6 months**; lead time short (stateless workers autoscale — weeks): decision = enable/verify autoscaling now, load-test the burst case (unit 4's evening-peak arithmetic), revisit at month 4. CDN: egress grows with DAU and the video mix (unit 3's arithmetic made egress the financially material number); the renewal in 5 months IS the crossing date — negotiating leverage requires 2–3 months of usage forecasting and a credible second-provider posture (multi-CDN readiness is a migration with its own lead time): start month 1. The sleeper: the CDN line — it has no technical alarm (nothing saturates; h = 0.98 is healthy) but a CONTRACTUAL crossing with the longest irreversible lead time, and a 1-point hit-ratio slip at renewal-scale egress (~20 TB/day origin delta at h 0.98→0.97) doubles origin costs silently. Capacity planning's full scope: bytes and CPUs, but also contracts, costs, and the migrations that changing either requires — every line with a date, an assumption, and an owner.",
                  "hint": "Three lines, three clocks: exponential growth vs a threshold, a fleet ratio vs its target, and a calendar date. Which one has no metric watching it?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u8l2-i1",
              "front": "The four golden signals — and which one leads?",
              "back": "Latency (percentile distributions), traffic (λ), errors (SLI complement, sliced by class), saturation (ρ/headroom per resource). Saturation LEADS — the other three lag it; it's every sizing ratio from the course, as a time series."
            },
            {
              "id": "u8l2-i2",
              "front": "Error budget and burn rate — definitions and the alert grammar?",
              "back": "Budget B = (1−s)×W (99.9%/30 d → 43.2 min). Burn rate r = bad-fraction/(1−s); exhaustion in W/r. Alerts in burn-rate units: ~14× dual-window (1 h + 5 min) pages; ~3× (6 h + 30 min) tickets. Budget remaining funds risk; exhausted freezes it."
            },
            {
              "id": "u8l2-i3",
              "front": "Why can't you average percentiles, and what's the valid pipeline?",
              "back": "Mean-of-quantiles carries no information about cross-shard tail mass (counterexample: clean hosts dilute a 1 s-tail host to a healthy 'avg p99'). Valid: export histograms/sketches per instance+slice → merge bucket-wise (traffic-weighting automatic) → compute quantiles from the merge. Quantiles last, merged never."
            },
            {
              "id": "u8l2-i4",
              "front": "Page on symptoms, diagnose with causes — with which two refinements?",
              "back": "Pages fire on user-facing promises degrading (SLI burn — including FRESHNESS grants measured upstream, like queue age at 80% of grant). Causes (CPU, depth, hit ratio) are dashboards/tickets — EXCEPT a cause with documented arithmetic to a minutes-away cliff (hit ratio vs the derived origin-saturation floor) earns page-grade."
            },
            {
              "id": "u8l2-i5",
              "front": "Capacity planning's grammar?",
              "back": "Forecast each resource forward (traffic, storage, connections, contracts, cost): crossing date vs its threshold, minus lead time (hardware, quota, MIGRATION work) = dated decision with an owner. Load-test claimed capacity in the failure configuration. The binding resource is rarely the watched one."
            },
            {
              "id": "u8l2-i6",
              "front": "The instrument-hygiene test?",
              "back": "For every alert and panel: in the last real incident, did it change what a responder did? Page verdicts in review: actionable / demote / delete; a pager firing more than a few times weekly is itself an incident — attention is the scarcest 3 a.m. resource."
            }
          ]
        },
        {
          "id": "u8l3",
          "title": "Migrations: Changing the Engine Mid-Flight",
          "estMinutes": 26,
          "builds_on": [
            "u8l1",
            "u2l3",
            "u4l4"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Everything you chose, you will someday change",
              "body": "Every design decision this course derived — the schema, the shard count, the store, the service boundaries — was derived *at a scale*, and scales change. Unit 2's resharding exercise and unit 4's log-repartitioning caveat were previews of this lesson's subject: **migration**, the discipline of changing load-bearing structure under live traffic, with no maintenance window, no data loss, and a working rollback at every step until the final one. Migrations are where systems actually die — not from load (the arithmetic warned you) but from change: the botched schema alteration, the dual-write that diverged, the cutover that couldn't be reversed.\n\nThe discipline rests on one constraint that every safe migration respects and every disaster violated: during a rolling deploy, **two versions of the code run simultaneously against one dataset** — and during a data migration, one version of the code runs against **two copies of the data**. Safety is therefore a *compatibility* property: every live (code, data) pair must work. The lesson builds the three canonical shapes — expand–contract for schemas, dual-write/backfill/cutover for data moves, strangler fig for service extraction — and the invariant is the same in all three, which is why it gets stated once, as a proposition, and then instantiated."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The expand–contract safety invariant",
              "statement": "Model a schema migration as a sequence of states (Dᵢ, {Vⱼ}) — data shape Dᵢ with the set of code versions {Vⱼ} concurrently live (rolling deploys mean |{Vⱼ}| ≥ 2 during every transition). The migration is safe iff **at every state, every live code version reads and writes the current data shape correctly**. The expand–contract sequence maintains this by construction:\n\n1. **Expand**: add the new structure additively (nullable column, new table, new field) — old code ignores it, new code can see it: both compatible.\n2. **Migrate writes**: deploy code writing both old and new structures (reading old) — compatible with old data and old code.\n3. **Backfill**: fill the new structure for historical rows (idempotent batch) — no code change.\n4. **Migrate reads**: deploy code reading the new structure (verified against the old — shadow reads) — both structures are complete, so either code version works.\n5. **Contract**: only when no live version touches the old structure, remove it — the ONLY step that breaks compatibility with any prior version, and therefore the only irreversible one.",
              "proof": "By case-walk on each transition's concurrent set. Step 1 changes data only, additively: old code's reads/writes touch only old columns (unaffected); the state (D_expanded, {V_old}) is compatible. Step 2's rollout runs {V_old, V_write-both} against D_expanded: V_old writes only old (new column stays null — legal, it's nullable); V_write-both writes both; readers of either version read old (still authoritative): compatible, and rollback = redeploy V_old (nothing depends on new yet). Step 3 changes data content, not shape, idempotently (backfill re-runs safely; unit-4's corollary applied to a batch): any live version unaffected — reads still serve from old. Step 4 runs {V_write-both, V_read-new}: both structures are complete and kept synchronized by write-both, so reads from either are correct; discrepancies are caught BEFORE the flip by shadow reads (read both, compare, alert — serving old); rollback = read old again, still possible. Step 5 removes the old structure only after {V_read-new} is the entire live set and a soak period proves no residual reader: the prior states' compatibility is destroyed by design — which is why contract is gated, delayed, and treated as the point of no return. At every state before 5, there exists a one-step rollback to a previously-verified state. ∎\n\nThe proposition generalizes beyond columns: 'structure' can be a new table, a new store (next example), a new service (strangler), a new event schema (unit 4's additive-evolution rule — expand–contract for the log's contract). The recurring failure it names: any step that combines two of these transitions (deploy code that writes ONLY new while old readers still run; drop a column in the same release that stops writing it) collapses the concurrent-compatibility set and turns a rolling deploy into a partial outage."
            },
            {
              "type": "example",
              "heading": "Worked example: Lens re-shards the photo store, for real",
              "body": "Unit 2's exercise sketched modulo→ring resharding; here is the full production shape, with the machinery the course has since built. Goal: photos metadata from 16 shards to 48, under 300/s writes and 200 k/s reads, zero downtime.\n\n**Phase 0 — routing indirection** (the precondition bought in unit 2): all access goes through a placement layer that can express 'key k: old = shard 7, new = shard 31, state = migrating'. **Phase 1 — dual-write**: writes commit to the old shard (authoritative) and mirror to the new placement asynchronously via the log (unit 4's CDC — NOT app-level dual-write, per unit 3's lesson: the log gives durability, ordering, and replayability for the mirror; app dual-writes diverge silently). Reads: old. **Phase 2 — backfill per ring-arc**: copy historical rows arc by arc (bounded units — progress tracking, pause/resume, the unit-2 plan), each arc verified by **checksum comparison** (row counts + content hashes old vs new; sampling for the paranoid tail). **Phase 3 — shadow reads**: for migrated arcs, read both, serve old, compare — the divergence rate IS the migration's correctness metric, driven to zero before any cutover (this is where the async mirror's lag discipline matters: compare at matched versions, unit 4's watermarks). **Phase 4 — read cutover per arc**: serve reads from new (old still written — instant rollback per arc by flipping the read bit). **Phase 5 — write cutover per arc**: new becomes authoritative, old becomes the mirror (rollback now = re-flip with the mirror re-primed). **Phase 6 — contract**: after a soak (a week of clean metrics), stop mirroring, reclaim old shards. Point of no return: contract, and only contract.\n\nCalendar honesty: at a copy budget that keeps production untouched (say 20% of iops), backfilling tens of TB takes days-to-weeks, and the soak adds more — resharding is a *quarter*, not a sprint, which is exactly why unit 2 told you to buy the ring early and why capacity planning (last lesson) must subtract this lead time from the runway."
            },
            {
              "type": "example",
              "heading": "Worked example: strangling the monolith's feed",
              "body": "Service extraction is the same proposition with 'structure' = code boundary. Lens's feed logic lives in the monolith; the team wants it out (independent scaling and deploys — a *paid-for* extraction per unit 1's rules: the feed's fleet-sizing and deploy cadence genuinely diverge from the monolith's). The strangler-fig sequence:\n\n**Expand**: stand up the feed service implementing the same behavior, backed by the same stores initially (no data migration entangled with the code migration — one transition at a time, the proposition's core warning). **Migrate calls**: route a slice of traffic through the new service — by endpoint, then by percentage (1% canary → 10% → 50%), the routing layer being the placement indirection of the last example wearing HTTP clothes. **Shadow**: for a period, mirror requests to both implementations and diff responses (the shadow read, at service granularity) — divergences are bugs found before users find them. **Contract**: when 100% flows through the service and a soak passes, delete the monolith's feed code. Rollback at every pre-contract step is a routing flip.\n\nThe anti-pattern this displaces is the big-bang rewrite: build in a branch for a year, cut over on a weekend, discover the 400 undocumented behaviors. The strangler's insight — shared with the ring's arcs and expand–contract's phases — is that **the routing layer makes change incremental and reversible**: find the indirection that ships the change in verifiable, rollbackable slices, and the slice size becomes your blast radius."
            },
            {
              "type": "text",
              "heading": "Verification, flags, and the rollback ledger",
              "body": "Three disciplines turn the shapes above from diagrams into safety. **Verification is a first-class phase, not a spot-check**: checksums on every backfilled unit, shadow-read divergence driven to measured zero, and reconciliation jobs (unit 2's template) running through the soak — a migration without a divergence metric is a hope with a schedule. **Feature flags are the routing layer for behavior**: every cutover above is a flag flip, which means flag hygiene is migration safety — flags are staged like deploys (canary → waves, last lesson), have owners and expiry dates (a stale flag is a dormant code path that WILL be flipped by accident — the config-as-failure-domain lesson), and the kill switch is tested before it is needed. **The rollback ledger**: for each phase, write down — before starting — what the rollback IS (flip which flag, re-prime which mirror), how long it takes, what it costs (data written to new-only during a botched write-cutover must flow back — the mirror running in reverse), and at which step it ceases to exist. The ledger's last line is the migration's true signature: everything before contract is an experiment; contract is a decision. Teams that internalize this fear only *unledgered* migrations — the correct fear, precisely calibrated."
            },
            {
              "type": "callout",
              "tone": "danger",
              "body": "**The contract step is where careers and data go to die — gate it like a production launch.** Every migration disaster postmortem contains one of: contracted while a forgotten reader (a cron job, an analytics pipeline, a sister team's service) still read the old structure; contracted before the soak surfaced the monthly batch job; contracted with the rollback ledger's last valid entry already stale. The gates: an access audit on the old structure (query logs, permissions — EMPTY for the soak window, not 'we think so'); the soak spanning every periodic consumer's cycle (that monthly job needs a month); and a named human signing the irreversibility. Speed is for the expand phases; contract is allowed to be slow."
            },
            {
              "type": "checklist",
              "heading": "The migration pre-flight (before phase 1 starts)",
              "items": [
                "One transition per step: no phase changes code and data shape in the same release; stacked migrations sequenced, never concurrent",
                "The rollback ledger written for every phase — what the rollback is, its duration and cost, and the step where it ceases to exist",
                "A divergence metric defined (checksums per unit, shadow-read comparison at matched watermarks) with the zero-gate before every cutover",
                "Cutovers behind flags, staged like deploys: canary slice, bake against golden signals, waves — with the kill switch tested first",
                "Backfills idempotent and resumable in bounded, trackable units",
                "The contract gate scheduled: access audit query written, soak window spanning every periodic consumer's cycle, irreversibility signer named",
                "Freshness/latency grants checked against every phase's worst case (drain pauses, dual-write overhead, backfill IO budget)"
              ]
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A team must rename `users.email_verified` (boolean) to a richer `users.verification_status` (enum: unverified/email/phone/both). Write the full expand–contract plan: each step's data shape, code version set, and rollback — and identify the two places naive plans break rolling deploys.",
                  "solution": "Step 1 Expand: add nullable `verification_status` column; no code change. Live set: {V0} on (old+new-null) — V0 ignores the new column: safe. Rollback: drop the column. Step 2 Write-both: deploy V1 writing BOTH (email_verified as before; status derived: verified→'email', else 'unverified'), reading old. Rolling set {V0, V1}: V0 writes only old (status stays null for its writes — legal, nullable); V1 writes both; all read old: safe. Rollback: redeploy V0. Step 3 Backfill: idempotent batch derives status for all rows where null. No code change; re-runnable. Step 4 Read-new: deploy V2 reading status (still writing both), after shadow-read comparison (log rows where derived-from-old ≠ status) reports zero divergence. Set {V1, V2}: both structures complete and synchronized; either read is correct: safe. Rollback: redeploy V1 (reads flip back). Step 5 Contract: after soak + access audit (no queries touch email_verified — check the BI warehouse and that one cron), deploy V3 (writes/reads status only), then drop the old column in a LATER release. Naive breaks: (a) renaming in place (or 'just alter the column') — the instant between schema change and code deploy has live code reading a column that no longer exists: partial outage scaled by deploy duration; (b) V3-and-drop in one release — during ITS rollout, {V2, V3} run while the drop lands: V2 still writes email_verified → writes fail. The rule both violate: one transition per step; code stops touching a structure at least one full release before the structure disappears.",
                  "hint": "Walk each step's concurrent {V} set against the data shape. The breaks hide where a single release changes both code AND shape."
                },
                {
                  "prompt": "During phase 3 (shadow reads) of the Lens reshard, the divergence metric shows 0.02% of comparisons mismatching — all on recently-written rows, all self-healing within seconds. During phase 5 (write cutover) planning, an engineer says 'the mirror lag means rollback after write-cutover could lose the last few seconds of writes.' Adjudicate both findings: expected artifact or blocker, and what each demands before proceeding.",
                  "solution": "Phase-3 finding: expected artifact of the ASYNC mirror — comparisons that catch a row between the old-shard commit and the log-mirror apply see matched-version skew; self-healing within seconds matches the mirror's lag SLO. Demands before proceeding: verify the mismatches are exclusively lag-shaped (compare at watermark-matched versions — re-compare after the mirror's watermark passes the row's commit LSN; persistent mismatches at matched versions are REAL divergence and block), and alert on the lag itself (a growing lag turns 'artifact' into 'stale copy'). Not a blocker; a characterized artifact with a monitor. Phase-5 finding: real, and it is the rollback LEDGER doing its job — after write-cutover, new is authoritative and old is the mirror; rolling back means old resumes authority, and any writes the reverse mirror hasn't yet applied would be invisible (not lost — they're in the log — but the rollback isn't instant-clean). Demands: make the reverse mirror's lag part of the cutover gate (cut writes per arc only when reverse-mirror lag < X seconds; rollback procedure = pause writes to the arc for the lag window, drain, then flip — a seconds-long partial write pause, priced and documented in the ledger), and sequence write-cutover per arc so the blast radius of a botched flip is one arc. Adjudication grammar: neither finding is a surprise; both are the migration's instruments reporting — the difference between a migration and a gamble is that these numbers exist and gate the next phase.",
                  "hint": "For each: is the anomaly explained by a designed property (async lag) at its designed magnitude? What gate converts the residual risk into a priced, bounded procedure?"
                },
                {
                  "prompt": "A strangler extraction of the ordering service has run for 8 months: 70% of endpoints route to the new service, 30% still hit the monolith, both share the orders database, and the team now wants to also move the new service to its own database 'to finish the job.' Critique the plan's sequencing, using the proposition, and prescribe the correct order with its gates.",
                  "solution": "Critique: the plan stacks two migrations — code extraction (incomplete: 30% of endpoints still in the monolith) and data extraction (new DB) — and running them concurrently violates the one-transition-per-step rule at system scale: with endpoints split across TWO services and data split across TWO databases, the compatibility matrix becomes (2 services × 2 DBs × transitional states), cross-service transactions that today share one database (the monolith's remaining endpoints touching orders!) silently break, and every incident during the overlap has two migrations' worth of suspects. The 8-month 70% stall is itself the finding: a strangler stuck mid-way is carrying migration overhead (dual routing, shadow infra) with neither migration's payoff. Correct order: (1) FINISH the code strangle first — drive endpoint routing to 100%, monolith's order code contracted (access audit: nothing but the new service touches orders tables — this gate is precisely what makes step 2 sane); the shared DB is fine during this: one data shape, two code paths, the proposition's happy case. (2) THEN the data migration as its own project with its own phases (dual-write via CDC, backfill, shadow, cutover, contract — the reshard shape verbatim, single owner: the new service). Gates between: the access audit proving exclusive ownership (the strangle's contract IS the data migration's precondition), plus a soak. General law: migrations COMPOSE SEQUENTIALLY, never concurrently, and the contract gate of one is the expand precondition of the next — 'finishing the job' means finishing ONE job.",
                  "hint": "Count the concurrent transitional states under the combined plan. Which completed gate of migration 1 is migration 2's precondition?"
                },
                {
                  "prompt": "Write the rollback ledger for unit 4's log repartitioning (photo-events: 64 → 256 partitions, key = photo_id, per-key ordering must hold for consumers): the phases, each phase's rollback with cost, where per-key ordering is at risk, and the point of no return.",
                  "solution": "Phase 1 — create the 256-partition topic alongside (expand; rollback: delete it, cost zero). Phase 2 — dual-publish: producers write both topics (or a mirror job republishes old→new); consumers stay on old. Ordering risk #1: the mirror must preserve per-key order — republish per source-partition serially (keys don't cross old partitions, so old-partition order ⊇ per-key order). Rollback: stop dual-publish, cost zero. Phase 3 — consumer migration, group by group: each consumer group bootstraps on the new topic via snapshot + tail or offset-mapped cutover: pause the group, drain its old-topic lag to zero, record the matched watermark, resume on new from that watermark. Ordering risk #2 — THE risk: a key's events exist in both topics; per-key order survives IFF each group switches at a drained-and-matched watermark (no in-flight events for any key) — hence pause-drain-switch per group, never a live straddle. Rollback per group: reverse the procedure — cost: minutes of that group's staleness (check each consumer's grant covers the drain pause; the fan-out's 10 s grant means off-peak, fast drains). Phase 4 — producers stop dual-publishing once ALL groups are on new (audit: old topic's consumer list EMPTY through a soak). Rollback ends here. Phase 5 — contract: delete the old topic after its retention expires naturally — it is the rollback of last resort and it self-expires. Point of no return: the deletion — and note how cheap the ledger made irreversibility: the only destroyed thing is a topic whose data had already aged out.",
                  "hint": "Dual-publish (order-preserving mirror), then per-group pause-drain-switch at matched watermarks. What does each group's pause cost against ITS freshness grant?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u8l3-i1",
              "front": "The migration safety invariant?",
              "back": "At every state, every live (code version, data shape) pair works: rolling deploys run ≥2 code versions against one dataset; data moves run one code version against two copies. Safety = compatibility maintained through every transition — one transition per step."
            },
            {
              "id": "u8l3-i2",
              "front": "Expand–contract — the five steps and the only irreversible one?",
              "back": "Expand (additive structure) → write-both (read old) → backfill (idempotent) → read-new (after shadow-read zero-divergence) → contract (remove old — ONLY after code stopped touching it a release earlier, an access audit, and a soak covering every periodic consumer). Contract alone destroys rollback."
            },
            {
              "id": "u8l3-i3",
              "front": "The data-move shape (reshard/store change)?",
              "back": "Routing indirection → dual-write via CDC/log (never app-level — durability, order, replay) → backfill per bounded unit with checksums → shadow reads (divergence metric → zero at matched watermarks) → read cutover per unit (flag flip = rollback) → write cutover (gated on reverse-mirror lag) → soak → contract."
            },
            {
              "id": "u8l3-i4",
              "front": "The strangler fig — and the anti-pattern it displaces?",
              "back": "Stand up the new service on the SAME data (no entangled migrations) → route slices (endpoint, then %) through it → shadow-diff both implementations → contract the old code at 100% + soak. Routing indirection makes change incremental and reversible; the displaced anti-pattern is the big-bang rewrite-and-weekend-cutover."
            },
            {
              "id": "u8l3-i5",
              "front": "Why do migrations compose sequentially, never concurrently?",
              "back": "Stacked migrations multiply the compatibility matrix (services × stores × transitional states) and double every incident's suspect list; one migration's contract gate (e.g. exclusive data access proven by audit) is typically the NEXT one's expand precondition. Finish one job."
            },
            {
              "id": "u8l3-i6",
              "front": "The rollback ledger — what's written before each phase?",
              "back": "What the rollback IS (which flag, which mirror re-primed), its duration and cost (drain windows, staleness against grants), and the step where it ceases to exist. Everything pre-contract is an experiment; contract is a decision with a named signer, gated by access audits and full-cycle soaks."
            }
          ]
        },
        {
          "id": "u8l4",
          "title": "The Design Review",
          "estMinutes": 24,
          "builds_on": [
            "u8l1",
            "u1l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The method, performed",
              "body": "This course opened by claiming a design is a derivation; its final lesson is about performing that derivation for an audience whose job is disbelief — and sitting on the other side of the table, running the disbelief. The design review is not a formality layered onto engineering; it is the engineering practice that makes everything else in this course *stick*, because every rule taught here — pay for components, budget the ledgers, classify the dependencies, price the approximations — is exactly a question a reviewer asks. A design that survives the questions was derived; one that wilts was decorated.\n\nThe lesson has three parts: the artifact (the one-page design doc whose structure IS the method), the review itself (the question battery, and the failure patterns each question exposes), and the worked instances — one flawed design dismantled, and Lens's final architecture presented as the model. The gate then hands you the reviewer's chair."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The design document (the method as an artifact)",
              "statement": "A reviewable design doc is one page of structure plus appendices, in the derivation's order:\n\n1. **Requirements** — functional list; quantified, *ranked* non-functional targets; explicit assumptions and staleness/approximation grants (each grant a product sign-off, not an engineering default).\n2. **The numbers** — the capacity arithmetic: rates, bytes, concurrency, growth; the binding constraint named.\n3. **The design** — components in dependency order, each annotated with the requirement or number that pays for it; the two ledgers (latency, freshness) where flows are budgeted; data model, partition keys, consistency map.\n4. **Failure** — the dependency table (hard/soft, fallback, ceiling arithmetic); blast-radius bounds; the degradation ladder.\n5. **Evolution** — what changes at 10× scale (which constraint binds next); the migrations this design will someday need and what it pre-buys for them (indirections, logs, flags).\n6. **Alternatives considered** — the roads not taken, each with the number or requirement that closed it (the section that proves derivation happened; its absence is the tell of decoration).\n7. **Open questions** — what the author does not know, stated plainly (reviewers trust documents that know their own edges)."
            },
            {
              "type": "decision",
              "heading": "The reviewer's question battery — and what each exposes",
              "rows": [
                [
                  "\"What number pays for this component?\"",
                  "Decoration: boxes without binding constraints (cargo-culted caches, queues, microservices)"
                ],
                [
                  "\"What breaks first at 10× — show the arithmetic.\"",
                  "No capacity model: the design was drawn, not derived"
                ],
                [
                  "\"Walk me through this dependency being down at peak.\"",
                  "Unclassified dependencies; fallbacks that exist only as intentions"
                ],
                [
                  "\"Where is the write path? What happens when two of these race?\"",
                  "Read-path-only thinking: happy-path designs with no concurrency story"
                ],
                [
                  "\"What does the user see when this is 30 seconds stale — and who signed off?\"",
                  "Unpriced approximations: staleness grants assumed, never extracted"
                ],
                [
                  "\"How does this change ship — and roll back?\"",
                  "Unmigratable structure: no indirection, no flags, contract-first thinking"
                ],
                [
                  "\"What did you consider and reject, and why?\"",
                  "The single-option doc: solution-first attachment, no derivation trail"
                ],
                [
                  "\"Which of these guarantees survives a partition / a crash between steps 2 and 3?\"",
                  "Guarantee inflation: 'exactly-once', 'consistent', 'reliable' used as adjectives, not derivations"
                ]
              ]
            },
            {
              "type": "example",
              "heading": "Worked example: a design dismantled",
              "body": "A submitted design for 'activity history' (users browse their own past actions; 40 M DAU, ~30 actions/user/day): *'Actions publish to Kafka; a Flink job enriches them; they land in Cassandra (chosen for scale) AND Elasticsearch (for search); a Redis cluster caches everything; the API reads ES for queries and Cassandra as source of truth; exactly-once semantics ensure no duplicates; microservices for ingest, enrich, query, and admin.'*\n\nRun the battery. **What number pays for Cassandra?** 40 M × 30 = 1.2 B actions/day ≈ 12 k writes/s average — within a well-run relational cluster's range, and the access pattern (a user's own history, time-ordered) is a textbook (user_id, time DESC) clustered table; 'chosen for scale' names no number. **What pays for ES?** 'Search' — but the requirements say users *browse* (paginate) their history; search-within-history was never asked for. A requirement invented to justify a component: the tell-tale inversion. **The Redis cluster?** 'Caches everything' — a user's own history is read by that user alone: per-key ρ is tiny (unit 3's inequality says don't), and the DB's own caching covers the hot tail. **Exactly-once semantics?** The phrase is doing guarantee-inflation work: ask where the dedup record lives and what happens on a crash between the Cassandra write and the ES write — the answer (two stores, no shared transaction, unit 3's dual-write hazard verbatim) dissolves the claim; the honest design is at-least-once + idempotent (action id) writes, which the doc never says. **Four microservices?** For one team and one workload — four deploys, four on-calls, no divergent scaling need named.\n\nThe rebuilt design, derived: one service; actions into a relational store partitioned by user_id clustered by time (12 k/s writes, single-shard reads, cursor pagination from unit 1); ingestion through the existing event log with an idempotent consumer (unit 4's contract, stated); no cache until a measured hot spot pays for it; search deferred until the product asks. Five components became two, every survivor has a number, and — the reviewer's summary line — *the original design was an architecture in search of requirements; the replacement is requirements in possession of an architecture.*"
            },
            {
              "type": "example",
              "heading": "Worked example: Lens, the one-pager",
              "body": "The course's running example, compressed into the artifact — the summary the whole course has been writing:\n\n**Requirements**: photo sharing, follow graph, feed; 100 M DAU horizon; reads 150:1; p99 feed 500 ms; followers see posts ≤ 10 s (granted); poster sees own instantly; durability absolute; blocks enforced at read time; counts approximate (granted). **Numbers**: 15 k/s peak feed loads; 300/s posts; 2 PB/day media egress vs 300/s-scale metadata writes — *bytes dominate; the read path is the product*. **Design**: relational metadata sharded by owner (ring, virtual nodes) with (owner, created_at) clustering; media content-addressed in object storage behind CDN (immutability deletes invalidation); event log (outbox-fed) fanning to consumers — search, hashtag, trending, notifications, and the hybrid feed fan-out (F* ≈ 100–200 k derived from the freshness ledger and fleet fairness); capped feed lists on a ring-sharded memory tier; hydration caches at h ≈ 0.98; connection gateways + registry for DMs (conversation-model, per-conversation seqs); presence at the gateways, transitions-only. Both ledgers close: latency ≈ 370/500 ms, freshness 9/10 s. **Failure**: hard list = own tiers + block-state (fail-closed by policy); everything else soft with rehearsed fallbacks (FoR rate-bounded, chronological, hidden counts); ceiling ≈ 99.97% vs 99.9% SLO; celebrity keys isolated as their own blast domain. **Evolution**: at 10×, the fan-out fleet and feed-list memory bind first (arithmetic attached); pre-bought: the ring (reshard = arcs), the log (new consumers = replay), flags on every cutover. **Alternatives**: pure FoR (rejected — 150:1 and the scatter tail), pure FoW (rejected — celebrity term), global strong consistency (rejected — the map shows exactly one linearizable interaction). **Open**: multi-region active-active for the dynamic path; ranked-feed scoring costs.\n\nOne page. Every sentence traceable to a unit, every number to a derivation — which is the demonstration the course rests on: the method *scales down* to a page precisely because it was a derivation all along."
            },
            {
              "type": "text",
              "heading": "Reviewing well: the reviewer's own discipline",
              "body": "The battery exposes designs; a last set of norms keeps the review producing better systems rather than better defenses. **Attack the derivation, not the conclusion**: 'why is this cache here?' is a question; 'we always use Postgres' is not — a review that relitigates taste instead of auditing arithmetic teaches authors to write defensively and hide uncertainty, which is the opposite of section 7's purpose. **Reward stated ignorance**: the open-questions section is the doc's most information-dense part; a reviewer who punishes it will never see one again. **Demand the alternatives section but respect its verdicts**: if the author's rejection arithmetic is sound, the road not taken stays closed — re-opening it requires new numbers, not seniority. **Size the review to the blast radius**: a schema change inside one service merits a teammate's hour; a new hard dependency on the checkout path merits the full battery — review depth is itself a budget, allocated by the failure arithmetic of this unit. And the closing habit that compounds across a career: after every incident, re-read the design doc that shipped the system and ask which question, asked at review time, would have caught it — then add that question to your battery. The battery in this lesson is a starting stock; a principal engineer's real one is the accumulated residue of every postmortem they have read closely."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**The course, in one paragraph**: extract requirements until they are numbers; let the numbers name the binding constraint; add the smallest component that relieves it, and pay for every box; budget every path with a ledger; classify every dependency and rehearse its failure; price every approximation with a grant someone signed; keep every structure migratable; and write it all down so a skeptic can check the arithmetic. That is systems design. Everything else — the stores, the queues, the rings, the sketches — was instances."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Apply the question battery to this excerpt: 'We will use event sourcing for the user-profile service so we have a full audit trail, with CQRS read models in MongoDB, and Kubernetes-based microservices per bounded context (profiles, preferences, avatars). Kafka guarantees exactly-once processing. Profile reads are ~800/s, writes ~2/s.' Identify four distinct failure patterns and write the reviewer's question that exposes each.",
                  "solution": "(1) Decoration/unpaid components: 800 reads/s and TWO writes/s is a single relational table with a cache at most — event sourcing + CQRS + separate read models for a 2-writes/s entity answers no stated number. Question: 'What number pays for event sourcing here — what breaks in a plain table at 2 writes/s?' (2) Requirement inversion: 'full audit trail' — was auditability a stated requirement with a retention/consumer spec, or a justification recruited for the architecture? Question: 'Who consumes the audit trail, with what query pattern and retention — and did product ask for it, or did the pattern?' (An audit REQUIREMENT, if real, is served by an append-only log table at this scale.) (3) Guarantee inflation: 'Kafka guarantees exactly-once processing' — the guarantee is scoped to consume-transform-produce within Kafka; the profile store and read models live outside it. Question: 'If the consumer crashes after writing MongoDB but before committing its offset, what deduplicates the redelivery?' (4) Blast-radius/overhead inversion: three microservices (profiles, preferences, avatars) for one small team and one tiny workload = three deploys, three on-calls, network boundaries with partial-failure modes, for services whose scaling profiles are identical. Question: 'Which of these three has a scaling or deploy-cadence requirement that diverges from the others — and what does each network boundary cost you at 3 a.m.?' Honorable fifth: no ledger, no failure section — 800/s of reads through how many hops at what budget? The rebuilt design is a table, an index, a cache-if-measured, and an audit-log appendix — the exercise's meta-lesson being that the battery dismantles OVER-engineering as efficiently as under-engineering.",
                  "hint": "Check each component against a stated number; check each guarantee against a crash between two specific steps; check each service boundary against a divergent requirement."
                },
                {
                  "prompt": "Write the 'Evolution' section (design-doc part 5) for the URL shortener of unit 5, at honest depth: what binds at 10× and 100×, what the current design pre-buys for each migration, and the one structure that would be genuinely painful to change — with the expand-contract sketch for changing it anyway.",
                  "solution": "At 10× (120 k reads/s peak, 400 writes/s): nothing structural binds — the cache tier absorbs reads (h ≥ 0.99 holds; origin sees ~1.2 k/s), one relational cluster still holds writes and the ~6 TB/decade dataset; the pre-buy already present: cache + replicas make read capacity additive. At 100× (1.2 M reads/s, 4 k writes/s, global users): three things bind — (a) origin misses at 12 k/s exceed one primary: partition the code→URL table (pre-bought: codes are random/opaque — hash partitioning by code is trivial, no resharding pain since the ring can be introduced under a routing layer; the read path never does range queries, the easiest possible sharding case); (b) global p99 forces PoP-local serving (pre-bought: immutability — replicas anywhere are永 correct; edge caches of 301s already carry most of it); (c) the analytics pipeline's click volume (1.2 M events/s) needs the log partitioned wider (pre-bought: partition count headroom, unit 4's rule). The genuinely painful structure: **code length/alphabet** — 7-char base62 is baked into every issued URL forever; changing it (say, collision posture forces 8) cannot touch existing codes. Expand–contract anyway: expand — the resolver accepts BOTH lengths (routing on length is trivial and permanent); migrate writes — new issuance mints 8-char codes (flag-staged); no backfill (old codes are immutable contracts with the world — they live forever); contract — never fully: the 7-char read path is permanent, but it is a read-only, shrinking-relevance surface whose carrying cost is one length-branch. The honest lesson the section exists to teach: things you EMIT INTO THE WORLD (URLs, IDs, event schemas, API shapes) are the structures migration cannot fully reclaim — design their headroom first, because their contract step never comes.",
                  "hint": "Walk each component's 10×/100× number; then ask which artifact leaves your system and lives in the world's bookmarks — that one has no contract phase."
                },
                {
                  "prompt": "A reviewer and author deadlock: the author's doc rejects DynamoDB-style storage for a ledger service with sound reasoning (multi-key invariants → strong tier, per unit 5), but the reviewer — who is senior — keeps re-opening it ('we use Dynamo everywhere; relational won't scale'). Using this lesson's reviewer norms, resolve the deadlock: what does each party owe, and what settles it?",
                  "solution": "The norms assign burdens. The author's doc did its job: the alternatives section closed Dynamo with a requirement-based argument (a ledger's debit-credit invariant is a multi-key atomic transaction — the AP store's named wrong-tool case) — so under 'respect the alternatives section's verdicts,' RE-opening it requires new numbers, not seniority: the reviewer owes either a requirement the author missed (is the invariant actually per-key? could the ledger be modeled as single-key event streams with per-key balances — a real design alternative worth arithmetic) or a number (the projected write rate exceeding what a partitioned relational strong tier handles — with the arithmetic shown). 'We use it everywhere' is taste, and 'relational won't scale' is a claim with a missing number — the author is entitled to ask for it: at what write rate, against which partitioning scheme? The author owes, in turn, engagement with the strongest form of the challenge: the doc should show the scale ceiling of its chosen design (unit 2's arithmetic — sharded relational ledgers run at very high rates when partitioned by account with cross-shard transactions rare) and the migration story if that ceiling nears. What settles it: the numbers on the table — the projected rate vs the derived ceiling — and if genuinely uncertain, a bounded spike/load test with pre-agreed pass criteria (converting the disagreement into an experiment, the cheapest form of seniority). Process backstop: if the reviewer still blocks without numbers, escalation is legitimate and healthy — a review system where seniority beats arithmetic teaches the org to write defensive documents, which is a systemic failure worth surfacing. The exercise's rule: derivations are only ever defeated by derivations.",
                  "hint": "Who has produced a number, and who has produced a preference? What experiment would convert the disagreement into data?"
                },
                {
                  "prompt": "Construct the postmortem-to-battery loop for this incident: Lens's trending feature showed a deleted (DMCA'd) photo for 40 minutes because the trending document cached photo metadata inline at publish time, bypassing the hydration path's takedown filter. Write the postmortem's design-review question — the one that, asked at review time, would have caught it — and generalize it into a battery entry, showing which existing course rule it instantiates.",
                  "solution": "The incident's mechanism: trending's publisher denormalized photo metadata INTO the cached trending document (for speed), creating a second render path that skipped the shared read-time authorization/takedown filter — unit 4's exercise rule ('one filter implementation, EVERY read path flows through it') violated by an optimization that created a new read path without registering it. The review-time question: 'Enumerate every path by which this feature's content reaches a user's screen — and show that each one passes through the shared revocation filter. Does this design CREATE any new render path?' — asked at trending's review, the inline-metadata shortcut is caught immediately (it is a new render path by construction). Battery generalization: **'What new read paths does this design create, and what enforcement do they inherit versus bypass?'** — filed beside the existing entries as the revocation-audit question. Course rule instantiated: unit 2's read-time enforcement rule + unit 6's 'one shared authorization function' — the incident is precisely what those rules exist to prevent, and the postmortem's job is converting the recurrence into a REVIEW-TIME check rather than a runtime hope. Complete the loop with the fix pattern: trending documents store photo IDS (hydrated through the standard filtered path at render — the unit-6 edit-propagation lesson said this too: lists hold ids, content hydrates), accepting the hydration cost the shortcut dodged — and the design doc's approximation section now must price 'staleness of derived documents' against revocation classes explicitly. One incident, one new battery question, one reinforced rule: that is the compounding mechanism the lesson's closing paragraph described.",
                  "hint": "The bug is a render path that skipped a shared filter. What question forces authors to enumerate render paths — and which two earlier course rules already implied it?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u8l4-i1",
              "front": "The design doc's seven sections, in order?",
              "back": "Requirements (ranked, quantified, grants signed) → Numbers (arithmetic, binding constraint) → Design (components each paying, ledgers, data/consistency maps) → Failure (dependency table, radius, ladder) → Evolution (10× arithmetic, pre-bought migrations) → Alternatives considered (with closing numbers) → Open questions. The order IS the method."
            },
            {
              "id": "u8l4-i2",
              "front": "What does the 'Alternatives considered' section prove, and what defeats its verdicts?",
              "back": "That derivation happened (its absence is decoration's tell). Its rejections stand until NEW numbers or missed requirements re-open them — derivations are only defeated by derivations, never by seniority or taste."
            },
            {
              "id": "u8l4-i3",
              "front": "Three battery questions and the pattern each exposes?",
              "back": "'What number pays for this component?' → decoration. 'Crash between steps 2 and 3 — what dedups?' → guarantee inflation ('exactly-once' as adjective). 'What breaks first at 10×?' → drawn-not-derived. (Also: dependency walks → intention-only fallbacks; 'who signed this staleness?' → unpriced approximations.)"
            },
            {
              "id": "u8l4-i4",
              "front": "The reviewer's own norms?",
              "back": "Attack derivations, not conclusions (taste isn't a question); reward stated ignorance (open questions are the densest section); size review depth to blast radius; after each incident, add the question that would have caught it — the battery is accumulated postmortem residue."
            },
            {
              "id": "u8l4-i5",
              "front": "Which structures can never fully contract, and the design consequence?",
              "back": "Artifacts emitted into the world: URLs, IDs, event schemas, API shapes — the world holds references you can't migrate. Design their headroom FIRST (lengths, versions, additive evolution); their read paths are permanent, so expand generously and expect no contract phase."
            },
            {
              "id": "u8l4-i6",
              "front": "The course's method in one sentence?",
              "back": "Extract requirements into numbers → let numbers name the binding constraint → relieve it with the smallest paid-for component → budget with ledgers, classify dependencies, price approximations with signed grants, keep structures migratable — and write it down so a skeptic can check the arithmetic."
            }
          ]
        }
      ],
      "masteryCheck": {
        "id": "u8-check",
        "questions": [
          {
            "id": "u8q1",
            "type": "numeric",
            "prompt": "A service's own tier runs at 99.99%, with five hard dependencies each at 99.9%, failing independently. What is the service's availability ceiling, in percent? (Three decimal places, e.g. 99.123.)",
            "answer": 99.49,
            "tolerance": 0.06,
            "points": 1,
            "explanation": "A ≤ 0.9999 × 0.999⁵ ≈ 0.9999 × 0.99501 ≈ 0.99491 → ~99.49% — the five well-run hard dependencies donate ~3.6 hours/month of downtime before the service's own code fails once. The design lever is the hard LIST: softening dependencies removes their factors from the product entirely; improving them only shrinks factors that still multiply."
          },
          {
            "id": "u8q2",
            "type": "numeric",
            "prompt": "An SLO is 99.9% over a 30-day window. An incident holds a 1.44% bad-request rate. At that burn rate, in how many hours is the entire month's error budget consumed?",
            "answer": 50,
            "tolerance": 3,
            "points": 1,
            "explanation": "Burn rate r = 0.0144/0.001 = 14.4×; exhaustion = W/r = 30 d/14.4 = 2.08 d ≈ 50 hours. This is exactly the conventional fast-burn page threshold: 14.4× over an hour consumes 2% of the monthly budget per hour — fast enough to wake someone, slow enough that a one-hour confirmation window doesn't forfeit the month."
          },
          {
            "id": "u8q3",
            "type": "short",
            "prompt": "In an expand–contract migration under rolling deploys, what property must hold at every intermediate state for the migration to be safe? (Phrase it in a few words.)",
            "accept": [
              "compatibility",
              "backward compatibility",
              "every live version compatible",
              "all live code versions compatible with the data shape",
              "every code version works with the current schema",
              "concurrent version compatibility"
            ],
            "points": 1,
            "explanation": "Every live (code version, data shape) pair must work: rolling deploys always run two code versions against one dataset, so each step changes only one thing additively — code stops touching a structure at least a release before the structure disappears. Contract, the only step that breaks compatibility with prior versions, is the only irreversible one and is gated accordingly."
          },
          {
            "id": "u8q4",
            "type": "mcq",
            "prompt": "A dashboard computes 'p99 latency' by averaging the per-host p99 values across a 40-host fleet. Which statement is correct?",
            "options": [
              "The number is statistically meaningless: quantiles don't average, and tail mass concentrated on hot or broken hosts (or spread thinly across a slow request-class) can make the display arbitrarily wrong in either direction",
              "The number is a valid approximation as long as all hosts receive roughly equal traffic",
              "The number slightly overestimates the true p99, making it a safe conservative bound",
              "Averaging is wrong only for p50; upper percentiles like p99 average correctly because tails dominate"
            ],
            "answer": 0,
            "points": 1,
            "explanation": "Mean-of-quantiles carries no information about how tail mass distributes across shards — the counterexample construction places identical per-host p99s over wildly different merged realities, and the error's sign flips with where the slow requests sit. Equal traffic (option b) doesn't rescue it: a slow request-class spread across all hosts hides inside every host's p99. The valid pipeline: export histograms/sketches per instance, merge bucket-wise, compute quantiles from the merge — quantiles last, merged never."
          },
          {
            "id": "u8q5",
            "type": "proof",
            "prompt": "(a) Prove the serial-composition bound: a service with own-tier availability a₀ and independent hard dependencies with availabilities a₁ … a_n has availability at most a₀·∏aᵢ, and compute the ceiling for a₀ = 99.99% with eight hard dependencies at 99.9%. (b) Prove that converting dependency j to soft removes aⱼ from the product, stating precisely what 'soft' must mean for the proof to hold. (c) Explain why an untested fallback fails the proof's premise, and name the practice that restores it.",
            "rubric": [
              "(a) proves the product bound: the service serves iff its own tier AND every hard dependency function (definition of hard); independence gives P(all up) = product; correlated failure only lowers it (hence ≤) — and computes 0.9999 × 0.999⁸ ≈ 0.992 (~99.2%)",
              "(b) states the conversion precisely: soft means the service's serving event no longer requires dependency j up (it serves degraded during j's downtime), so j's availability leaves the conjunction and the product — with the honest accounting that availability is preserved while QUALITY degrades (the degraded mode is a priced product state, not free)",
              "(c) identifies the proof's premise for softness: 'S still serves when j is down' is a claim about the fallback path actually functioning — an unexercised fallback (wrong config, unhandled load, dead code) makes j hard in fact whatever the diagram says, silently restoring aⱼ to the product",
              "Names the restoring practice concretely: rehearsed failure — game days / chaos drills that kill j in production-like conditions and verify the degraded mode under load (including the fallback's own dependencies, e.g. origin headroom for a cache fallback)"
            ],
            "solution": "(a) By the definition of a hard dependency, S serves a request only when S's own tier is up AND each hard dependency Cᵢ is up: the serving event is the conjunction. Under independence, P(own ∧ C₁ ∧ … ∧ C_n) = a₀·∏aᵢ; real systems have correlated failure modes (shared zones, deploys, configs), which can only reduce the joint probability — hence A(S) ≤ a₀·∏aᵢ. Numerically: 0.999⁸ = (1 − 0.001)⁸ ≈ 1 − 0.008 + small ≈ 0.99203; × 0.9999 ≈ **0.9919 → ~99.2%** — eight good dependencies cap the service two full 'nines-classes' below its own tier. ∎ (b) Convert Cⱼ to soft: by definition, S now serves (a degraded response) even when Cⱼ is down — the serving event becomes (own ∧ ⋀_{i≠j} Cᵢ), a conjunction from which Cⱼ is absent, so A(S) ≤ a₀·∏_{i≠j}aᵢ: the factor aⱼ is gone, not improved. The precise requirement on 'soft': the degraded response must still count as serving against the SLI (the SLO's definition of success must admit it), and the quality loss during Cⱼ's downtime is a separate, priced product state (stale data, missing features) — softening trades availability risk for quality risk; the proof only moves the availability factor. ∎ (c) The conversion's premise is behavioral, not architectural: 'S serves when Cⱼ is down' is true only if the fallback path — the code, its configuration, its own dependencies, its capacity — actually functions under real conditions. An untested fallback is an unverified claim: dead branches, stale configs, or a fallback that overwhelms ITS dependency (a cache fallback exceeding origin headroom — the borrowed-capacity case) make S fail in fact when Cⱼ fails, i.e. Cⱼ was hard all along and aⱼ silently re-enters the product. The restoring practice: rehearsed failure — game days / chaos engineering that take Cⱼ down deliberately in production-like conditions, at load, on a schedule, verifying the degraded mode end to end (and re-verifying after changes) — converting the soft classification from an intention into an observed property. ∎",
            "points": 3,
            "explanation": "The three parts are the failure lesson's full argument: the multiplication that caps every design (and why hard-dependency COUNT is the lever), the exact meaning of the softening escape (an availability factor traded for a priced quality state), and the operational fine print — a fallback is only real once it has been watched working, which is what game days are for."
          },
          {
            "id": "u8q6",
            "type": "open",
            "prompt": "You are the reviewer. A team submits this design for a B2B invoicing product (8,000 business customers; ~200 invoices/customer/month; invoices must never be lost or double-sent; customers view dashboards ~10×/day): 'Invoices are created via a REST API into DynamoDB (infinitely scalable). A Lambda per invoice sends the PDF by email immediately and marks it sent. For dashboards we query DynamoDB directly. We use six microservices (create, render, send, dashboard, audit, admin) on Kubernetes for scalability. We'll add caching with Redis later if needed. Exactly-once email delivery is guaranteed by making the Lambda idempotent.' Deliver the review: (a) the numbers the doc should have contained and what they imply; (b) the four most serious findings, each with the battery question that exposes it and the concrete failure scenario; (c) the rebuilt design in one paragraph; (d) the one thing the team got right and should keep.",
            "rubric": [
              "(a) runs the missing arithmetic: 8,000 × 200 = 1.6 M invoices/month ≈ 0.6/s average creation (single-digit peak); dashboard reads 8,000 × 10 = 80 k/day ≈ 1/s — and concludes the entire workload is TINY: nothing about this product needs horizontal-scale machinery; the binding requirements are durability and never-double-send (correctness), not throughput",
              "(b) four findings with battery questions and scenarios, drawn from: unpaid components (DynamoDB 'infinitely scalable' / six microservices / K8s for ~1 req/s — 'what number pays for this?'); the send-path guarantee inflation ('exactly-once by idempotent Lambda' — 'crash between email-send and mark-sent: what dedups?' — the external side-effect residue: email has no transaction with the DB; needs attempting-state + provider idempotency where available + the duplicate-vs-loss direction argued for INVOICES, likely duplicate-over-loss with dedup); missing invariant support (invoices are relational/transactional: numbering sequences, line items, customer joins, ad-hoc queries — a KV store surrenders exactly what invoicing needs; also dashboards 'query DynamoDB directly' hit KV's query-pattern wall); no failure/audit story for a NEVER-LOSE requirement (where is the durable send-state machine, the reconciliation against the email provider, the audit trail the doc names a service for but no design?)",
              "(c) rebuilt design proportionate to the numbers: one service (or two: app + worker), relational store (invoices, line items, send-state as a state machine: created → rendering → sending(attempt recorded) → sent/failed), transactional outbox + queue worker for sends (at-least-once + dedup on invoice send-id, provider idempotency key if available, reconciliation job against provider logs), dashboards straight off indexed relational queries (1/s!), no cache, no K8s fleet — with the double-send/lost-send failure walks stated",
              "(d) identifies a genuine keep: making the send worker idempotent is the right INSTINCT (the mechanism just needs the dedup record atomic with send-state, and the guarantee scoped honestly); or: separating render/send from the request path (async sending) is correct — acknowledged and preserved in the rebuild",
              "Review conduct matches the lesson's norms: findings are derivations (numbers, crash-walks) not taste; the rebuilt design's every component is paid; and the review distinguishes what to delete (scale machinery) from what to strengthen (the correctness machinery the requirements actually demand)"
            ],
            "solution": "(a) The absent arithmetic, one line each: creation = 8,000 × 200/month = 1.6 M/month ≈ 0.6/s average, maybe 5–10/s at month-end peaks (invoicing is calendar-bursty — a real number the doc should have found); dashboard reads ≈ 80 k/day ≈ 1/s; data volume ≈ 1.6 M rows/month of small rows + PDFs (object storage, ~GBs/month). Implication: this is a TINY-throughput, HIGH-correctness system — the requirements that bind are 'never lost, never double-sent, always auditable', and every scalability component in the doc is answering a question nobody asked. (b) Findings. (1) Unpaid scale machinery — battery: 'what number pays for DynamoDB, six services, and K8s?' At 0.6 writes/s and 1 read/s, nothing does; the cost is real (six deploys/on-calls, network partial-failure boundaries, KV query limitations) for zero benefit. Scenario: month-end reconciliation needs 'all unpaid invoices for customer X joined to line items and payments' — a KV store answers with scans and application-side joins, the dashboard team builds a second store, and the derived-copy obligations arrive with no owner. (2) Guarantee inflation on the send path — battery: 'the Lambda crashes after SMTP-accept but before marking sent: what deduplicates the retry?' 'Idempotent Lambda' cannot span the email provider (external side effect, no shared transaction — the irreducible residue): the retry re-sends. For invoices the direction must be argued: a duplicate invoice email is embarrassing but survivable; a LOST invoice is a revenue/legal failure → at-least-once with attempting-state recorded before the send, provider idempotency/message-id where supported, and duplicates bounded by status-check-on-retry. The doc's one-word guarantee hides the entire design. (3) The invariant mismatch — battery: 'show me the invoice-numbering and the month-end join.' Sequential invoice numbering per customer (a legal requirement in many jurisdictions — a requirement the doc never extracted) is a per-customer counter with transactional assignment: trivial in a relational store, a distributed-counter subproject on KV. (4) The never-lose story is absent — battery: 'walk me through the email provider being down for 4 hours, and the audit question »was invoice 4471 sent, when, to whom?«' No send-state machine, no queue with drain semantics, no reconciliation against provider logs, no audit design (a microservice NAMED audit is not an audit design). (c) Rebuild: one application service plus one send worker. Relational store: customers, invoices (with per-customer sequence assigned transactionally), line items, and a send-state machine (created → rendered → sending[attempt recorded, provider message-id] → sent/failed) — PDFs in object storage, content-addressed. Sends via transactional outbox → queue → worker: at-least-once, dedup on (invoice, attempt) atomic with state, provider message-id recorded, bounded retries to DLQ with alerting, nightly reconciliation against provider delivery logs (the never-lose backstop). Dashboards: indexed queries on the relational store — at 1/s, no cache, and the numbers say so in the doc. Deploy: one or two processes on boring infrastructure; the six services return when a number diverges. Failure section: provider-down (queue drains within grant; invoices never shed), double-submit (client idempotency keys per unit 1), the audit query answered by the state machine's history. (d) Keep: the team's instinct to make sending idempotent and asynchronous is exactly right — it is the correct shape for the one hard problem this product has; the review's job is to give that instinct the machinery it deserves (atomic dedup, state, reconciliation) and to delete the scale costume around it. Closing line, per the lesson: this was an architecture in search of requirements; the product's actual requirements — correctness, auditability, calendar bursts — were waiting for a much smaller, much stricter design.",
            "points": 3,
            "explanation": "The final gate is the course played in reverse: given a decorated design, run the arithmetic the authors skipped, expose the inflation with crash-walks, rebuild proportionate to the real binding constraint (correctness, not scale), and — the reviewer's discipline — preserve the one sound instinct inside the noise. Grading follows the battery: every finding must carry a number or a failure scenario, and the rebuilt design must be as rigorously PAID as the original was decorated."
          }
        ]
      }
    },
  ],
};
