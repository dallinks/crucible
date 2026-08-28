// Data Engineering — the general discipline (lifecycle: generation → ingestion
// → storage → transformation → serving) with DELIBERATE EXTRA WEIGHT on the
// analytical core: dimensional modeling, columnar storage and execution, the
// cloud data warehouse (Snowflake as the worked case), and the data lake /
// lakehouse (Databricks + Delta Lake / Iceberg as the worked case).
//
// The organizing idea: WORKLOAD DETERMINES LAYOUT. Every design decision in
// this course — row vs column, star schema vs normalized, warehouse vs lake,
// batch vs stream — is derived from the shape of the reads and writes it must
// serve, and priced in bytes scanned, not asserted from fashion. Products
// (Snowflake, Databricks, BigQuery, Kafka, dbt) are taught as CASE STUDIES of
// architectures, through their published papers, never as console tours.
//
// Running example (cohesion rule 4): **Trellis**, an online plant-and-garden
// subscription retailer. Its analytics grow up as the course does: analysts
// melting the production Postgres replica (u1), the first Parquet exports
// (u2), the star schema for orders (u3), how a columnar engine runs its
// revenue query (u4), the migration to Snowflake (u5), the clickstream lake
// and Delta lakehouse (u6), the dbt-style transformation DAG (u7), CDC and
// streaming ingestion (u8), and the metrics layer + the month the Snowflake
// bill doubled (u9).
//
// Units are inserted one at a time via scripts/insert-unit.mjs — never
// generated in one shot (see AUTHORING.md).
//
// Outline (9 units):
//   u1  Two Kinds of Database Work   — OLTP vs OLAP; the lifecycle; the arithmetic of scans
//   u2  Storage                      — encoding & file formats (Avro/Parquet); compression; object storage
//   u3  Dimensional Modeling         — grain, facts, dimensions; star schemas; slowly changing dimensions
//   u4  How Analytical Queries Run   — vectorized execution; pruning & zone maps; distributed joins & shuffle
//   u5  The Cloud Data Warehouse     — storage/compute separation; Snowflake internals; sizing & contrast (BigQuery/Redshift)
//   u6  Lakes and the Lakehouse      — lake v1 & the swamp; Spark; Delta Lake ACID internals; Iceberg; the lakehouse argument
//   u7  Transformation               — ELT vs ETL; orchestration DAGs; incremental models & idempotency; testing
//   u8  Ingestion & Streaming        — batch ingestion; CDC; Kafka & the log; delivery semantics; streaming tables
//   u9  Serving, Governance & Cost   — BI & metrics layers; catalogs, lineage, contracts; the economics of scan pricing

export const dataEngineering = {
  id: "data-engineering",
  title: "Data Engineering",
  subject: "Data Engineering",
  difficulty: "Professional",
  description:
    "From OLTP exhaust to analytical asset: storage formats, dimensional modeling, columnar execution, the cloud warehouse (Snowflake), the lakehouse (Databricks/Delta/Iceberg), and the pipelines that feed them — every design decision derived from workload shape and priced in bytes scanned. Design judgment is graded against a staff data platform engineer's rubric.",
  overview:
    "Every application you have ever used writes data down — orders, clicks, page views, payments, support tickets. **Data engineering** is the discipline of turning that operational exhaust into a reliable asset: the pipelines that move data out of the systems that produce it, and the storage and processing architectures built to answer questions about it. The field exists because of a stubborn fact this course returns to constantly: the database that *runs* a business cannot also be the database that *analyzes* it. The two workloads — thousands of tiny reads and writes per second versus scans across billions of rows — differ so radically in shape that one system serving both fails at both.\n\nWithout data engineering, analytics happens by heroics. Analysts hammer the production database until it falls over. Every report is computed from a different extract, so no two dashboards agree. Nobody can say what \"revenue\" means, where a number came from, or why the pipeline silently produced Tuesday's data twice. Mastery buys you the opposite: systems where data arrives on time, means one thing, can be recomputed from scratch, and costs what it should.\n\nFour load-bearing ideas organize the course. First, **workload determines layout**: whether data should live in rows or columns, normalized or dimensional, hot storage or object store, is derived from the reads it must serve — and priced in bytes scanned. Second, **grain comes first**: a warehouse model is decided the moment you fix what one row of the fact table means. Third, **storage and compute have separated**: the defining economic shift of the cloud era, and the architectural idea underneath both Snowflake and Databricks. Fourth, **pipelines are software**: idempotent, tested, orchestrated, reproducible.\n\nThe units build in four phases. Foundations: the OLTP/OLAP split and the physics of storage formats. The analytical core — the course's center of gravity: dimensional modeling, columnar query execution, the cloud data warehouse studied through Snowflake's published architecture, and the data lake and lakehouse studied through Delta Lake and Iceberg. Movement: transformation, orchestration, change data capture, and streaming. Operation: serving, governance, and the cost engineering that dominates real platforms.\n\nBy the end you should be able to design a star schema from a business process, explain exactly why a Snowflake query pruned 97% of its micro-partitions, argue warehouse-versus-lakehouse with numbers, and design a pipeline you could rerun twice without fear. The gates test precisely that: scan-cost arithmetic, schema design, and platform decisions defended to a staff data platform engineer's rubric.",
  sources: [
    "Joe Reis & Matt Housley — Fundamentals of Data Engineering (O'Reilly, 2022) — the lifecycle backbone",
    "Ralph Kimball & Margy Ross — The Data Warehouse Toolkit, 3rd ed. (Wiley, 2013) — dimensional modeling, retail case",
    "Martin Kleppmann — Designing Data-Intensive Applications (O'Reilly, 2017), chs. 3, 10–11 — storage engines, batch, stream",
    "Dageville et al. — The Snowflake Elastic Data Warehouse (SIGMOD 2016)",
    "Armbrust et al. — Delta Lake: High-Performance ACID Table Storage over Cloud Object Stores (VLDB 2020)",
    "Armbrust, Ghodsi, Xin & Zaharia — Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics (CIDR 2021)",
    "Abadi, Madden & Hachem — Column-Stores vs. Row-Stores: How Different Are They Really? (SIGMOD 2008)",
    "Stonebraker et al. — C-Store: A Column-oriented DBMS (VLDB 2005)",
    "Boncz, Zukowski & Nes — MonetDB/X100: Hyper-Pipelining Query Execution (CIDR 2005)",
    "Melnik et al. — Dremel: Interactive Analysis of Web-Scale Datasets (VLDB 2010; 'A Decade of Interactive SQL Analysis' retrospective, VLDB 2020)",
    "Zaharia et al. — Resilient Distributed Datasets: A Fault-Tolerant Abstraction for In-Memory Cluster Computing (NSDI 2012)",
    "Jay Kreps — 'The Log: What every software engineer should know about real-time data's unifying abstraction' (LinkedIn Engineering, 2013); Kreps, Narkhede & Rao — Kafka: a Distributed Messaging System for Log Processing (NetDB 2011)",
    "Akidau et al. — The Dataflow Model (VLDB 2015)",
    "Apache Parquet format specification (parquet.apache.org); Apache Iceberg table format specification (iceberg.apache.org/spec)",
    "Snowflake documentation — micro-partitions & data clustering (docs.snowflake.com)",
    "dbt Labs — dbt documentation and 'The dbt Viewpoint' (2016)",
  ],
  grader:
    "You are a staff data platform engineer reviewing design work. The candidate's job is to DERIVE every decision from workload shape and data volume: which columns a query touches, what fraction of partitions prune, how many bytes scan, what the grain of a fact table is, what breaks when a pipeline runs twice. Reward: explicit workload assumptions, scan-cost arithmetic shown step by step, models stated grain-first, correct use of the mechanisms (micro-partition pruning, predicate pushdown, copy-on-write vs merge-on-read, idempotent MERGE) rather than product names, and honest trade-offs — a candidate who says 'a warehouse is simpler and cheaper at this scale' when it is should score higher than one reflexively reaching for a lakehouse. Penalize: tool name-dropping without mechanism ('use Spark' as a complete answer), modeling answers that never state the grain, cost answers that ignore what pricing is actually proportional to, designs that only work if the pipeline never reruns, and buzzwords ('modern data stack', 'single source of truth') in place of a named mechanism. Accept any coherent alternative that meets the stated requirements — grade the derivation, not conformity to the reference.",
  units: [
    {
      "id": "u1",
      "title": "Two Kinds of Database Work",
      "summary": "The OLTP/OLAP split, the data engineering lifecycle, and the scan arithmetic that makes columnar layout inevitable.",
      "intro": "Data engineering begins with a diagnosis, not a tool. Almost every company's analytics starts the same way: the application database already has the data, so the analysts query it — and for a while that works. This unit explains, quantitatively, why it stops working, and what the job of fixing it consists of. The first lesson characterizes the two workloads that end up fighting over the same database — transaction processing and analytics — and proves the selectivity crossover that makes indexes, the great weapon of the first workload, useless to the second. The second lesson zooms out to the shape of the whole discipline: the data engineering lifecycle — generation, ingestion, storage, transformation, serving — which is the map every later unit fills in. The third lesson takes the analytical workload seriously on its own terms and derives the first great layout decision: rows versus columns, priced in bytes scanned. Along the way you will meet **Trellis**, the online plant-subscription retailer whose analytics this course builds, breaks, and rebuilds at growing scale in every unit. The gate asks you to run the same diagnosis on systems you have not seen: classify the workload, do the scan arithmetic, and defend the split.",
      "references": [
        "Joe Reis & Matt Housley — Fundamentals of Data Engineering, chs. 1–3 (the lifecycle and its undercurrents)",
        "Martin Kleppmann — Designing Data-Intensive Applications, ch. 3 (storage and retrieval; OLTP vs OLAP; column storage)",
        "Abadi, Madden & Hachem — Column-Stores vs. Row-Stores: How Different Are They Really? (SIGMOD 2008)"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u1l1",
          "title": "The Analyst and the Register",
          "estMinutes": 30,
          "content": [
            {
              "type": "text",
              "heading": "Two workloads, one database",
              "body": "Meet **Trellis**, the running example of this course: an online retailer that ships potted plants and gardening kits on subscription. Trellis runs on a boring, excellent stack — a Postgres database behind an API. Every checkout inserts an order and its line items, decrements inventory, and records a payment. Each of those operations touches a handful of rows, must finish in milliseconds, and happens thousands of times an hour. Call this the **register**: the database as cash register, recording the business as it happens.\n\nNow it is Monday morning, and the head of merchandising wants to know which product categories drove revenue growth last quarter, by week, split by new versus returning customers. An analyst writes a query. It touches not a handful of rows but *all of them* — forty million order lines — and while it grinds, checkout latency on the website climbs. Call this the **analyst**: the database as instrument of hindsight, asked to summarize everything it has ever recorded.\n\nThe register and the analyst are both legitimate. They are also, at the level of physical machine behavior, nearly opposite — and the entire first act of data engineering is the recognition that a system tuned for one is structurally wrong for the other. This lesson makes that claim precise: first by characterizing the two workloads, then by proving the small theorem that separates them."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "OLTP and OLAP",
              "statement": "**Online transaction processing (OLTP)** is the workload of operating a business in real time: many concurrent operations per second, each reading or writing a *small* number of rows (typically located by key through an index), each required to complete in milliseconds, with correctness guarded by transactions. The working set is the *recent* data, and writes are a large fraction of operations.\n\n**Online analytical processing (OLAP)** is the workload of asking questions about the business: few concurrent queries, each reading a *large* fraction of the dataset's rows but usually a *small* subset of its columns, aggregating them (sums, counts, averages, group-bys), tolerating seconds-to-minutes latency, and writing almost nothing. The working set is *history* — months or years of data.\n\nThe axes that separate them: rows touched per operation (handful vs millions), columns touched (most vs few), read/write mix (mixed vs read-dominated), latency demanded (milliseconds vs seconds), concurrency (thousands of small actors vs a few analysts), and data recency (the last hour vs the last three years)."
            },
            {
              "type": "decision",
              "heading": "The same table, interrogated two ways",
              "rows": [
                [
                  "The register asks: 'order 82471119, right now'",
                  "index lookup — locate ~5 rows by key, read every column of each, in ~1 ms"
                ],
                [
                  "The analyst asks: 'revenue by category by week, 2 years'",
                  "scan — read ~40,000,000 rows, but only 4 of ~20 columns, aggregate, in seconds"
                ],
                [
                  "The register writes constantly (every checkout)",
                  "writes must be cheap: one page touched, indexes small, locks brief"
                ],
                [
                  "The analyst writes never (SELECT only)",
                  "reads must be cheap: bytes scanned is the cost that matters"
                ],
                [
                  "The register's working set: today's orders",
                  "cache-friendly — recent pages stay hot in the buffer pool"
                ],
                [
                  "The analyst's working set: all history",
                  "cache-hostile — one query cycles the entire table through memory"
                ]
              ]
            },
            {
              "type": "example",
              "heading": "Worked example: the register's transaction",
              "body": "Walk one Trellis checkout at the level of database operations. The API opens a transaction and runs: **(1)** `INSERT INTO orders …` — one row; **(2)** `INSERT INTO order_lines …` — three rows, one per item in the cart; **(3)** `UPDATE inventory SET on_hand = on_hand - 1 WHERE product_id = …` — three rows, each located by primary key; **(4)** `INSERT INTO payments …` — one row; commit.\n\nCount the physical work. Eight rows written, three read-modify-written. Every row is located through a **B-tree index** on its primary key: a tree of fan-out ~500 over 10 million products is 3 levels deep, so each lookup reads at most 3 pages, of which the top 2 are effectively always cached — roughly *one* page of real I/O per row touched. The whole transaction moves a few dozen kilobytes. This is why the register can run **200 checkouts per second on one machine**: not because the machine is heroic, but because each unit of work is tiny and indexes make *finding* each row nearly free.\n\nNote what the register pays for this speed: every secondary index on those tables must also be updated on every insert. Indexes are prepaid reads, billed to every write. That bill is the fulcrum of an exercise below — and of a production incident in the mastery check."
            },
            {
              "type": "example",
              "heading": "Worked example: the analyst's query",
              "body": "Now the Monday query, on the same Postgres (a read replica — Trellis learned *that* lesson early). The `order_lines` table: **40 million rows, ~20 columns, ~160 bytes per row ≈ 6.4 GB**. The query computes weekly revenue by category: it needs `order_ts`, `product_id`, `quantity`, and `unit_price` — 4 columns, ~28 of the 160 bytes in each row — joins to `products` for the category, filters to the last 2 years (which is most of the table), and groups.\n\nThe planner has no good options. The filter matches ~90% of rows, so no index helps (the next block proves why). It sequentially scans all 6.4 GB, *deforms* every 160-byte row to extract 28 bytes of it, hashes 40 M rows into groups, and joins each to a product. On the replica this takes **minutes** — and it evicts the entire hot working set from the buffer pool as it goes, so for a while afterward, *every* query on that replica is slow because the cache is full of two-year-old order lines nobody will read again this month.\n\nHold on to the two numbers that indict the layout: the query needed **28 of every 160 bytes** — 17.5% — but a row store has no way to read 17.5% of a row. Bytes it did not want dominated the I/O. That waste is not a Postgres flaw; it is a *layout* consequence, and lesson 3 turns it into the design principle of the whole analytical stack."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The selectivity crossover",
              "statement": "Model a table of N rows stored r rows per page, so it occupies P = N/r pages. Let sequential reads cost c_seq per page and random reads cost c_rand = ρ·c_seq (ρ > 1 is the random-access penalty). A query matches fraction f of the rows, and matching rows are spread uniformly (the index is not correlated with physical order). Then reading the matches through a secondary index costs at least f·N random page reads, a full sequential scan costs P sequential reads, and the index plan wins only when\n\nf < 1 / (r · ρ).\n\nFor realistic values (r = 50 rows/page, ρ = 20 even on SSDs, once read-ahead is counted), the crossover is f ≈ 0.1% — so any query touching more than a fraction of a percent of the table is better served by scanning all of it.",
              "proof": "Each matching row lives on some page; with matches uniform and f·N ≤ P, the expected number of distinct pages holding matches is close to f·N (few pages hold two matches), and an uncorrelated index visits them in key order, not physical order — so each visit is a random read. Index cost ≥ f·N·c_rand = f·N·ρ·c_seq. Scan cost = P·c_seq = (N/r)·c_seq.\n\nThe index wins iff f·N·ρ·c_seq < (N/r)·c_seq iff **f < 1/(r·ρ)**.\n\nTwo remarks complete the picture. If f·N > P the index plan degenerates further — it reads at least as many pages as the scan but randomly, so the scan dominates outright. And nothing in the argument used the *number of queries*: the crossover is per-query geometry, which is why adding more indexes cannot rescue analytics. With r = 50, ρ = 20: f* = 1/1000. The Monday query's f ≈ 0.9 sits **900× past the crossover**. ∎"
            },
            {
              "type": "text",
              "heading": "Why the two workloads cannot share a box",
              "body": "The crossover explains why OLTP's central weapon is useless to OLAP; two further mechanisms explain why running both on one database actively damages each.\n\n**Buffer-pool pollution.** A database caches recently used pages in memory. The register's locality is superb — today's orders fit comfortably — so its cache hit rate is high and its latency low. One analytical scan streams gigabytes of historical pages through that cache, evicting the hot set. The scan finishes; the register then pays cache misses on traffic that was hitting memory an hour ago. The analyst's query is slow *once*; it makes the register slow *afterward*.\n\n**MVCC pressure.** Postgres-style engines keep old row versions until no open transaction could still need them. A four-minute analytical query is, from the engine's point of view, a four-minute-old snapshot that must stay reconstructible: vacuum cannot reclaim versions written since it began. Run analytics all day on the primary and dead versions accumulate — tables and indexes bloat, and every workload slows.\n\nThe operational fixes — run analytics on a replica, schedule it at night — are palliative: the replica has the same row layout, the same crossover, the same cache. The structural fix is the founding move of this discipline: **give analytics its own system, with its own layout, fed by a pipeline**. What that pipeline and system look like is the rest of the course. (Hybrid 'HTAP' engines exist and are genuinely useful at the margins, but the industry's equilibrium — including at companies that own HTAP engines — remains the split, for exactly the mechanics above.)"
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**The 'just add an index' trap.** When analyst queries are slow, the reflexive fix is another index on the OLTP database. The crossover proposition says the index will be ignored by any query matching more than ~0.1% of rows — which is essentially every analytical query — while its maintenance cost is charged to **every single write** the register performs, forever. You pay daily for a weapon that cannot hit the target. Indexes are for selectivity; analytics is about projectivity (which columns), and no B-tree helps with that."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "One database, two workloads, and a quantitative wall between them: the register lives below the selectivity crossover, where indexes make row-by-key work nearly free; the analyst lives far above it, where every query is a scan and the only lever is *how many bytes the scan must read*. Sharing one engine makes each workload tax the other through the cache and the version store. The conclusion is the founding decision of analytical data engineering: separate systems, connected by pipelines. Lesson 2 maps the discipline that builds those pipelines — the data engineering lifecycle — and lesson 3 takes up the analyst's side of the wall and asks what a storage layout designed *for scans* looks like."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Classify each as OLTP or OLAP, citing the axes from the definition (rows touched, columns touched, latency, read/write mix): (a) 'mark parcel 9912 as delivered'; (b) 'average delivery time by carrier by month, last year'; (c) 'load the 30 most recent orders for customer 4417's account page'; (d) 'which 500 customers are most likely to churn, from all behavioral history'; (e) 'reserve one unit of SKU 2231 for a checkout in progress'.",
                  "solution": "(a) OLTP — one row by key, write, milliseconds. (b) OLAP — scans a year of shipments, ~3 columns, aggregates, read-only, seconds are fine. (c) OLTP — a *read*, but small (30 rows by index on customer_id), latency-critical, part of serving the app. OLTP is not 'writes'; it is small, latency-bound, key-addressed operations. (d) OLAP — full-history scan feeding a model; read-only, minutes acceptable. (e) OLTP — single-row read-modify-write under a transaction, the register at its purest.",
                  "hint": "OLTP vs OLAP is about the *shape* of the operation, not whether it reads or writes."
                },
                {
                  "prompt": "A table stores r = 100 rows per page; the random-access penalty is ρ = 40. Compute the crossover selectivity f*, and decide: should a query matching 2% of rows use a secondary index or a scan? By what factor is it past the crossover?",
                  "solution": "f* = 1/(r·ρ) = 1/4000 = 0.025%. The query's f = 2% = 0.02 is 0.02/0.00025 = **80× past the crossover** — scan. Concretely: per 1 M rows the index plan does ~20,000 random reads (≈ 800,000 sequential-read equivalents at ρ = 40) versus the scan's 10,000 pages.",
                  "hint": "f* = 1/(r·ρ); compare f to f*."
                },
                {
                  "prompt": "A 6.4 GB table is scanned at 400 MB/s by an analytical query while a replica serves it. Explain the two distinct ways this hurts the OLTP traffic on that replica, and why moving the query to 2 a.m. fixes only one of them.",
                  "solution": "During: the scan competes for I/O bandwidth and CPU with OLTP reads (16 seconds of saturated disk). After: the scan cycled 6.4 GB through the buffer pool, evicting the hot OLTP working set, so OLTP pays cache misses long after the scan ends. Running at 2 a.m. moves both effects to a quiet window — but the cache is still cold at 6 a.m. if the pool refills slowly, and (the deeper point) the *layout* still forces reading 6.4 GB for a 4-column question; the nightly window just hides the structural cost until the table outgrows the window.",
                  "hint": "One effect happens during the scan; the other persists after it."
                },
                {
                  "prompt": "Trellis adds six secondary indexes to `order_lines` to 'help the analysts'. Checkout p99 latency promptly rises. Using the register walkthrough and the crossover proposition, explain both halves: why the writes got slower, and why the analysts got nothing.",
                  "solution": "Writes: every INSERT into order_lines must now also insert into six B-trees — six extra page reads/writes and six more pages in the WAL per row, plus lock traffic on hot index pages; the register's per-operation cost multiplied. Analysts: their queries match large fractions of the table (f ≫ 1/(r·ρ)), so the planner correctly ignores the new indexes and scans anyway. The indexes are pure cost: prepaid reads that no query ever collects.",
                  "hint": "Indexes are prepaid reads billed to every write — and the crossover says analytical queries won't collect."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u1l1-i1",
              "front": "OLTP workload — the four axes that characterize it",
              "back": "Few rows per operation (key-addressed via index), most columns of each, mixed reads and writes, millisecond latency at high concurrency; working set = recent data."
            },
            {
              "id": "u1l1-i2",
              "front": "OLAP workload — the four axes that characterize it",
              "back": "Millions of rows per query but few columns, read-dominated, seconds-to-minutes latency at low concurrency; working set = history."
            },
            {
              "id": "u1l1-i3",
              "front": "Selectivity crossover: when does a secondary index beat a full scan?",
              "back": "Only when the matched fraction f < 1/(r·ρ) — rows-per-page times random-access penalty; realistically f ≲ 0.1%. Analytical queries sit far above it, so OLAP is scans."
            },
            {
              "id": "u1l1-i4",
              "front": "Two mechanisms by which analytics on the OLTP database hurts transactions",
              "back": "Buffer-pool pollution (the scan evicts the hot working set, so OLTP pays misses after it ends) and MVCC pressure (long snapshots block version cleanup → bloat)."
            },
            {
              "id": "u1l1-i5",
              "front": "What is the true cost of a secondary index, and who pays it?",
              "back": "Index maintenance is charged to every write, forever — indexes are prepaid reads. Worth it below the crossover (OLTP); pure cost above it (OLAP)."
            }
          ]
        },
        {
          "id": "u1l2",
          "title": "The Data Engineering Lifecycle",
          "estMinutes": 25,
          "builds_on": [
            "u1l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "From diagnosis to discipline",
              "body": "*The Analyst and the Register* ended with a decision: analytics gets its own system, fed by a pipeline. That sentence hides an entire profession. Someone must decide what data leaves the register and when; where it lands and in what shape; how it is cleaned, joined, and summarized; and how the results reach the analyst, the dashboard, and the model — reliably, every day, while the source systems change underneath. The map of that work is the **data engineering lifecycle**, and it is the skeleton this course hangs on. This lesson walks the map once, end to end, at low resolution — every later unit raises the resolution on one region. Two ideas to hold while we walk: the stages are defined by the *questions they answer*, not the tools that occupy them; and the stages are threaded by cross-cutting concerns — the undercurrents — that no single stage owns but every incident implicates."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The data engineering lifecycle (Reis & Housley)",
              "statement": "The **data engineering lifecycle** organizes the discipline into five stages. **Generation** — the source systems where data originates: application databases, SaaS tools, event streams, files. **Ingestion** — moving data from sources into the analytical platform: batch or streaming, push or pull, full or incremental. **Storage** — where and how the data persists at every step: formats, layouts, and systems; storage underlies the middle of the lifecycle rather than being one point on it. **Transformation** — reshaping raw data into modeled, queryable, trustworthy structures: cleaning, joining, aggregating, dimensional modeling. **Serving** — delivering the transformed data to its consumers: BI dashboards, ad-hoc SQL, machine learning features, operational reverse-feeds.\n\nRunning beneath all five are the **undercurrents**: security, data management (quality, governance, lineage, definitions), DataOps (observability, incident response, automation), data architecture, orchestration (scheduling and dependencies), and software engineering (the pipeline is a program, and must be built like one)."
            },
            {
              "type": "text",
              "heading": "Generation: the data you do not control",
              "body": "Everything starts in systems that were **not built for you**. The register's Postgres schema was designed for checkout correctness, not analysis: statuses are coded integers, addresses are JSON blobs, and the `orders` table has 14 nullable columns whose meanings drifted across releases. The SaaS tools — payment processor, email platform, ad networks — export what their APIs feel like exporting, rate-limited and paginated. Client apps emit event streams whose schemas the mobile team revs without asking.\n\nThe defining property of the generation stage is that its owners have **different incentives**: the application team optimizes for the product, and will rename a column, backfill a status, or double-write during a migration without considering your pipeline. A data engineer's first professional skill is therefore *interrogating source systems*: What is the schema, and who changes it? Is there an updated-at timestamp, and is it trustworthy? Are deletes physical or logical? Can the system tolerate being read heavily, and when? How far back does history go, and is it mutable? Every ingestion design in unit 8 — snapshots, incremental pulls, change data capture — is an answer to some combination of these questions, and every silent pipeline corruption in your career will trace back to one of them being answered wrong."
            },
            {
              "type": "text",
              "heading": "The middle three, and where the course deepens them",
              "body": "**Ingestion** decides *how data moves*: on what schedule (nightly batch? continuous stream?), by what mechanism (query the source? subscribe to its change log?), and in what unit (full snapshots? only what changed?). Its central tension is freshness versus load on the source versus complexity — resolved differently for the orders table (unit 8's change data capture) than for a partner's monthly CSV.\n\n**Storage** decides *what bytes look like at rest*: file formats and encodings (unit 2), and which system holds them — an object store holding open-format files, a warehouse holding its own managed format, or the lakehouse hybrid (units 5 and 6). The storage decision silently prices every downstream query, which is why this course spends a third of its length there.\n\n**Transformation** is where raw becomes meaningful: the staging → cleaned → modeled flow, dimensional modeling as the design language of the modeled layer (unit 3), and the engineering discipline — idempotency, incrementality, testing — that makes transformations rerunnable (unit 7).\n\n**Serving** closes the loop: the BI tool and its semantic layer, the ad-hoc SQL interface, feature delivery to models, and reverse ETL pushing aggregates back into operational tools (unit 9). Serving is where the analyst from lesson 1 finally gets a fast answer — and where 'what does revenue mean?' becomes a governance question rather than a whiteboard argument."
            },
            {
              "type": "decision",
              "heading": "Lifecycle stage → the question it answers → where this course deepens it",
              "rows": [
                [
                  "Generation",
                  "what do the sources emit, and on whose terms? → interrogation checklist here; CDC in unit 8"
                ],
                [
                  "Ingestion",
                  "how does data move — schedule, mechanism, unit? → unit 8 (batch, CDC, streaming)"
                ],
                [
                  "Storage",
                  "what do bytes look like at rest, and who manages them? → units 2 (formats), 5 (warehouse), 6 (lake/lakehouse)"
                ],
                [
                  "Transformation",
                  "how does raw become modeled and rerunnable? → units 3 (modeling) and 7 (pipelines as software)"
                ],
                [
                  "Serving",
                  "how do consumers get answers they can trust? → unit 9 (BI, metrics layers, reverse ETL)"
                ],
                [
                  "Undercurrents",
                  "why did the pipeline break and who noticed? → threaded throughout; governance and cost in unit 9"
                ]
              ]
            },
            {
              "type": "example",
              "heading": "Worked example: Trellis pipeline v0, annotated",
              "body": "Trellis's first pipeline is the one every company builds, and it is worth writing down precisely because every unit of this course will fix part of it. A 2 a.m. cron job runs three steps: **(1)** `pg_dump`-style full exports of `orders`, `order_lines`, `products`, `customers` from the replica to CSV files; **(2)** upload to an S3 bucket, overwriting yesterday's files; **(3)** a Python script that TRUNCATEs and reloads four tables in a small 'reporting' Postgres, then rebuilds three summary tables with SQL.\n\nAnnotate it with the lifecycle: the exports are **ingestion** (batch, full-snapshot, pull); the CSVs in S3 are **storage** (format: the worst one, as unit 2 will show); the TRUNCATE-and-reload plus summary SQL is **transformation**; the reporting Postgres serving dashboards is **serving** — a row store serving scans, so lesson 1's wall is still standing, just moved.\n\nNow the sins, each a future unit's material: full snapshots re-move 6.4 GB nightly and double the replica's I/O for an hour (→ incremental ingestion, unit 8). Overwritten files mean *yesterday is unrecoverable* — no history, no reprocessing (→ immutable raw zones, unit 6). CSV carries no schema, so the day the app team adds a column, the loader shifts every field right and loads garbage *successfully* (→ self-describing formats, unit 2). The TRUNCATE step means a crash mid-load leaves dashboards empty (→ idempotent, transactional loads, unit 7). And nothing checks row counts, so the garbage-load day is discovered by the CFO (→ DataOps undercurrent, units 7 and 9)."
            },
            {
              "type": "example",
              "heading": "Worked example: one incident, read through the undercurrents",
              "body": "Six weeks later, v0 produces its first real incident, and the undercurrents give the vocabulary for the post-mortem. The app team ships a release that changes `order_lines.discount` from a per-line dollar amount to a per-line *percentage* (a migration backfills old rows). The nightly pipeline runs fine: CSV has no types to violate, the loader loads, the summary SQL sums a column that now means something else. Revenue dashboards drop 12% overnight. Finance notices two days later; the pipeline never did.\n\nRead it through the undercurrents. **Data management** failed first: the column's *meaning* changed and no contract existed between the app team and the pipeline — nothing forced the change to be announced (unit 9 makes such contracts concrete). **DataOps** failed second: a 12% overnight shift in the headline metric should have paged someone before any human saw a dashboard — that is an anomaly check, cheap to build, absent here (unit 7). **Orchestration** is what *limited* the blast radius: the summaries rebuilt only after loads completed, so at least the wrong number was consistently wrong, not half-loaded. And note what did *not* fail: no machine crashed, no job errored. The most expensive pipeline failures are silent semantic ones — which is why the undercurrents, not the stages, are where mature teams spend their effort."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**Batch versus streaming is a dial, not a dogma.** v0 refreshes nightly because a cron job is cheap and merchandising decisions are weekly. If Trellis later wants same-hour stock dashboards, ingestion moves to hourly micro-batch; if it wants fraud checks in seconds, to a stream (unit 8). The lifecycle stage is the same — *ingestion* — and the right position of the dial is set by the freshness the **serving** stage actually requires, not by what is fashionable. Paying streaming complexity for a weekly decision is the second most common architecture mistake in the field, right after analytics on the primary."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The discipline now has a map. Five stages — generation, ingestion, storage, transformation, serving — each defined by the question it answers, threaded by undercurrents that turn silent failures into caught ones. Trellis has a v0 pipeline whose every sin is named and scheduled for repair in a specific later unit. The course now follows the data: it next stops at **storage**, because the format and layout of bytes at rest is the decision that prices everything downstream — and lesson 3 has already shown the shape of the argument: count the bytes a scan must read. Unit 2 makes that counting exact, from CSV's typeless rows to Parquet's compressed column chunks."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A team's pipeline: a Fivetran-style connector pulls Salesforce objects hourly into BigQuery datasets; scheduled SQL models (dbt) build cleaned and aggregated tables; Looker dashboards and a weekly CSV export to the sales-ops tool consume them. Map every component to its lifecycle stage, and identify which stage is entirely missing from the description.",
                  "solution": "Salesforce = generation. The hourly connector = ingestion (batch, incremental, pull). BigQuery datasets = storage (raw and modeled zones). The dbt-style SQL models = transformation. Looker + the CSV push to sales-ops = serving (the push is reverse ETL). Missing: any stated undercurrent — no tests, no freshness/anomaly monitoring, no contract with the Salesforce admins; the description is all stages and no safety net.",
                  "hint": "Follow the data left to right; then ask what catches failures."
                },
                {
                  "prompt": "For each mini-incident, name the undercurrent whose absence let it happen and one mechanism that would have caught it: (a) the pipeline reruns after a crash and Tuesday's revenue is exactly doubled; (b) an intern's notebook queries the raw customers table, which includes plaintext emails, and the notebook is shared publicly; (c) the marketing dashboard silently stopped refreshing nine days ago and nobody noticed until a campaign launched on stale numbers.",
                  "solution": "(a) Software engineering (and orchestration): the load is not idempotent — rerun ⇒ double-insert; an idempotent MERGE or delete-and-replace by partition, plus a uniqueness test, catches it (unit 7). (b) Security: raw PII was readable to anyone; column-level access controls / masking in the raw zone. (c) DataOps: no freshness monitoring; a staleness check on the table's max(loaded_at) that pages after one missed run.",
                  "hint": "Doubled data, leaked data, stale data — three different undercurrents."
                },
                {
                  "prompt": "Take two of Trellis v0's sins — the overwritten S3 files and the TRUNCATE-and-reload — and for each: state the concrete failure it will cause, and sketch the v1 fix, naming the lifecycle stage the fix belongs to.",
                  "solution": "Overwritten files: the day a bad export runs (or the discount incident needs reprocessing), there is no yesterday to recover or recompute from — history is gone. Fix (storage): write exports to dated, immutable paths (raw/orders/dt=2026-08-27/…) and never overwrite; raw is an append-only archive. TRUNCATE-and-reload: a crash between TRUNCATE and COPY leaves serving tables empty during business hours; also doubles are possible on rerun mid-script. Fix (transformation): load into a staging table and atomically swap/rename, or MERGE by key — the serving table is never observable in a partial state.",
                  "hint": "One sin destroys history; the other destroys the present."
                },
                {
                  "prompt": "Trellis asks for 'real-time' dashboards. Interrogate the request the way this lesson interrogates source systems: write the three questions you would ask, and give the ingestion design for the two most likely answers.",
                  "solution": "Questions: (1) Which decision consumes this, and how quickly does it change? (2) What staleness would actually mislead that decision — a minute, an hour, a day? (3) Which tables must be fresh — all of them, or just orders and inventory? Likely answer A: 'the ops team checks stock hourly' → hourly incremental batch of orders/inventory only; nightly for the rest; no streaming. Likely answer B: 'we want to stop fraudulent orders' → that is not a dashboard but an operational stream consumer on the order events (unit 8), separate from the analytical refresh. The lesson: 'real-time' is a serving requirement to be priced, not an ingestion default.",
                  "hint": "Freshness is set by the consuming decision, not by the word 'real-time'."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u1l2-i1",
              "front": "The five stages of the data engineering lifecycle, in order of data flow",
              "back": "Generation → ingestion → storage (underlying the middle) → transformation → serving."
            },
            {
              "id": "u1l2-i2",
              "front": "What defines the *generation* stage, operationally?",
              "back": "Source systems you don't control, owned by teams with different incentives — schemas change without notice, so ingestion must be designed against interrogated facts (timestamps? deletes? history?)."
            },
            {
              "id": "u1l2-i3",
              "front": "Which stage's requirement should set the batch-vs-streaming dial, and why?",
              "back": "Serving: the freshness the consuming decision actually needs. Streaming complexity for a weekly decision is waste; ingestion inherits its SLA from downstream."
            },
            {
              "id": "u1l2-i4",
              "front": "Why are silent semantic failures (e.g., a column's meaning changes) the most expensive pipeline failures?",
              "back": "No job errors — data loads 'successfully' but wrongly, so only data-management contracts and DataOps anomaly checks (undercurrents) can catch them before consumers do."
            },
            {
              "id": "u1l2-i5",
              "front": "What makes a load step safe to rerun (v0's TRUNCATE-and-reload was not)?",
              "back": "Idempotency: stage-and-atomic-swap or MERGE by key, so a crash or rerun can never leave the serving table empty, partial, or doubled."
            }
          ]
        },
        {
          "id": "u1l3",
          "title": "Rows, Columns, and the Arithmetic of Scans",
          "estMinutes": 28,
          "builds_on": [
            "u1l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The analyst's side of the wall",
              "body": "*The Analyst and the Register* proved that analytical queries are scans, and its worked example left a number hanging: the Monday query needed 28 of every 160 bytes, but the row store forced it to read all 160. This lesson takes that waste seriously and derives the layout that eliminates it. The move is characteristic of the whole course: we do not ask *which database is best* — we ask *what bytes must this workload touch, and what arrangement of bytes on disk lets it touch only those*. For scans, the answer is to stop storing rows together and start storing **columns** together. The idea is old (statistical databases used it in the 1970s), was industrialized by C-Store and its contemporaries in the 2000s, and is now the physical layout of essentially every serious analytical system — Snowflake, BigQuery, Redshift, DuckDB, and the Parquet files of every data lake. One piece of vocabulary first, because the whole lesson turns on it: a query's **selectivity** is the fraction of *rows* it matches; its **projectivity** is the set of *columns* it references. Lesson 1 showed selectivity stops mattering above the crossover. This lesson shows projectivity is what you can actually buy with layout."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Row layout and columnar layout",
              "statement": "Fix a table with N rows and columns c₁ … c_C of byte-widths w₁ … w_C. A **row layout** (n-ary storage model, NSM) stores each row's values contiguously: page p holds rows in sequence, each row occupying Σwᵢ bytes plus per-row overhead. Reading any subset of a row's columns requires reading the whole row's bytes from disk (I/O happens in pages, and a row's columns share pages).\n\nA **columnar layout** (decomposition storage model, DSM) stores each column's values contiguously: column cᵢ occupies its own region (or file) of N·wᵢ bytes, with values in a single global row order so that the j-th value of every column belongs to row j. Reading a subset Q of columns reads only Σ_{i∈Q} N·wᵢ bytes; reconstructing a full row requires gathering position j from every column's region."
            },
            {
              "type": "code",
              "heading": "The same four order lines, two layouts",
              "lang": "text",
              "code": "ROW LAYOUT — one page, rows contiguous (read a column ⇒ read every page anyway):\n page 1: [1001|P77|2|19.99|2026-08-01|…] [1002|P12|1|54.00|2026-08-01|…]\n         [1003|P77|1|19.99|2026-08-02|…] [1004|P09|4| 7.50|2026-08-02|…]\n\nCOLUMN LAYOUT — one region per column, positions aligned (row j = j-th value everywhere):\n order_id:   [1001, 1002, 1003, 1004]\n product_id: [P77,  P12,  P77,  P09 ]\n quantity:   [2,    1,    1,    4   ]\n unit_price: [19.99, 54.00, 19.99, 7.50]\n order_ts:   [08-01, 08-01, 08-02, 08-02]\n …15 more columns the revenue query will never touch…\n\nSUM(quantity*unit_price) touches 2 regions of 20. Row j's full record = gather j across all 20."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Scan I/O under the two layouts",
              "statement": "For the table above, an analytical scan that references column set Q must read\n\nI/O_row = N · (Σ_{i=1..C} wᵢ)   bytes under row layout, versus   I/O_col = N · (Σ_{i∈Q} wᵢ)   bytes under columnar layout,\n\nso columnar wins by the factor (Σ_all wᵢ) / (Σ_Q wᵢ) — the ratio of table width to *referenced* width — independent of the query's selectivity. With per-column compression ratios gᵢ ≥ 1 (columnar compresses better because a region holds one type's values — unit 2 proves why), the columnar cost falls further to N · Σ_{i∈Q} wᵢ/gᵢ, while row-layout compression must decompress whole pages to extract any column.",
              "proof": "Row layout: I/O occurs in pages; every page holds every column's bytes for its rows interleaved, so a scan of all N rows reads all pages: N·Σwᵢ bytes (up to per-page overhead, which only worsens it). No subset of columns can be isolated because no page contains only wanted bytes.\n\nColumn layout: each referenced column cᵢ, i ∈ Q, is contiguous and exactly N·wᵢ bytes; the scan reads those regions and no others, totaling N·Σ_{i∈Q} wᵢ. Unreferenced columns occupy disjoint regions and are never touched.\n\nThe ratio follows by division; selectivity never entered the argument, because a scan must *examine* every row's value in the referenced columns regardless of how many rows match (reducing examined rows requires additional structure — min/max zone maps — which unit 4 builds on top of exactly this layout). With per-column compression, region i shrinks to N·wᵢ/gᵢ and the same reading argument applies region by region. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: the Monday query, repriced",
              "body": "Price the Monday revenue query under both layouts, with the numbers fixed in lesson 1: `order_lines` has N = 40 M rows, C = 20 columns, Σwᵢ = 160 B; the query references Q = {order_ts (8 B), product_id (8 B), quantity (4 B), unit_price (8 B)}, Σ_Q = 28 B.\n\n**Row layout:** 40 M × 160 B = **6.4 GB** read, regardless of Q. At 500 MB/s of effective scan bandwidth: ≈ 12.8 s of pure I/O — before join and aggregation CPU, and before the buffer-pool damage.\n\n**Columnar, uncompressed:** 40 M × 28 B = **1.12 GB** — the 160/28 ≈ 5.7× of the proposition. ≈ 2.2 s at the same bandwidth.\n\n**Columnar, compressed:** these columns compress well (unit 2 shows the encodings): order_ts is nearly-sorted timestamps (delta-encodes ~8×), product_id has 10 k distinct values (dictionary + bit-packing ~4×), quantity is small integers (~8×), unit_price has ~3 k distinct prices (~4×). A conservative blended 4× brings the read to **≈ 280 MB — under a second**, on the *same hardware* that took minutes as a row store. Nothing about the data changed; only its arrangement did. This 20-to-40× swing, not any exotic algorithm, is the core physical fact behind the entire analytical database industry — Abadi, Madden & Hachem measured exactly this gap when they put the two architectures head-to-head in 2008."
            },
            {
              "type": "example",
              "heading": "Worked example: why the register would hate this",
              "body": "Layout follows workload — so run the *register's* operations against the columnar layout and watch the costs invert.\n\n**The write.** One checkout inserts three order lines. Row layout: append three 160 B rows to the tail page — one page dirtied, one WAL record, microseconds. Columnar layout: each new row's 20 values belong to 20 *different* regions — 20 scattered writes per row (and if regions are compressed blocks, 20 decode-append-reencode cycles). The write cost multiplied by the column count precisely because the layout optimized reads by separating columns.\n\n**The point lookup.** 'Show order 82471119' needs all 20 columns of ~5 rows. Row layout: one index probe, one page — every column is already adjacent. Columnar: gather position j from 20 regions — 20 reads to reassemble what the row store kept together.\n\nThis symmetry is the lesson's real theorem: **neither layout is better; each is the transpose of the other's workload**. OLTP touches few rows and wants their columns adjacent (rows contiguous); OLAP touches few columns and wants their rows adjacent (columns contiguous). Real columnar systems soften the write penalty with a small row-oriented (or in-memory) write buffer that batches inserts and merges them into column regions asynchronously — C-Store's writeable-store/read-store split, reborn in every modern engine — but the batch-later trick only works because analytics tolerates seconds of staleness. The register cannot."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**Real formats are hybrids — PAX, not pure DSM.** Pure columnar (every column one giant file) makes even analytical reads awkward: a row-level filter needs values from several columns at the *same position*, and if those live gigabytes apart, reassembly thrashes. So the standard compromise partitions rows into large **row groups** (tens to hundreds of MB) and lays data out column-by-column *within* each group — columnar for I/O, row-grouped for locality and parallelism. This is the PAX idea, and it is exactly the structure of **Parquet**, the file format at the center of unit 2 and of every data lake in unit 6. When you see 'row group' there, this paragraph is why it exists."
            },
            {
              "type": "text",
              "heading": "What selectivity still buys — and what it costs",
              "body": "The proposition's most useful clause is the one that sounds like a limitation: columnar I/O is independent of selectivity. A `WHERE category = 'succulents'` that matches 3% of rows does **not** reduce the bytes a naive column scan reads — every value of the referenced columns is still examined. Two structures, both built in later units, convert selectivity back into savings, and both work *because* of columnar layout rather than instead of it. **Zone maps** (unit 4): store min/max per column per block; if a block's range excludes the predicate, skip the block without reading it — selectivity becomes I/O savings exactly when the data is clustered so matching rows concentrate in few blocks. **Partitioning** (units 5–6): make the clustering deliberate, so `order_ts >= '2026-01-01'` maps to whole regions that are read or skipped wholesale — Snowflake's micro-partitions and Hive-style date partitions are both this move at different granularities. Keep the causal order straight, because interviews and design reviews test it: columnar layout cuts the *projectivity* cost first; clustering and pruning then cut the *selectivity* cost on top of it. A row store can be partitioned too, but it starts 5.7× behind on every scan before pruning is even discussed."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The unit set out to explain why analytics is a separate discipline, and it now has the full argument in numbers. Analytical queries are scans (the selectivity crossover); scans are priced in bytes read; and byte cost is set by layout — columnar reads only the referenced columns' bytes, a 5–6× structural win on a typical wide table that per-column compression stretches to 20–40×, at the deliberate expense of writes and point lookups, which is a price the register must not pay and the analyst never notices. One decision — *store this table by columns* — is thus not a tuning flag but a declaration of workload allegiance, and it is the reason the pipeline of lesson 2 exists at all: data must *move* from the register's layout to the analyst's. Unit 2 descends one more level: what exactly is inside those column regions — the encodings, the compression, the file formats (CSV to Avro to Parquet) — and why the format choice alone can change a query's cost by an order of magnitude."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A `shipments` table has N = 80 M rows and columns totaling Σw = 200 B; a carrier-performance query references columns totaling 24 B. Compute bytes read under row and columnar layout, the improvement factor, and the further read size if the referenced columns compress at a blended 5×.",
                  "solution": "Row: 80 M × 200 B = 16 GB. Columnar: 80 M × 24 B = 1.92 GB — factor 200/24 ≈ 8.3×. Compressed: 1.92 GB / 5 = 384 MB — ≈ 42× less I/O than the row store, from layout and encoding alone.",
                  "hint": "Apply I/O_row = N·Σ_all, I/O_col = N·Σ_Q, then divide by the compression ratio."
                },
                {
                  "prompt": "Your columnar table serves the Monday query in 0.9 s. An engineer adds `WHERE region = 'EU'` (12% of rows, rows in random order) and is surprised the query is *not* faster. Explain precisely why, then state the two structures that would make it faster and the data property each needs.",
                  "solution": "Columnar scan I/O is projectivity-priced: every value of the referenced columns is read regardless of how many rows match, so a filter changes the output, not the bytes (it even adds the region column, slightly increasing Q). To convert selectivity into savings: (1) zone maps — min/max per block lets blocks whose range excludes 'EU' be skipped, but only helps if the data is clustered so EU rows concentrate in few blocks (random order ⇒ every block contains EU ⇒ nothing skips); (2) partitioning by region — makes the clustering deliberate, so the scan reads only EU regions. Both require *layout order*, not just the predicate.",
                  "hint": "What does the scan have to read even for non-matching rows? What property makes skipping possible?"
                },
                {
                  "prompt": "Using the write-path walkthrough, explain why columnar engines batch writes through a row-oriented (or in-memory) buffer that merges into column regions asynchronously — and identify the workload property that makes this trick legitimate for analytics but illegitimate for the register.",
                  "solution": "A direct columnar insert touches one region per column (20 scattered writes, or decode/re-encode of 20 compressed blocks) per row — ruinous per-row cost. Buffering rows and merging in bulk amortizes: one merge rewrites each column region once for thousands of rows. Legitimacy hinges on staleness tolerance: analytics tolerates data appearing seconds-to-minutes late, so 'not yet merged' rows can be absent (or served from the small buffer) without breaking the contract; the register's reads are read-your-own-writes transactional (a checkout must see the inventory decrement immediately), so asynchronous visibility is a correctness violation, not a tuning choice.",
                  "hint": "Amortization on one side; read-your-own-writes on the other."
                },
                {
                  "prompt": "A fraud-scoring service does 95% single-order lookups by order_id needing all columns (p99 budget 10 ms) and 5% daily full-table aggregate scans over 3 columns. A colleague proposes 'columnar, since we're an analytics company'. Decide the layout and defend it with this unit's arithmetic; then say what you'd do about the 5%.",
                  "solution": "Row layout. The 95% workload is the register's shape: key-addressed point lookups needing whole rows — row layout serves each with one index probe and one page, well inside 10 ms; columnar would gather across every column region per lookup, wrecking the p99 for the dominant workload. The 5% scans are slower on rows (read full width), but they are daily and latency-tolerant — and the correct fix is this unit's founding move in miniature: replicate/export the 3 needed columns to an analytical copy (a pipeline), not contort the operational store. Layout follows the workload that has the SLO.",
                  "hint": "Which workload owns the latency budget? Point lookups needing all columns are the register's signature."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u1l3-i1",
              "front": "Selectivity vs projectivity of a query",
              "back": "Selectivity = fraction of rows matched; projectivity = set of columns referenced. Above the index crossover, scan cost is priced by projectivity; selectivity only pays off via clustering + pruning structures."
            },
            {
              "id": "u1l3-i2",
              "front": "Scan I/O formula under row vs columnar layout",
              "back": "Row: N·Σ(all column widths) regardless of the query. Columnar: N·Σ(referenced widths) — advantage = table width / referenced width, then × per-column compression."
            },
            {
              "id": "u1l3-i3",
              "front": "Why does columnar layout punish writes and point lookups?",
              "back": "Each row's values live in one region per column: an insert touches C regions instead of one page; a full-row read gathers from C regions. Layout is the transpose of the workload it serves."
            },
            {
              "id": "u1l3-i4",
              "front": "What is the PAX / row-group hybrid, and which famous format uses it?",
              "back": "Partition rows into large row groups; store column-by-column within each group — columnar I/O with row-locality and parallelism. This is Parquet's structure."
            },
            {
              "id": "u1l3-i5",
              "front": "Why doesn't a WHERE clause reduce a naive columnar scan's I/O, and what fixes it?",
              "back": "Every value of referenced columns is read regardless of matches. Zone maps (skip blocks whose min/max excludes the predicate) and partitioning convert selectivity into skipped I/O — both require clustered layout order."
            }
          ]
        }
      ],
      "masteryCheck": {
        "id": "u1-check",
        "questions": [
          {
            "id": "u1q1",
            "type": "open",
            "points": 2,
            "prompt": "A ride-hailing company runs dispatch (rider requests matched to drivers, locations updated every few seconds, payments on trip completion) and a weekly operations review (utilization by city by hour, cancellation rates, driver earnings distributions over the last quarter). The CTO proposes 'one really powerful Postgres cluster for everything, so there's a single source of truth.' Evaluate the proposal: characterize each workload on the axes from this unit, predict the two concrete failure mechanisms of colocation, and state the architecture you'd propose instead — quantifying at least one claim.",
            "rubric": [
              "Characterizes dispatch as OLTP (key-addressed reads/writes of few rows, millisecond latency, high concurrency, recent working set) and the weekly review as OLAP (scans over a quarter of history, few columns, aggregates, latency-tolerant, read-only)",
              "Names both colocation failure mechanisms from the unit: buffer-pool pollution (scans evict the hot dispatch working set, hurting OLTP after the query ends) and long-snapshot/MVCC pressure or I/O-bandwidth contention during the scan",
              "Invokes the selectivity crossover (analytical queries match far more than ~1/(r·ρ) of rows, so indexes on the OLTP store cannot serve them; they will scan) rather than proposing more indexes",
              "Proposes separation: an analytical store (columnar) fed by a pipeline from the OLTP system, with at least one quantified claim (e.g., crossover selectivity ~0.1%, scan bytes row-vs-column, or the working-set/cache argument)",
              "Addresses the 'single source of truth' concern honestly — e.g., the OLTP system remains the system of record; the analytical copy is derived, and freshness is set by the weekly review's needs (nightly batch suffices)"
            ],
            "solution": "Dispatch is textbook OLTP: every operation touches a handful of rows by key (rider, driver, trip), requires milliseconds at thousands of concurrent actors, mixes reads and writes, and its working set is the last few minutes of state. The weekly review is textbook OLAP: it scans a quarter of trip history (tens of millions of rows), references a few columns per query, aggregates, tolerates minutes, and writes nothing. Colocated, they damage each other through two mechanisms: (1) each review query streams gigabytes of historical pages through the buffer pool, evicting the hot dispatch set — dispatch pays cache misses long after the query finishes; (2) multi-minute analytical snapshots hold back MVCC cleanup (bloat) and the scan competes for I/O bandwidth during peak if run carelessly. Adding indexes cannot help: with r ≈ 50 rows/page and ρ ≈ 20, the crossover is f* ≈ 0.1%, and 'utilization by city by hour for a quarter' matches ~100% of the period's rows — 1000× past the crossover; the planner will scan regardless. Proposal: Postgres remains the system of record for dispatch; a nightly (weekly decisions need no more freshness) batch pipeline exports trips/payments into a columnar analytical store, where the utilization query reads only its ~4 referenced columns — on a 200 B-wide, 50 M-row quarter, ~1 GB instead of ~10 GB before compression. 'Single source of truth' is preserved by direction: the analytical copy is derived and rebuildable from the OLTP system, never written directly.",
            "explanation": "The unit's diagnosis run end-to-end: classify by workload axes, predict interference via the two named mechanisms, dismiss indexes via the crossover, and separate the systems with a pipeline — sized by the freshness the consumer actually needs."
          },
          {
            "id": "u1q2",
            "type": "numeric",
            "prompt": "A table stores r = 80 rows per page and the random-access penalty is ρ = 25. Compute the crossover selectivity f* below which a secondary-index plan beats a full sequential scan. Give f* as a decimal fraction (e.g., 0.002).",
            "answer": 0.0005,
            "tolerance": 0.00005,
            "explanation": "f* = 1/(r·ρ) = 1/(80 × 25) = 1/2000 = 0.0005 — five hundredths of a percent. Any query matching more rows than that should scan; this is why 'add an index' cannot rescue analytical queries.",
            "points": 1
          },
          {
            "id": "u1q3",
            "type": "numeric",
            "prompt": "An `events` table has 200 M rows; its columns total 150 B per row, and a funnel query references columns totaling 30 B. Ignoring compression, how many times more bytes does a row-layout scan read than a columnar scan for this query?",
            "answer": 5,
            "tolerance": 0.01,
            "explanation": "Row layout reads N·150 B = 30 GB; columnar reads N·30 B = 6 GB; ratio = 150/30 = 5×. The factor is table width over referenced width — selectivity never enters, and compression would widen it further.",
            "points": 1
          },
          {
            "id": "u1q4",
            "type": "short",
            "prompt": "One word each: a naive columnar scan's I/O cost is determined by the query's ______ (which columns it references), not its ______ (fraction of rows it matches).",
            "accept": [
              "projectivity, selectivity",
              "projectivity selectivity",
              "projectivity; selectivity",
              "projectivity and selectivity",
              "projectivity then selectivity"
            ],
            "explanation": "Projectivity (referenced columns) sets the bytes a columnar scan must read; selectivity (matched rows) only becomes savings once clustering plus zone maps or partitioning let whole blocks be skipped — structures built in units 4–6.",
            "points": 1
          },
          {
            "id": "u1q5",
            "type": "mcq",
            "prompt": "After adding six secondary indexes to `order_lines` 'for the analysts', checkout p99 latency rises and the analysts report no improvement. Which explanation is correct?",
            "options": [
              "Index maintenance is charged to every write (each insert now updates six extra B-trees), while analytical queries match far more than the crossover selectivity, so the planner ignores the indexes and scans anyway",
              "The indexes consume disk space, and the resulting larger database files make all queries proportionally slower",
              "The analysts' SELECT queries now take exclusive locks on the new indexes, blocking checkout transactions until each analytical query completes",
              "B-tree indexes slow down reads as well as writes, because every SELECT must traverse all indexes on the table before reaching the heap"
            ],
            "answer": 0,
            "explanation": "Writes pay for every index on the table (prepaid reads, billed to every insert), and the crossover proposition says queries matching ≫ 1/(r·ρ) of rows scan regardless — so the cost lands and the benefit never arrives. (b) is marginal — size alone doesn't move p99 like maintenance does; (c) ordinary SELECTs take no exclusive locks that block writers in MVCC engines; (d) a SELECT uses at most the indexes the planner chooses, not all of them.",
            "points": 1
          },
          {
            "id": "u1q6",
            "type": "proof",
            "points": 2,
            "prompt": "Prove the scan I/O proposition: for a table of N rows with columns c₁…c_C of widths w₁…w_C, a scan referencing column set Q reads N·Σ_all wᵢ bytes under row layout but N·Σ_{i∈Q} wᵢ under columnar layout. State the physical assumption about I/O that the row-layout half depends on, and explain in one sentence why the columnar figure is independent of the query's selectivity.",
            "rubric": [
              "Row-layout half: argues from the page structure — I/O happens in page units and every page interleaves all columns of its rows, so no page contains only referenced bytes and a full scan reads all N·Σ_all wᵢ bytes (states the page/granularity assumption explicitly)",
              "Columnar half: argues each referenced column is a contiguous region of exactly N·wᵢ bytes, regions are disjoint, and unreferenced regions are never touched — total N·Σ_{i∈Q} wᵢ",
              "Concludes the improvement factor Σ_all/Σ_Q by division, with correct handling of the referenced set Q",
              "Selectivity independence: notes a scan must examine the referenced columns' values for every row to decide matches, so matched fraction changes output, not bytes read (absent additional structure like zone maps)"
            ],
            "solution": "Row layout: disk and buffer I/O move whole pages. Under NSM a page stores complete rows — every column's bytes for those rows are interleaved on the page — so there exists no page consisting only of referenced columns' bytes. A scan must therefore fetch every page of the table: N rows × Σ_all wᵢ bytes per row (page overheads only add to this). Columnar layout: column cᵢ is stored as its own contiguous region of exactly N·wᵢ bytes, one value per row position. The scan fetches precisely the regions for i ∈ Q — disjoint from all unreferenced regions, which contribute zero I/O — totaling N·Σ_{i∈Q} wᵢ. Dividing gives the advantage (Σ_all wᵢ)/(Σ_Q wᵢ). Selectivity independence: to determine which rows match, the scan must read the referenced columns' values at every row position, so bytes read are fixed by Q and N whether 0.1% or 99% of rows match; selectivity can only reduce I/O when auxiliary structure (min/max zone maps over clustered data, partitioning) permits skipping whole regions without reading them. ∎",
            "explanation": "The unit's central calculation — the physical-layout fact underneath every analytical system in the course. The page-granularity assumption is what makes the row-store half true, and the last clause is why units 4–6 build pruning structures on top of columnar layout rather than instead of it."
          }
        ]
      }
    },
    {
      "id": "u2",
      "title": "Storage: Files, Formats, and Object Stores",
      "summary": "How values become bytes: text vs binary formats, Avro, the columnar encodings behind 10× compression, Parquet's anatomy, and the object store underneath the lake.",
      "intro": "Unit 1 ended with a layout decision — analytics wants columns — and a promise: that the *format* of bytes at rest can move query cost by an order of magnitude on its own. This unit keeps that promise at three levels of depth. First, serialization itself: what CSV, JSON, and Avro actually write, why text formats are simultaneously the most interoperable and the most dangerous (Trellis's discount incident was a format failure before it was a process failure), and what a schema buys when it travels with the data. Second, the columnar encodings — dictionary, run-length, delta, bit-packing — that turn a column's regularity into compression ratios no row-oriented page can reach, with the arithmetic proved, not asserted. Third, the assembled artifact: Parquet's row groups, column chunks, and statistics-bearing footer, and the cloud object store it lives in — an immutable, request-priced, infinitely wide filesystem whose economics shape every lake and lakehouse in units 5 and 6. The gate asks you to price format decisions in bytes and requests, and to choose formats the way an engineer does: by workload.",
      "references": [
        "Joe Reis & Matt Housley — Fundamentals of Data Engineering, ch. 6 (storage) and appendix on serialization/compression",
        "Martin Kleppmann — Designing Data-Intensive Applications, ch. 4 (encoding and evolution)",
        "Apache Parquet format specification (parquet.apache.org); Apache Avro specification (avro.apache.org)",
        "Abadi, Madden & Hachem — Column-Stores vs. Row-Stores (SIGMOD 2008), §on compression",
        "Melnik et al. — Dremel: Interactive Analysis of Web-Scale Datasets (VLDB 2010) — the nested-columnar ancestor of Parquet"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u2l1",
          "title": "Serialization: How a Value Becomes Bytes",
          "estMinutes": 26,
          "builds_on": [
            "u1l2",
            "u1l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The alphabet under the architecture",
              "body": "*Rows, Columns, and the Arithmetic of Scans* priced layouts in bytes, and *The Data Engineering Lifecycle* left Trellis's v0 pipeline exporting CSV — a choice we called a sin and deferred. This lesson pays that debt. Before any question of rows versus columns comes a more basic one: when the value `19.99` or the timestamp `2026-08-01T14:22:07Z` leaves a database and lands in a file, **what bytes represent it, and what else must travel with them for a reader to reconstruct the value?** That is serialization, and its design space is small enough to master completely: text or binary; schema carried in the reader's head, alongside the data, or inside it; rows together or columns together. Every format you will ever meet — CSV, JSON, Avro, Protobuf, ORC, Parquet — is a point in that space, and every format-related outage (including the discount incident) is a mismatch between the point chosen and the workload's actual needs."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Serialization format; schema placement",
              "statement": "A **serialization format** is a rule for mapping typed values to byte sequences and back. Formats divide on three axes.\n\n**Text vs binary**: text formats (CSV, JSON) encode values as human-readable character strings — the integer 1000000 becomes seven ASCII digits — while binary formats (Avro, Protobuf, Parquet) encode values in machine representations — the same integer in 4 bytes, or fewer with variable-length encoding.\n\n**Schema placement**: a format is **schema-external** if the bytes are uninterpretable without an agreement held outside the data (CSV: column order and types live in the reader's head or a wiki); **self-describing** if structure travels redundantly with every record (JSON: keys repeated in every object); **schema-embedded** if a complete typed schema is written once in the file and every record is encoded against it (Avro: header schema + raw binary records; Parquet: footer schema).\n\n**Orientation**: row-oriented formats write each record's fields contiguously (CSV, JSON-lines, Avro) — natural for record-at-a-time writing and reading; column-oriented formats write each field's values contiguously (Parquet, ORC) — natural for analytical scans, per unit 1's proposition."
            },
            {
              "type": "example",
              "heading": "Worked example: one order line, four formats",
              "body": "Serialize one Trellis order line — order_line_id 88123001, order_id 82471119, product_id 77, quantity 2, unit_price 19.99, order_ts 2026-08-01T14:22:07Z — and count bytes.\n\n**CSV**: `88123001,82471119,77,2,19.99,2026-08-01T14:22:07Z` — **48 bytes**. No types anywhere: `77` might be an integer, a string, or a zero-padded code; `19.99` might be dollars or a percentage. The *meaning* lives in a README nobody updates.\n\n**JSON-lines**: `{\"order_line_id\":88123001,\"order_id\":82471119,\"product_id\":77,\"quantity\":2,\"unit_price\":19.99,\"order_ts\":\"2026-08-01T14:22:07Z\"}` — **131 bytes**, of which ~70 are the six key names, repeated identically in all 40 million lines. Self-describing, at the price of describing itself 40 million times.\n\n**Avro**: schema once in the header (~300 bytes, with types and doc strings), then per record: two long varints (~5 bytes each), one varint (1–2 bytes), one varint (1 byte), a double (8) or decimal, a long timestamp-millis (~6) — **≈ 26 bytes**, typed, with the field names written exactly once per file.\n\n**Parquet**: not a per-record format at all — the same values land in column chunks where 40 M product_ids compress together (next lesson) — but the per-value amortized cost lands near **7 bytes** for this table. The progression 131 → 48 → 26 → 7 is the storage story of this unit in miniature: stop repeating structure, then stop storing values naively."
            },
            {
              "type": "text",
              "heading": "What text formats actually cost",
              "body": "CSV's 48 bytes versus Avro's 26 understates the real gap, because text formats charge three further taxes. **Parse cost**: every read re-parses characters into values — integer parsing, quote handling, date parsing — burning CPU on work a binary format did once at write time; at scan speeds this, not I/O, is often the bottleneck (a tuned CSV parser manages a few hundred MB/s per core; Parquet decoding of the same logical data runs several times faster because most values decode by array copy). **Ambiguity**: CSV has no standard for quoting, escaping, nulls versus empty strings, or embedded newlines — every producer-consumer pair is a private dialect, and a comma inside a product name shifts every subsequent field one column right. **Silence**: because nothing declares types, *wrong* data loads *successfully*. Trellis's discount incident is the canonical case: the column's meaning changed from dollars to percentage, the CSV pipeline loaded it without a murmur, and the error surfaced days later in a dashboard. A schema-embedded format converts that class of silent corruption into a loud, immediate failure: the writer's schema says `discount_pct: double` where the reader expected `discount_usd: decimal(8,2)`, and the load *stops*. Loud failures are a gift; the entire discipline of schema management exists to make data failures loud."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Schema evolution (Avro's reader/writer resolution)",
              "statement": "**Schema evolution** is the controlled change of a dataset's schema over time such that data written under old schemas remains readable under new ones (**backward compatibility**) and data written under new schemas remains readable by old readers (**forward compatibility**). Avro's model: every file embeds the **writer's schema**; a consumer reads with its own **reader's schema**, and the runtime resolves them field by field — fields present in both are matched *by name* (not position); a field the reader expects but the writer lacks is filled from the reader schema's **default value** (and is an error if no default exists); a field the writer wrote but the reader ignores is skipped. Consequences: adding a field *with a default* is both backward- and forward-compatible; removing a field is safe only if readers have a default for it; **renaming a field is a delete plus an add** (aliases exist precisely to soften this); changing a field's type is governed by a small promotion lattice (int→long→float→double)."
            },
            {
              "type": "example",
              "heading": "Worked example: the discount incident, replayed under Avro",
              "body": "Replay unit 1's incident with the v0 pipeline swapped from CSV to Avro, and watch where it stops. The app team's release changes the exporter's writer schema: `{\"name\":\"discount\",\"type\":\"double\",\"doc\":\"per-line discount, USD\"}` becomes `{\"name\":\"discount_pct\",\"type\":\"double\",\"doc\":\"per-line discount, percent of gross\"}`.\n\nThat night, the loader reads the new files with its existing reader schema, which expects `discount` with no default. Resolution: the writer no longer provides `discount` (rename = delete + add), the reader has no default for it — **hard error, 2:07 a.m., load halts, on-call paged**. Yesterday's serving tables remain intact (the atomic-swap fix from unit 1's exercises). The on-call reads the diff of writer schemas — it is *in the file header*, so the change is self-documenting — files a ticket, and the fix is an explicit decision: either the exporter restores the old field (computing dollars from percent), or the pipeline's reader schema and downstream models are updated together.\n\nCount what changed versus the CSV timeline: detection moved from day 3 (CFO) to minute 0 (loader); the blast radius shrank from 'two days of wrong revenue in every dashboard' to 'one delayed load'; and the *diagnosis* came from the schema diff rather than forensic spreadsheet archaeology. Same organizational failure — an unannounced semantic change — but the format converted it from silent corruption into a loud, local, attributable stop. This is what 'schema-embedded' buys, and it is why no serious pipeline moves typed business data as CSV."
            },
            {
              "type": "decision",
              "heading": "Choosing a serialization format",
              "rows": [
                [
                  "Interchange with humans, spreadsheets, one-off vendor drops",
                  "CSV — universal and inspectable; quarantine it at the edge, parse defensively, convert immediately"
                ],
                [
                  "APIs, configs, sparse/nested one-off payloads",
                  "JSON — self-describing and universal; never as a bulk analytical format (keys repeat per record)"
                ],
                [
                  "Row-at-a-time pipeline transport: exports, event streams, Kafka payloads",
                  "Avro (or Protobuf) — compact typed binary, schema evolution with rules, splittable files, cheap record-at-a-time append"
                ],
                [
                  "Analytical storage: anything queried by scans",
                  "Parquet — columnar chunks, heavy encoding, statistics in the footer (lessons 2–3)"
                ],
                [
                  "Long-term raw archive you must reread in 5 years",
                  "schema-embedded formats only — the file must be interpretable when the wiki and the team are gone"
                ]
              ]
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Row-binary and columnar are teammates, not rivals.** A common confusion: 'we use Parquet, so why does the ingestion path emit Avro?' Because the two sit at different lifecycle stages. Ingestion (unit 8) produces records one at a time — an event, a changed row — and appending a record to an Avro file or Kafka topic costs O(record); appending one record to a Parquet file is impossible without rewriting a column chunk (unit 1's write-path argument, now at file granularity). The standard shape is therefore: **row-binary in motion, columnar at rest**, with a batch job compacting the former into the latter — exactly the C-Store write-store/read-store split, reborn at the file level."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Serialization is a three-axis choice — text/binary, where the schema lives, rows/columns — and each axis has a workload answer: binary beats text on size, CPU, and *loudness of failure*; schemas belong inside the data they govern, with evolution rules rather than vibes; and orientation follows unit 1's law, rows for record-at-a-time motion, columns for scans. Trellis v1 accordingly exports Avro tonight. But the analytical destination format is still a promise: we asserted Parquet reaches ~7 bytes per 26-byte record and claimed 4–8× compression per column in unit 1 without proof. The next lesson opens the column chunk and does the arithmetic — dictionary, run-length, delta, bit-packing — and proves exactly when each encoding wins."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A partner sends a daily 2 GB JSON-lines file of shipment events with 9 fields; measurement shows key names are 41% of the bytes. The pipeline converts it to Avro on arrival. Estimate the Avro size (assume values in Avro binary average 60% of their JSON text size), and name two failure classes the conversion eliminates beyond size.",
                  "solution": "JSON values = 59% of 2 GB ≈ 1.18 GB of text values; at 60% in binary ≈ 0.71 GB, plus a one-time schema header — ≈ 0.7 GB, roughly 3× smaller. Eliminated failure classes: (1) silent type drift — a field changing type/meaning now violates the writer schema or fails reader resolution loudly instead of loading as different-looking strings; (2) structural ambiguity — quoting/escaping/null-vs-missing dialect bugs disappear because the binary encoding is unambiguous (also acceptable: per-read parse CPU eliminated).",
                  "hint": "Remove the repeated keys first, then shrink the values; then think about what a schema makes loud."
                },
                {
                  "prompt": "Using Avro's resolution rules, classify each change as backward-compatible, forward-compatible, both, or breaking — and state the rule that decides it: (a) add field `gift_message` with default null; (b) delete field `fax_number` for which readers declare a default; (c) rename `discount` to `discount_pct`; (d) promote `quantity` from int to long.",
                  "solution": "(a) Both: new readers fill the default when reading old data (backward); old readers skip the unknown field (forward). (b) Both, but only because the readers hold a default — resolution fills it when the writer omits the field; without the default it breaks backward reads of new data. (c) Breaking both ways: resolution matches by name, so rename = delete (readers expecting `discount` find nothing, no default) + add (old readers skip `discount_pct`) — semantics silently vanish; aliases or a dual-write migration are required. (d) Backward-compatible via the promotion lattice (long readers accept int data); old int readers cannot accept long writes, so not forward-compatible.",
                  "hint": "Match by name; missing fields need defaults; promotions go one direction."
                },
                {
                  "prompt": "A colleague proposes storing the clickstream archive — written once, reread rarely but for years — as gzipped CSV 'because everything can read CSV'. Make the counter-argument in three sentences using this lesson's axes, then concede the one context where their argument wins.",
                  "solution": "The archive's readers are unknown future systems, which is precisely when schema-external formats fail: in five years the column order, types, and null conventions live in no one's head, and gzipped CSV must be fully re-parsed (and its dialect re-guessed) to extract anything. A schema-embedded binary format is self-documenting at the byte level — the file itself says what it contains — and costs less to store and to reread. Concession: at the *edge* — handing a one-off extract to a human, a spreadsheet, or an unknown partner tool today — CSV's universality wins, which is why it belongs at boundaries, not in archives.",
                  "hint": "Who is the reader in 5 years, and what do they know?"
                },
                {
                  "prompt": "Trellis's mobile team wants to send app events straight to the pipeline as Parquet files, one file per event batch of ~200 events, 'to skip the conversion step'. Using the row-binary-in-motion principle and unit 1's write-path argument, explain the two costs of this design, and give the standard alternative.",
                  "solution": "(1) Write-side: Parquet is columnar — writing 200 events means encoding ~20 tiny column chunks plus footer metadata per file; the format's fixed overhead and encoding machinery are amortized over almost nothing, and appending later events is impossible without rewrite. (2) Read-side: thousands of tiny files per hour create the small-files problem — per-file open/footer-read/request costs dominate scans (lesson 3 prices this on the object store). Standard alternative: emit events as row-binary (Avro records to a stream or micro-batched files), then a compaction job writes large Parquet files (≥ 100 MB-scale row groups) on a schedule — row-binary in motion, columnar at rest.",
                  "hint": "What does a 200-row Parquet file amortize its structure over?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u2l1-i1",
              "front": "The three axes on which serialization formats divide",
              "back": "Text vs binary; schema placement (external / self-describing per record / embedded once per file); orientation (row vs column)."
            },
            {
              "id": "u2l1-i2",
              "front": "Why JSON-lines is a poor bulk analytical format even though it's self-describing",
              "back": "It describes itself per record — key names repeat in every line (often ~half the bytes), and values stay as parse-costly text."
            },
            {
              "id": "u2l1-i3",
              "front": "Avro schema resolution: how are fields matched, and what fills a missing one?",
              "back": "By name, not position; a field the writer lacks is filled from the reader schema's default — no default ⇒ loud error. Rename = delete + add (breaking)."
            },
            {
              "id": "u2l1-i4",
              "front": "What did schema-embedded formats change about the discount incident?",
              "back": "Silent corruption became a loud, immediate, local failure: the load halted at resolution time with a self-documenting schema diff, instead of wrong revenue shipping for days."
            },
            {
              "id": "u2l1-i5",
              "front": "'Row-binary in motion, columnar at rest' — what and why",
              "back": "Transport/ingest as Avro-style row binary (O(record) appends), store analytics as Parquet (scan-priced); a compaction job converts between them. Rows write cheap; columns read cheap."
            }
          ]
        },
        {
          "id": "u2l2",
          "title": "Columnar Encodings: Where 10× Comes From",
          "estMinutes": 28,
          "builds_on": [
            "u1l3",
            "u2l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Opening the column chunk",
              "body": "*Serialization* ended at Parquet's door with an unexplained number: ~7 bytes per order line whose raw fields total ~40. This lesson opens the door. The claim to establish is not that compression exists — gzip exists — but that **columnar layout changes what compression can see**. A general-purpose compressor over row-oriented bytes sees `88123001,82471119,77,2,19.99,…` — heterogeneous types interleaved, patterns broken every few bytes. The same compressor over a column region sees forty million product IDs *in a row*: one type, one distribution, long runs, small deltas. Columnar encodings are specialized compressors that exploit exactly four regularities a single column exhibits — **few distinct values** (dictionary), **repetition in sequence** (run-length), **small numeric range** (bit-packing), **smooth progression** (delta) — and their compositions. Each comes with arithmetic that predicts its ratio from measurable statistics of the column, which is what turns compression from folklore into engineering: you can *compute*, before choosing, what a column will cost at rest and per scan."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The four core encodings",
              "statement": "Fix a column of N values, each w bytes raw.\n\n**Dictionary encoding**: store the d distinct values once in a dictionary array; replace each value with its dictionary index. Cost: d·w (dictionary) + N indices.\n\n**Bit-packing**: store each of N small non-negative integers in exactly b = ⌈log₂(max+1)⌉ bits instead of a full machine word: N·b bits total.\n\n**Run-length encoding (RLE)**: replace each maximal run of a repeated value with the pair (value, run-length). Cost: R·(w + ℓ) where R is the number of runs and ℓ the run-length field's size.\n\n**Delta encoding**: store the first value, then each successive difference vᵢ₊₁ − vᵢ; effective when deltas span a far smaller range than values, so the deltas bit-pack tightly (delta-of-delta extends this to smooth *rates*, e.g. timestamps at near-regular intervals).\n\nThese compose: Parquet's workhorse is **dictionary + RLE/bit-packed indices** — dictionary first, then the index stream, whose values lie in [0, d), is itself run-length- and bit-packed. A general-purpose codec (snappy, zstd) is applied after encoding, per page, and typically finds another 1.5–3× in what the specialized encodings left."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The dictionary + bit-packing bound",
              "statement": "Dictionary encoding with bit-packed indices stores a column of N values (w bytes each, d distinct) in\n\nS = d·w + N·⌈log₂ d⌉/8 bytes,\n\nso for N ≫ d the compression ratio approaches 8w/⌈log₂ d⌉ — it depends only on the raw width and the *logarithm* of the distinct count, not on N. Consequently: (i) low-cardinality columns of any physical width compress dramatically (a 20-byte status string with d = 6 approaches ratio 8·20/3 ≈ 53×); (ii) the encoding loses exactly when cardinality approaches N (unique keys: d = N makes S exceed raw size); (iii) sorting the column by its own values never hurts and often helps further, because the index stream then consists of d runs and RLE collapses it below the bit-packed bound.",
              "proof": "The dictionary stores each distinct value once: d·w bytes. Each of the N values is replaced by an index in [0, d); representing an index requires ⌈log₂ d⌉ bits (fewer cannot distinguish d values — this is the information-theoretic floor for equiprobable indices), so the index stream is N·⌈log₂ d⌉ bits = N·⌈log₂ d⌉/8 bytes. Summing gives S. Divide raw size N·w by S: ratio = N·w / (d·w + N·⌈log₂ d⌉/8) → 8w/⌈log₂ d⌉ as N/d → ∞. For (ii): with d = N the dictionary alone equals raw size and indices are pure overhead. For (iii): sorted by value, equal values are adjacent, so the index stream has exactly d maximal runs; RLE stores d pairs — O(d) instead of O(N) index bytes — and the dictionary term dominates, which for d ≪ N is a further collapse. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: pricing Trellis's four query columns",
              "body": "Unit 1 promised a blended 4× on the Monday query's columns; now compute each, for N = 40 M rows.\n\n**product_id** (8 B, d = 10,000 distinct): ⌈log₂ 10000⌉ = 14 bits. S = 10,000·8 B + 40 M·14/8 B = 80 KB + 70 MB ≈ 70 MB versus 320 MB raw — **4.6×**, matching the promise.\n\n**quantity** (4 B, values 1–20): bit-pack at 5 bits → 25 MB versus 160 MB — **6.4×**; and since most order lines have quantity 1–2, RLE on top of dictionary indices does better still in sorted-by-product regions.\n\n**unit_price** (8 B, d ≈ 3,000 catalog prices): 12 bits → 60 MB + 24 KB versus 320 MB — **5.3×**. Note *why* this works: prices are business-discrete, not mathematically continuous. A raw float sensor column with d ≈ N would refuse dictionary encoding entirely — clause (ii).\n\n**order_ts** (8 B, microseconds, nearly sorted): consecutive deltas average ~1.6 s ≈ 2²¹ μs; delta encoding stores ~22-bit deltas versus 64-bit values — ~2.9×; zstd over the delta stream (deltas cluster by time-of-day) reaches ~6–8×, say 45–55 MB versus 320 MB.\n\nTotal for the four referenced columns: ≈ **200–210 MB versus 1.12 GB raw columnar** — the promised ~4–5× blended, computed rather than asserted. Against the 6.4 GB row-store scan of unit 1, the same logical query now moves ~30× fewer bytes."
            },
            {
              "type": "example",
              "heading": "Worked example: why sort order is a compression decision",
              "body": "Take Trellis's `channel` column (values web/app/marketplace, d = 3, 2-bit indices) across 40 M rows, and compare the *same encoding* under two physical orders.\n\n**Table sorted by order_ts** (the natural ingest order): channels interleave nearly randomly row to row. The index stream is 40 M × 2 bits = 10 MB; RLE finds only short accidental runs and cannot beat plain bit-packing, so ≈ 10 MB stands.\n\n**Table sorted by (channel, order_ts)**: the index stream becomes exactly 3 maximal runs — RLE stores three (value, length) pairs: **tens of bytes**. A six-orders-of-magnitude difference in one column, from row order alone.\n\nThe catch — and the design tension the course returns to in units 4–6 — is that a table has *one* physical order, and every column wants it: sorting by channel ruins order_ts's delta smoothness (now it restarts three times — actually still fine) but more importantly ruins *pruning* on date (unit 4). Choosing the sort key is therefore a multi-objective decision: it sets which columns' runs collapse (compression), and which predicates can skip blocks (pruning). Rule of thumb the industry converged on: sort by the dominant *filter* columns (usually time first), and let high-cardinality attribute columns settle for dictionary + bit-packing — which, per the proposition, is already 4–6× without any help from order."
            },
            {
              "type": "code",
              "heading": "Reading an encoding, by hand",
              "lang": "text",
              "code": "Column: order_status for 12 rows (raw: 12 × 10-byte strings = 120 B)\n values: [placed, placed, placed, shipped, shipped, placed, placed,\n          delivered, delivered, delivered, delivered, returned]\n\nStep 1 — dictionary (d = 4):        0=placed 1=shipped 2=delivered 3=returned\n         dictionary cost:           4 × 10 B = 40 B  (paid once per chunk)\nStep 2 — index stream:              [0,0,0,1,1,0,0,2,2,2,2,3]\nStep 3 — RLE on indices:            (0,3)(1,2)(0,2)(2,4)(3,1)   → 5 runs\nStep 4 — bit-pack runs:             2-bit values + varint lengths ≈ 5 × ~1.5 B ≈ 8 B\n\nEncoded ≈ 48 B vs 120 B raw — and the ratio *improves* with N:\nat 40 M rows the dictionary is still 40 B; ratio → driven by runs/row, not d·w."
            },
            {
              "type": "text",
              "heading": "Decompression is not free — but encodings can be queried in place",
              "body": "A fair objection: if scans must decode all this cleverness, have we traded I/O for CPU? Two facts dissolve most of it. First, the specialized encodings decode at memory bandwidth or better — bit-unpacking and RLE expansion are branch-light array operations that modern engines vectorize (unit 4 shows SIMD chewing 8–16 values per instruction), so decode throughput of *gigabytes per second per core* is routine; the CPU-heavy step in the old world was parsing text, which we already eliminated. Second, and more elegantly: many operations never decode at all. A filter `status = 'delivered'` compares one dictionary code (2) against RLE runs — whole runs match or fail *en bloc*; a COUNT over a run-length column sums lengths without expanding them; a MIN/MAX over a dictionary-sorted chunk reads the dictionary's ends. This is **late materialization** — operate on compressed representations as long as possible, expand to raw values only when the query's output demands it — and it is a large part of why column stores beat row stores by more than the I/O arithmetic alone predicts (Abadi et al. measured the compounding in the 2008 comparison). General-purpose codecs (snappy, zstd) do cost a real decode pass, which is why they are applied per-page *after* the queryable encodings, as an outer wrapper the scan strips once per page — and why 'zstd level 19 everything' is a storage-bill optimization that can quietly become a query-latency regression."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**Measure d before you model.** Every ratio in this lesson came from one statistic per column: distinct count (or run structure, or delta range). These are one `SELECT approx_count_distinct(col)` away — profiling a table's columns takes minutes and converts every storage decision in this unit from guess to computation. When unit 5 introduces Snowflake's micro-partition metadata and unit 9 prices storage bills, the same statistics do the work. A data engineer who knows each column's d, range, and sort affinity can predict a table's compressed size to within ~30% on a napkin."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The 10× is no longer folklore: dictionary + bit-packing yields 8w/⌈log₂ d⌉ on low-cardinality columns, RLE collapses whatever the sort order makes adjacent, delta tames smooth sequences, and a general-purpose codec sweeps the residue — each ratio computable from column statistics you can measure in minutes. Compression turned out to be a *layout* property (what the compressor can see) and even a *query* property (late materialization filters without decoding). What remains is assembly: how these encoded chunks, their dictionaries, and the statistics that describe them are arranged into an actual file a dozen engines can read — and what changes when that file lives not on a disk but in an object store that charges per request and forbids appends. That file is Parquet, and it is the next lesson."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A `country` column: N = 250 M rows, raw width w = 2 B (ISO codes stored as fixed char(2)), d = 60 distinct. Compute the dictionary + bit-packed size and the ratio. Then recompute for the same data stored raw as UTF-8 strings averaging 12 B (full country names) and explain what the comparison teaches about width versus cardinality.",
                  "solution": "⌈log₂ 60⌉ = 6 bits. Indices: 250 M × 6/8 = 187.5 MB; dictionary 120 B — S ≈ 187.5 MB vs 500 MB raw: 2.7×. Full names: raw = 3 GB; S = 187.5 MB + 720 B ≈ 187.5 MB: 16×. Lesson: the encoded size is essentially *width-independent* (indices depend only on d), so the ratio scales linearly with raw width — wide low-cardinality columns are where dictionary encoding is most dramatic, and 'normalize the strings out' is unnecessary for storage reasons.",
                  "hint": "The index stream doesn't care what the values look like — only how many distinct there are."
                },
                {
                  "prompt": "Prove or refute: 'RLE on a column sorted by its own values always stores at most d runs, so its size is O(d) regardless of N.' Then give the adversarial *unsorted* case that makes RLE worse than no encoding, and the statistic you'd check to predict it.",
                  "solution": "Proved: sorted by value, all equal values are adjacent, so maximal runs = number of distinct values = d; RLE stores d (value, length) pairs = O(d·(w+ℓ)). Adversarial unsorted case: a column that alternates values every row (e.g., strictly alternating 0,1,0,1…) has R = N runs, so RLE stores N pairs of (value + length) — *larger* than N raw values. Predictive statistic: the run count R (equivalently average run length N/R) on the physical order in question; RLE wins iff R·(w+ℓ) < N·w, i.e., average run length exceeds (w+ℓ)/w.",
                  "hint": "Count maximal runs in each scenario; compare R·(w+ℓ) to N·w."
                },
                {
                  "prompt": "Trellis's `session_id` column is a random UUID (16 B, essentially all-distinct) and its `event_ts` is microsecond timestamps arriving in order at ~800 events/second. For each column: choose the encoding, compute (or bound) the outcome, and state the clause of the proposition or definition that justifies it.",
                  "solution": "session_id: d ≈ N — clause (ii): dictionary is counterproductive (dictionary alone ≈ raw size); random UUIDs have no runs, deltas, or small range, so no specialized encoding applies — store raw (or truncate/re-key upstream if the width matters; zstd finds little in random bytes). event_ts: deltas average 1/800 s = 1250 μs ≈ 2¹¹ — delta encoding stores ~11–16-bit deltas vs 64-bit raw: ~4–6× before the general-purpose pass, justified by the delta clause (smooth progression, small delta range). The pair teaches the profiling habit: one column statistic each (d; delta range) decided both.",
                  "hint": "One column has maximal cardinality; the other has minimal delta range."
                },
                {
                  "prompt": "A dashboard query is `SELECT COUNT(*) FROM orders WHERE status = 'delivered'`. The status column chunk is dictionary-encoded with RLE runs. Describe how an engine answers this *without decompressing* the column, and compute the work for a chunk with 1 M rows in 1,800 runs versus naive decode-then-compare.",
                  "solution": "Late materialization: look up 'delivered' in the dictionary once → code 2; stream the 1,800 (code, length) runs, and for each run with code = 2 add its length to the counter — no expansion to 1 M values ever happens. Work: 1,800 comparisons + ≤ 1,800 additions ≈ 3.6 k operations, versus naive: expand 1 M values (memory writes) + 1 M comparisons ≈ 2 M+ operations — roughly 500× less work, plus the avoided allocation. This is why 'compressed' and 'fast to query' are allies, not a trade-off, for the queryable encodings.",
                  "hint": "The predicate can be translated into dictionary-code space; runs match wholesale."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u2l2-i1",
              "front": "Dictionary + bit-packing size formula and asymptotic ratio",
              "back": "S = d·w + N·⌈log₂ d⌉/8; ratio → 8w/⌈log₂ d⌉ for N ≫ d — depends on raw width and log(distinct count), not N."
            },
            {
              "id": "u2l2-i2",
              "front": "When does dictionary encoding lose?",
              "back": "Cardinality near N (unique keys, random UUIDs, continuous measurements): the dictionary approaches raw size and indices become pure overhead."
            },
            {
              "id": "u2l2-i3",
              "front": "What determines whether RLE wins, and what physical choice controls it?",
              "back": "Run count R on the physical order (wins iff average run length > (w+ℓ)/w). Sort order controls it — sorted-by-value gives exactly d runs; the table's one sort key is a compression *and* pruning decision."
            },
            {
              "id": "u2l2-i4",
              "front": "Which encoding for near-regular timestamps, and why",
              "back": "Delta (or delta-of-delta): consecutive differences span a tiny range vs the values, so they bit-pack to ~⌈log₂(max delta)⌉ bits — e.g., 64-bit μs timestamps → ~16–22-bit deltas."
            },
            {
              "id": "u2l2-i5",
              "front": "Late materialization",
              "back": "Operate on encoded data as long as possible — compare predicates as dictionary codes, count via run lengths, skip decode until output demands raw values. Makes compression a query accelerator, not a tax."
            },
            {
              "id": "u2l2-i6",
              "front": "Where do snappy/zstd fit relative to the specialized encodings?",
              "back": "Applied per page *after* dictionary/RLE/delta, as an outer wrapper stripped once per page — they add 1.5–3× on the residue but are not queryable in place, so heavy levels trade query CPU for storage."
            }
          ]
        },
        {
          "id": "u2l3",
          "title": "Parquet and the Object Store",
          "estMinutes": 30,
          "builds_on": [
            "u2l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Assembling the artifact",
              "body": "*Columnar Encodings* produced beautifully compressed column chunks; this lesson gives them a home. Two homes, actually, designed together: **Parquet**, the file format that packages chunks with the metadata that makes them independently skippable; and the **cloud object store** (S3 and its peers), the storage system whose peculiar contract — immutable objects, per-request pricing, effectively infinite bandwidth-through-parallelism — has quietly dictated the physical design of every modern analytical system. The pairing is not incidental. Parquet's structure (large self-described files, metadata at the end, chunk-level independence) reads like a list of answers to the object store's constraints, and understanding *why* each structural choice answers a constraint is what lets you reason about the lakehouse systems of unit 6 — which are, at bottom, bookkeeping layers over exactly these files in exactly this store."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The Parquet file",
              "statement": "A **Parquet file** is a binary file organized as: a 4-byte magic header; a sequence of **row groups** — horizontal slices of the table, typically 128 MB–1 GB of encoded data, each containing one **column chunk** per column (the chunk holds that column's values for the group's rows, as a sequence of **pages** ~1 MB each, each page independently encoded per lesson 2 and then compressed); and a **footer** holding the complete typed schema, the file's row count, and per-column-chunk metadata — byte offsets, encodings, sizes, and **statistics: min, max, null count, distinct-count estimates** — closed by the footer's length and the magic again.\n\nThree structural consequences. **Self-description**: schema and layout live in the footer; the file needs no external catalog to be read correctly. **Projection at file level**: a reader seeks directly to the chunks of referenced columns (unit 1's proposition realized in one file). **Predicate pushdown at metadata level**: a reader consults footer statistics and skips entire row groups whose min/max exclude the predicate — the zone-map idea, shipped inside the file. Nested data (lists, structs) is encoded columnarly via definition/repetition levels — the Dremel construction — so 'columnar' survives real-world nested schemas."
            },
            {
              "type": "code",
              "heading": "Anatomy of one Trellis Parquet file",
              "lang": "text",
              "code": "orders_2026-08-26.parquet   (~1.3 GB, 40 M rows, 20 columns)\n┌──────────────────────────────────────────────────────────────┐\n│ PAR1                                                         │\n│ Row group 0   rows 0‥9,999,999          (~330 MB encoded)    │\n│   ├─ chunk: order_line_id   [pages…]  stats min=88.0M max=…  │\n│   ├─ chunk: order_ts        [pages…]  stats min=05-01 max=05-24 │\n│   ├─ chunk: product_id      [pages…]  dict, stats d≈10k      │\n│   └─ … 17 more column chunks                                 │\n│ Row group 1   rows 10M‥20M   order_ts 05-24‥06-18  (~330 MB) │\n│ Row group 2   rows 20M‥30M   order_ts 06-18‥07-21  (~330 MB) │\n│ Row group 3   rows 30M‥40M   order_ts 07-21‥08-26  (~330 MB) │\n│ FOOTER: schema (typed), 40,000,000 rows,                     │\n│   per-chunk: {offset, size, encoding, min/max, nulls}        │\n│ footer_len · PAR1                                            │\n└──────────────────────────────────────────────────────────────┘\nRead pattern for SUM(qty·price) WHERE order_ts ≥ 07-01:\n  1 GET footer → prune groups 0–1 by order_ts max → read 4 chunks × 2 groups"
            },
            {
              "type": "example",
              "heading": "Worked example: the Monday query against the file",
              "body": "Price the Monday revenue query, restricted to the last quarter, against the file above — counting both bytes *and requests*, because the object store bills both.\n\n**Step 1 — footer**: one ranged GET of ~2 MB from the file's tail: schema + all chunk statistics.\n\n**Step 2 — prune by statistics**: the predicate `order_ts ≥ 2026-07-01` is compared against each row group's order_ts min/max: groups 0–2 end before or straddle July; suppose groups 0–1 are excluded outright and group 2 partially overlaps (its max exceeds 07-01). Groups 0–1: **skipped without reading a data byte**.\n\n**Step 3 — projected read**: for groups 2–3, read only the four referenced chunks — order_ts, product_id, quantity, unit_price ≈ 50 MB per group encoded (lesson 2's ratios) → **~100 MB in 8 ranged GETs**, decoded at memory speed, with page-level statistics pruning group 2's pre-July pages further.\n\nTotal: ~102 MB and ~10 requests, versus 6.4 GB and a saturated replica in unit 1 — a 60× byte reduction, of which layout gave ~6×, encodings ~4×, and statistics-driven skipping the rest. And note what made step 2 work: the file was written in order_ts order, so time maps to contiguous row groups — the sort-order decision from lesson 2, now visible as *pruning* rather than compression. A file written in random order has every group's min/max spanning the whole quarter, and nothing prunes. Layout decisions compound; this is the same lesson at its third scale."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The object store contract",
              "statement": "A **cloud object store** (S3, GCS, Azure Blob) stores **objects** (byte blobs, KB to TB) under string keys in a flat namespace ('folders' are key prefixes). Its contract, and the design pressure each clause exerts:\n\n**Immutability** — objects are written whole and cannot be appended to or modified in place; 'update' means write-a-new-object. (⇒ files must be written once, complete; mutation must be modeled as new files plus bookkeeping — the lakehouse's founding problem.)\n\n**Durability via replication/erasure coding** across devices and zones (~11 nines annual durability) with high per-request latency (tens of ms) but effectively unbounded aggregate throughput through parallel requests. (⇒ bandwidth is bought with parallelism, not per-stream speed; latency is amortized with *large* reads.)\n\n**Request pricing** — every GET/PUT/LIST costs money and time independent of usefulness; ranged GETs read sub-ranges of an object. (⇒ per-file fixed costs — open, footer, LIST — dominate when files are small: the **small-files problem**.)\n\n**Consistency** — modern stores are strongly consistent for single-key read-after-write; but there are **no multi-object transactions** and no atomic rename of prefixes. (⇒ a multi-file dataset cannot be updated atomically by the store alone — the second founding problem unit 6's table formats solve.)"
            },
            {
              "type": "example",
              "heading": "Worked example: the small-files problem, priced",
              "body": "Trellis's event collector once wrote one Parquet file per minute per source — 3 sources × 1,440 minutes = 4,320 files/day, ~2 MB each, ~8.6 GB/day. Query: scan one day's `event_type` and `event_ts` (say 15% of bytes after projection ≈ 1.3 GB).\n\n**Per-file fixed costs**: 1 LIST page per ~1,000 keys (5 LISTs), then per file: 1 footer GET + 2 chunk GETs = 3 requests × 4,320 = ~12,965 requests. At ~20 ms per request with 32-way parallelism: ~8 s of pure request latency; at $0.0004/1k GETs: pennies per query but *dollars per day* across the team's queries — and the engine burns CPU opening 4,320 footers to plan 4,320 tiny reads.\n\n**Compacted alternative**: a nightly job rewrites the day into 9 files of ~1 GB (one per source per 8-hour window, sorted by event_ts). Same logical scan: 5 + 9×3 = ~32 requests, footer planning is trivial, each ranged GET streams tens of MB (latency amortized), and row-group statistics actually prune (a 2 MB file has one tiny row group; min/max pruning at that granularity saves almost nothing).\n\nThe rule the industry converged on: **target file sizes in the 100 MB–1 GB range, and treat compaction as a standing background duty**, not an optimization. Unit 6 shows Delta and Iceberg building compaction (OPTIMIZE, rewrite actions) into the table layer precisely because ingest naturally produces small files and queries naturally want large ones — the row-binary-in-motion/columnar-at-rest split, at yet another scale."
            },
            {
              "type": "text",
              "heading": "The raw zone, done right",
              "body": "The unit's tools now assemble Trellis's storage layer v1, replacing the overwriting CSV bucket condemned in unit 1. Ingested data lands in an **immutable raw zone** laid out by source and date: `raw/orders/dt=2026-08-27/part-000.avro` — row-binary as it arrived (lesson 1), dated paths so every day is preserved and any day is re-processable, *written once and never modified* (the object store's immutability is now a feature: yesterday cannot be silently edited). A compaction/conversion job then writes the **analytical zone**: `analytics/orders/dt=2026-08-27/part-000.parquet` — large sorted Parquet files per the sizing rule. The `dt=` path convention is **Hive-style partitioning**: the partition key is lifted out of the files into the directory structure, so a query for one week touches seven prefixes and no LIST of the rest — coarse pruning by *path*, complementing Parquet's fine pruning by *footer*. Its sharp edge: partition columns must be low-cardinality (dates, regions — not user_id), or the layout re-creates the small-files problem one directory per key. This two-zone pattern — immutable row-binary raw, compacted columnar analytical — is the storage substrate that units 5 and 6 build systems on top of; when Snowflake hides it behind micro-partitions and Delta exposes it as tables-over-files, you will recognize the same bones."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**The object store is not a database — two clauses in the contract forbid pretending.** No append: you cannot 'add a row' to a Parquet object; ingestion must batch (or stream to a log, unit 8) and write new files. No multi-object atomicity: a job replacing 40 files can die after 17, and readers see a torn dataset with no store-level rollback. Every 'data lake horror story' is one of these two clauses encountered in production. Unit 6's table formats — Delta's transaction log, Iceberg's snapshot metadata — exist to put the missing A(tomicity) back on top; until then, the discipline is: write to new paths, then switch readers over, never edit in place."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Storage is now a solved layer, bottom to top: values encode per lesson 1's axes; columns compress by computable ratios per lesson 2; chunks assemble into Parquet files whose footer statistics let readers skip what the sort order concentrated; and the files live in an object store whose contract — immutable, request-priced, parallel — dictates the file sizes, the compaction duty, and the two-zone raw/analytical layout Trellis now runs. One number summarizes the unit: the Monday query fell from 6.4 GB on the replica to ~100 MB in ~10 requests, every factor of it derived. What storage cannot yet do is *mean* anything: 40 M order lines in beautiful Parquet still answer questions slowly if every query must re-join, re-clean, and re-define 'revenue' from scratch. Unit 3 turns to the modeled layer — dimensional modeling, the design language that makes an analytical schema queryable by humans — before units 4–6 build the engines and platforms that run on everything this unit laid down."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A 2 GB Parquet file has 8 row groups sorted by order_ts (contiguous time ranges) and 20 equal-width columns compressed uniformly. A query references 5 columns with a predicate that overlaps 2 row groups' [min,max] ranges. Estimate bytes read (footer ≈ 2 MB) and the read count, and recompute both if the file had been written in random order.",
                  "solution": "Sorted: footer 2 MB + 2 groups × (5/20 of 250 MB/group) = 2 + 2×62.5 = ~127 MB; requests ≈ 1 (footer) + 10 chunk GETs. Random order: every group's [min,max] spans the predicate → 0 groups prune → 8 × 62.5 = 500 MB + footer, ~41 requests. Projection (5/20) survives either way — it's layout-independent — but statistics pruning is entirely a child of sort order: 4× more I/O from the same file contents in a different row order.",
                  "hint": "Projection depends on columns; pruning depends on whether time maps to contiguous groups."
                },
                {
                  "prompt": "Using the object store contract, explain why Parquet's metadata lives in a *footer* rather than a header, and why that choice interacts with how the file must be written. (Consider: the writer doesn't know chunk offsets/statistics until chunks are written; objects are immutable.)",
                  "solution": "Statistics, sizes, and byte offsets of every chunk are only known *after* the chunks are encoded and written. With a header design, the writer would have to either buffer the whole file in memory before writing, or come back and patch the header — but objects are written whole and are immutable, so in-place patching is impossible. A footer lets the writer stream row groups out as they're encoded, accumulate metadata in memory, and write it last, once, followed by its length — single-pass writing compatible with immutability. Readers pay one ranged GET at the tail (offset known from the trailing length field) — cheap, and the store supports ranged reads precisely for this pattern.",
                  "hint": "When does the writer learn the offsets? What can't it do to an object it already wrote?"
                },
                {
                  "prompt": "An IoT pipeline writes one Parquet file per device per 5 minutes: 2,000 devices → 576,000 files/day, ~80 KB each (~46 GB/day). A daily fleet-health query projects 2 of 16 columns. Price the query's request count as-is, then design the fix and its new request count — naming the two mechanisms your fix exploits.",
                  "solution": "As-is: ~576 LIST pages + 576,000 × (1 footer + 2 chunk GETs) ≈ 1.73 M requests — at 20 ms each even 256-wide parallelism costs ~2.3 minutes of pure request latency, and footer bytes (~1–2 MB metadata read per file min… actually per-file footer ~ tens of KB) rival data bytes. Fix: micro-batch/stream ingest to row-binary, then hourly compaction into ~1 GB Parquet files partitioned by dt= and sorted by (device_id or ts): 24–48 files/day. New query: ~1 LIST + 48 × 3 ≈ 145 requests. Mechanisms: request-cost amortization via large objects (the contract's per-request pricing + latency), and restored statistics pruning/projection efficiency (real row groups instead of 80 KB fragments).",
                  "hint": "Count per-file fixed costs first; then apply the 100 MB–1 GB rule."
                },
                {
                  "prompt": "A teammate partitions the analytical zone as analytics/orders/user_id=<id>/… 'so per-user queries are fast'. Trellis has 4 M users and ~10 order lines/user/quarter. Diagnose with numbers, state the correct use of Hive-style partitioning here, and name where per-user selectivity should come from instead.",
                  "solution": "4 M prefixes × tiny files: ~10 rows/user/quarter means kilobyte-scale files — the small-files problem instantiated by design: full scans must LIST 4 M prefixes and issue millions of GETs; even single-user queries save little (one small file vs one pruned ranged read). Partition keys must be low-cardinality and match dominant coarse filters: dt= (and maybe region=) — dozens to hundreds of prefixes. Per-user selectivity comes from *within-file* structure: sort or cluster files by user_id (or bucket by hash) so Parquet row-group/page min/max statistics prune to the few groups containing that user — fine-grained pruning by footer, not by path.",
                  "hint": "Path pruning is for coarse, low-cardinality dimensions; footers prune the fine grain."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u2l3-i1",
              "front": "Parquet file structure, outside-in",
              "back": "Magic; row groups (~128 MB–1 GB) each holding one column chunk per column (chunks = ~1 MB encoded+compressed pages); footer with typed schema, offsets, and per-chunk min/max/null statistics; footer length; magic."
            },
            {
              "id": "u2l3-i2",
              "front": "The two prunings a well-written Parquet file enables",
              "back": "Projection: read only referenced columns' chunks. Predicate pushdown: skip row groups/pages whose footer min/max exclude the predicate — works only if sort order concentrates values."
            },
            {
              "id": "u2l3-i3",
              "front": "Four clauses of the object store contract that shape analytical design",
              "back": "Immutable objects (no append/edit); durability with high per-request latency but parallel throughput; per-request pricing (small files are poison); no multi-object atomicity (torn multi-file updates)."
            },
            {
              "id": "u2l3-i4",
              "front": "The small-files problem and its standing cure",
              "back": "Per-file fixed costs (LIST, footer GET, planning) dominate when files are small; target 100 MB–1 GB files and run compaction as a permanent background duty."
            },
            {
              "id": "u2l3-i5",
              "front": "Hive-style dt= partitioning: what it does and its sharp edge",
              "back": "Lifts a low-cardinality key into the path so queries prune by prefix before any file is opened; high-cardinality partition keys (user_id) recreate the small-files problem one directory per value."
            },
            {
              "id": "u2l3-i6",
              "front": "Two-zone storage layout (Trellis v1)",
              "back": "Immutable raw zone: row-binary as ingested, dated paths, never modified — reprocessable history. Analytical zone: compacted, sorted, partitioned Parquet for scans."
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
            "prompt": "A `status` column has N = 120 M rows, raw width 12 B, and d = 30 distinct values. Compute the dictionary + bit-packed size in MB (dictionary + index stream; 1 MB = 10⁶ B), rounding to the nearest MB.",
            "answer": 75,
            "tolerance": 1,
            "explanation": "⌈log₂ 30⌉ = 5 bits. Index stream: 120 M × 5/8 B = 75 MB; dictionary: 30 × 12 B = 360 B (negligible). Total ≈ 75 MB versus 1,440 MB raw — the 8w/⌈log₂ d⌉ ≈ 19× ratio, driven by log-cardinality, not width or N.",
            "points": 1
          },
          {
            "id": "u2q2",
            "type": "numeric",
            "prompt": "A 3 GB Parquet file: 10 row groups (equal size), 24 columns of equal compressed width, footer 3 MB, written sorted by event date. A query references 6 columns with a date predicate whose range overlaps 3 row groups. How many MB does an efficient reader fetch, including the footer? (1 GB = 1,000 MB.)",
            "answer": 228,
            "tolerance": 3,
            "explanation": "Footer 3 MB + pruned read: 3 groups × (6/24 × 300 MB/group) = 3 × 75 = 225 MB → 228 MB total, versus 3,003 MB naive. Projection gave 4×, statistics pruning gave 10/3× — both compound, and pruning existed only because the sort order made date ranges contiguous per group.",
            "points": 1
          },
          {
            "id": "u2q3",
            "type": "short",
            "prompt": "Ingestion needs to append records one at a time as they arrive; analytics needs to scan a few columns of billions of rows. Name the format family for each half (one word each, in order: motion, rest).",
            "accept": [
              "avro, parquet",
              "avro parquet",
              "avro; parquet",
              "row-binary, columnar",
              "avro then parquet",
              "row binary, columnar"
            ],
            "explanation": "Row-binary (Avro) in motion — O(record) appends, schema evolution for streams and exports; columnar (Parquet) at rest — projection and pruning for scans. A compaction job converts between them; neither format is 'better', they answer different lifecycle stages.",
            "points": 1
          },
          {
            "id": "u2q4",
            "type": "mcq",
            "prompt": "A pipeline ingests a partner's CSV. One day the partner's export tool starts quoting fields differently and a comma-bearing product name shifts every subsequent field right by one column. The load succeeds; dashboards are wrong for a week. Which format property, had it been present, would have converted this into an immediate loud failure?",
            "options": [
              "An embedded typed schema — misaligned fields would violate declared types (e.g., text in a numeric column) at read time, halting the load",
              "Columnar orientation — storing columns separately would have kept the fields from shifting",
              "General-purpose compression — a zstd-compressed file would have failed its checksum when the layout changed",
              "Larger file sizes — the row groups would have contained enough rows for the anomaly to be statistically detectable"
            ],
            "answer": 0,
            "explanation": "The failure is schema-external ambiguity: nothing declares types or field boundaries, so shifted fields parse as plausible strings. A schema-embedded format (Avro/Parquet) type-checks every value against a declared schema at read time — text landing in a numeric field is an immediate, local, loud error. (b) confuses layout with typing — a columnar file of shifted values would be just as wrong; (c) checksums detect corruption of bytes, not misinterpretation of well-formed bytes; (d) statistical detection is a downstream mitigation, not a format property, and 'larger files' has no bearing.",
            "points": 1
          },
          {
            "id": "u2q5",
            "type": "open",
            "points": 2,
            "prompt": "Design the storage layer for three Trellis sources: (a) the orders export (currently nightly, from unit 1); (b) mobile clickstream events arriving continuously at ~2,000 events/s; (c) a logistics partner's weekly CSV drop of ~50 MB. For each: choose the raw-zone format and path layout, the analytical-zone format and file-sizing/partitioning strategy, and name the specific failure mode your raw-zone choice prevents. Then state the compaction duty the design creates and what triggers it.",
            "rubric": [
              "Raw zone per source: schema-embedded row-binary (Avro or equivalent) for orders and clickstream, with immutable dated paths (dt= or finer for the stream); CSV quarantined/preserved as-received for the partner drop with immediate conversion to a typed format on arrival",
              "Analytical zone: Parquet in the 100 MB–1 GB file range, partitioned by low-cardinality keys (dt=, possibly source), sorted/clustered by the dominant filter column (event/order timestamp) — with the sorting justified by statistics pruning, not asserted",
              "Names concrete prevented failures: silent type/semantic drift caught by schema resolution (orders); unrecoverable history / no reprocessing prevented by immutable dated raw paths; dialect/shift corruption of CSV caught at conversion time rather than in dashboards",
              "Identifies the small-files pressure from the 2,000 events/s stream (per-minute or per-batch files) and specifies compaction: scheduled jobs rewriting recent partitions into target-size sorted files, triggered by schedule and/or file-count/size thresholds per partition",
              "Demonstrates the two-zone principle: raw is append-only history in arrival form (row-binary/CSV-as-received), analytical is derived and rebuildable from raw — direction of derivation stated"
            ],
            "solution": "(a) Orders: raw as Avro at raw/orders/dt=YYYY-MM-DD/part-N.avro — schema-embedded so the next discount-style semantic change halts the load at reader/writer resolution instead of corrupting revenue; paths are dated and immutable, so any day can be reprocessed. Analytical: analytics/orders/dt=…/ Parquet, files ~256 MB–1 GB, sorted by order_ts within files so row-group min/max prune date-ranged queries; partition key is dt= only (low cardinality). (b) Clickstream: raw as Avro micro-batches (e.g., raw/events/dt=…/hh=…/part-*.avro, one file per source per few minutes) — the stream cannot write Parquet directly (columnar formats cannot append; 200-row Parquet files are all overhead). This produces small files by construction, creating the compaction duty: an hourly job rewrites the previous hour into ~1 GB Parquet sorted by event_ts (optionally clustered by user for per-user pruning), partitioned by dt=; triggered on schedule plus a threshold (e.g., >500 files or >2 GB pending in a partition). (c) Partner CSV: preserve the file exactly as received at raw/partner_x/dt=…/original.csv (auditability — you may need to prove what they sent), and convert immediately on arrival to typed Parquet in the analytical zone; the conversion is where quoting/shift/dialect corruption fails loudly, quarantining the bad file instead of publishing it. Cross-cutting: raw zones are append-only history in arrival form; the analytical zone is entirely derivable from raw, so any bug in conversion or compaction is repairable by replay — the property v0 lacked.",
            "explanation": "The unit's synthesis: format-by-lifecycle-stage (row-binary/CSV at the edge, Parquet at rest), the object-store contract driving file sizing and compaction, immutable dated raw zones as the reprocessing insurance, and loud-failure conversion points guarding semantics."
          },
          {
            "id": "u2q6",
            "type": "proof",
            "points": 2,
            "prompt": "Prove the dictionary + bit-packing bound: a column of N values, w bytes each, with d distinct values, stores in S = d·w + N·⌈log₂ d⌉/8 bytes, with ratio approaching 8w/⌈log₂ d⌉ as N/d grows. Then establish the two boundary claims: (i) the encoding is counterproductive when d ≈ N; (ii) if the column is sorted by its own values, RLE over the index stream reduces the index cost from O(N) to O(d).",
            "rubric": [
              "Derives both terms of S: dictionary stores each distinct value once (d·w) and each of N occurrences becomes an index; justifies ⌈log₂ d⌉ bits as the minimum needed to distinguish d values",
              "Computes the ratio N·w/S and takes the limit correctly, showing the dictionary term vanishes relative to the index stream as N/d → ∞, yielding 8w/⌈log₂ d⌉",
              "Boundary (i): substitutes d ≈ N to show S ≥ N·w (dictionary alone equals raw) plus index overhead, hence worse than raw storage",
              "Boundary (ii): argues sorted-by-value ⇒ equal values adjacent ⇒ exactly d maximal runs ⇒ RLE stores d (value,length) pairs, i.e., O(d) index bytes replacing N·⌈log₂ d⌉/8"
            ],
            "solution": "Dictionary term: each of the d distinct values is written once at its raw width — d·w bytes. Index term: each of the N cells is replaced by a reference into the dictionary; distinguishing d targets requires at least ⌈log₂ d⌉ bits per reference (b bits address only 2^b targets), and bit-packing achieves exactly that, so the stream is N·⌈log₂ d⌉ bits = N·⌈log₂ d⌉/8 bytes. Hence S = d·w + N·⌈log₂ d⌉/8. Ratio: N·w/S = N·w / (d·w + N·⌈log₂ d⌉/8); dividing numerator and denominator by N, the d·w/N term → 0 as N/d → ∞, leaving 8w/⌈log₂ d⌉. (i) With d ≈ N: S ≈ N·w + N·⌈log₂ N⌉/8 > N·w — the dictionary alone reproduces the raw column and the index stream is pure overhead; the encoding strictly loses. (ii) Sorted by value, all occurrences of each distinct value are contiguous, so the index stream consists of exactly d maximal runs; RLE represents each run as one (code, length) pair — d·(⌈log₂ d⌉/8 + ℓ) bytes for run-length field size ℓ — which is O(d) and independent of N, so for d ≪ N the index cost collapses and S is dominated by the one-time dictionary. ∎",
            "explanation": "The unit's central computation, with its two edges: cardinality decides whether dictionary encoding pays at all, and physical sort order decides whether RLE can collapse the index stream — the same statistics-driven reasoning that priced every storage decision in this unit."
          }
        ]
      }
    },
    {
      "id": "u3",
      "title": "Dimensional Modeling",
      "summary": "Grain, facts, and dimensions; the star schema; slowly changing dimensions; conformed dimensions and the warehouse bus — the design language of the modeled layer.",
      "intro": "Units 1 and 2 built the physical substrate: analytics lives in its own system, in columnar files whose scan cost we can compute. But physics is not meaning. Trellis's Parquet files still mirror the register's schema — twenty operational columns, coded statuses, JSON address blobs — and every analyst question still begins with the same forensic joins. This unit builds the **modeled layer**: the schema design discipline, due to Ralph Kimball, that turns operational exhaust into structures a human can query without archaeology. Its lessons proceed from the atom outward. First, the grain declaration and the fact/dimension split — the two decisions that determine whether a model is correct at all. Second, the star schema and the query pattern it exists to serve, including why the columnar storage of unit 2 quietly demolished the classic argument for normalizing dimensions. Third, time: slowly changing dimensions, the machinery that keeps history honest when the world the dimensions describe changes underneath it. Fourth, scale-out: conformed dimensions and the warehouse bus, semi-additive facts, and an honest verdict on the One Big Table debate. The gate asks you to design: given a business process, declare the grain, draw the star, and defend every choice.",
      "references": [
        "Ralph Kimball & Margy Ross — The Data Warehouse Toolkit, 3rd ed., chs. 1–5 (retail case, SCDs, the bus architecture)",
        "Joe Reis & Matt Housley — Fundamentals of Data Engineering, ch. 8 (modeling for analytics)",
        "Martin Kleppmann — Designing Data-Intensive Applications, ch. 3 (stars and snowflakes in context)"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u3l1",
          "title": "Grain, Facts, and Dimensions",
          "estMinutes": 28,
          "builds_on": [
            "u1l3",
            "u2l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Why the operational schema cannot be the analytical schema",
              "body": "The register's schema is normalized — third normal form, one fact in one place — because that is correct for OLTP: an address update touches one row, and no anomaly can creep in. But hand that schema to an analyst and watch the Monday query grow: `order_lines` joins `orders` joins `customers` joins `addresses` joins `products` joins `product_categories` joins `promotions` — seven tables before the first aggregate, and a different seven for every question. Normalization optimizes for *non-redundant writes*; analysis needs *predictable reads*. The deeper failure is semantic: nothing in the normalized schema says what a row *means* to the business, which numbers may be summed, or which columns are for filtering versus measuring. Analysts answer those questions by folklore, and their folklores disagree — that is how two dashboards report different revenue.\n\nDimensional modeling is the fix, and it begins with a discipline so simple it looks bureaucratic: before designing any table, answer four questions in order — Kimball's four steps. **(1)** Which business *process* is being measured? (Orders? Shipments? Page views? One process per fact table.) **(2)** What is the **grain** — precisely what one row represents? **(3)** What are the **dimensions** — the descriptive contexts by which the process is sliced? **(4)** What are the **facts** — the numeric measurements of the process? Every modeling failure you will meet in practice is a violation of the *order* of these steps: dimensions chosen before the grain is declared, facts mixed across processes, grains blended in one table. The rest of this lesson makes each term exact."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Grain, fact, dimension",
              "statement": "The **grain** of a fact table is the precise statement of what one row represents — ideally in the vocabulary of the physical event: *one order line*, *one scanned boarding pass*, *one daily snapshot of one SKU in one warehouse*. Every other design decision is downstream of the grain, and every row must be at exactly that grain.\n\nA **fact** (measure) is a numeric measurement generated by the business process, stored in the fact table at the declared grain. Facts classify by summability: **additive** facts may be summed across *all* dimensions (revenue, quantity); **semi-additive** facts sum across some dimensions but not others (an account balance or inventory level sums across products, never across time); **non-additive** facts sum across nothing (a ratio, a unit price, a percentage — store the additive components instead and compute the ratio at query time).\n\nA **dimension** is a table of descriptive context — who, what, where, when, how — joined to the fact by key: customers, products, dates, promotions, channels. Dimension attributes are the *by* words of every business question ('revenue **by category** **by month** for **returning customers**') and are overwhelmingly used to filter and group, not to measure."
            },
            {
              "type": "example",
              "heading": "Worked example: declaring Trellis's first fact table",
              "body": "Run the four steps on Trellis's core process.\n\n**Process**: order placement (not shipment, not payment — those are separate processes with their own facts later).\n\n**Grain**: *one row per product per order* — the order line. Not one row per order: that would force quantities and product references into arrays or force the model to pre-aggregate away the product dimension. The most useful grain is almost always the **atomic** one — the finest grain the source system records — because it can answer questions at any coarser rollup, while a pre-aggregated grain forecloses every finer question permanently.\n\n**Dimensions**: date (of order), customer, product, promotion, channel. The test for 'is X a dimension?': would a human filter or group by it? ('Revenue by *channel*' — yes.)\n\n**Facts**: quantity (additive), gross_amount (additive), discount_amount (additive), net_amount (additive) — and *not* unit_price, which is non-additive; it is derivable as gross_amount/quantity, and storing it as a fact invites analysts to SUM it into nonsense. Unit price's proper home is the product dimension (list price) or derivation at query time.\n\nThe resulting declaration reads: `fact_order_line — grain: one row per product per order; ~40 M rows/2 yr; FKs: date_key, customer_key, product_key, promo_key, channel_key; measures: quantity, gross_amount, discount_amount, net_amount.` One sentence of grain, five keys, four additive measures — this sentence is the model. Everything in the next three lessons is elaboration of it."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Mixed grain forces double counting",
              "statement": "Suppose a fact table contains rows at grain g (e.g., order lines) and also rows at a strictly coarser grain G (e.g., order totals), sharing one measure column, where each coarse row's measure equals the sum of its fine rows' measures. Then for any slice S that includes a coarse row and its fine rows, SUM(measure) over S equals **twice** the true total of the fine rows — and no WHERE clause phrased purely over dimension attributes shared by both grains can repair every such query.",
              "proof": "Let a coarse row c cover fine rows f₁ … f_k with measure(c) = Σᵢ measure(fᵢ) by hypothesis. Any additive query over a slice containing both computes Σᵢ measure(fᵢ) + measure(c) = 2·Σᵢ measure(fᵢ). The error is systematic, not random: every covered subtotal is counted exactly twice.\n\nFor the second claim: c and its fᵢ agree on every dimension attribute defined at or above grain G (same order, hence same date, customer, channel, promotion). A predicate over those shared attributes therefore either admits all of {c, f₁…f_k} or none — it cannot separate the grains. Separation requires a grain-discriminator column (e.g., row_type), i.e., an admission that the table holds two logical tables — at which point every query forever carries the guard `WHERE row_type = …`, and the first analyst who forgets it publishes a doubled number. Hence the design rule: **one fact table, one grain**; coarser rollups live in separate (aggregate) tables. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: choosing a grain when the event is fuzzy",
              "body": "Grain declaration is easy for orders; practice on a fuzzier process. Trellis wants to analyze **cart abandonment**. What is the grain?\n\nCandidate A — *one row per cart*: natural, but a cart evolves (items added, removed) and has no single timestamp; facts like 'items_count' become moving targets, and the row must be updated in place as the cart changes — a mutable fact table, which poisons unit 7's incremental loading.\n\nCandidate B — *one row per cart item event* (item added / removed / cart submitted / cart expired, one row per occurrence): atomic, immutable, timestamped — each event happened once and is forever true. Abandonment becomes a *query* (carts whose last event is expiry with items > 0), not a stored, restated fact.\n\nCandidate B is right, and the reasoning generalizes into the course's modeling habit: **model events, not states — states are queries over events**. When a stakeholder asks for a 'cart table', they are asking for a *serving view* (unit 9), which the event-grain fact can always produce; the reverse derivation — recovering events from a state snapshot — is impossible. The same move will reappear at the storage layer in unit 6 (immutable logs, tables as views over them) and in unit 8 (change data capture): immutable-event grain is the modeling face of an idea this course meets three times."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**The grain test for every proposed column.** Before adding any column to a fact table, ask: *is this defined at exactly the declared grain?* 'Order shipping fee' is defined per order, not per order line — storing it on each line either replicates it (summing double-counts it, the proposition in miniature) or forces arbitrary allocation. The disciplined options: allocate it explicitly across lines by a stated rule (Kimball's recommendation when the business accepts one), or model it in a separate order-grain fact table. What is forbidden is quietly parking it at the wrong grain and hoping analysts remember."
            },
            {
              "type": "text",
              "heading": "Facts are narrow and long; dimensions are wide and short",
              "body": "Notice the shape the four steps produce, because units 4–6 exploit it physically. The fact table is **narrow and long**: five integer keys and four numerics — under 60 bytes — but 40 million rows and growing by every order forever. Dimensions are **wide and short**: dim_product carries fifty descriptive attributes (name, category, subcategory, supplier, pot size, care level, price band…) across only 10,000 rows; dim_customer a few dozen attributes across 4 million; dim_date perhaps thirty attributes (day of week, fiscal period, holiday flag) across a few thousand.\n\nThis asymmetry is the model meeting unit 2's storage math head-on. The long fact table is exactly what columnar scans, integer dictionary encodings, and date-sorted row-group pruning were built for; its foreign-key columns have low-to-moderate cardinality and compress by the proposition of unit 2. The wide dimensions are small enough to sit in memory during query execution — which is what makes the star join strategy of the next lesson (and the broadcast joins of unit 4) work at all. Dimensional modeling predates columnar warehouses by two decades, but the two designs fit as if co-designed: the model concentrates bulk in a table whose access pattern is scan-and-aggregate, and description in tables whose access pattern is filter-and-lookup. That fit — not tradition — is why the star schema survived every platform shift from mainframe to Snowflake."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The modeled layer now has its atoms. A fact table is a declared grain — one sentence, stated before any column — carrying additive measures at that grain and foreign keys into wide, descriptive dimensions; mixed grains are provably broken, atomic grains dominate pre-aggregated ones, and event grains dominate state grains. Trellis has its declaration: `fact_order_line` with five dimensions and four additive measures. What we have not yet done is assemble these atoms into a queryable whole — the star schema — nor confronted the classic objection that denormalized dimensions 'waste space' (unit 2 already handed us the rebuttal), nor decided what the keys connecting fact to dimension should physically be. That assembly is the next lesson."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Run Kimball's four steps for a gym chain that wants to analyze member check-ins (member badges in at a club; the scanner records member, club, timestamp). State process, grain, dimensions, and facts — and defend the odd thing about the facts.",
                  "solution": "Process: member check-in. Grain: one row per badge scan (one member, one club, one timestamp). Dimensions: date, time-of-day, member, club (and perhaps membership-tier as a member attribute, not its own dimension). Facts: none beyond an implicit count — this is a **factless fact table**: the event's only measurement is that it occurred; COUNT(*) at the declared grain answers every utilization question ('check-ins by club by hour by tier'). Adding a fake measure (e.g., visit_count = 1) is a harmless convention, but the design insight is that events with no numeric measurement still deserve fact tables.",
                  "hint": "What number does a badge scan generate? What does COUNT(*) already give you?"
                },
                {
                  "prompt": "Classify each proposed fact as additive, semi-additive, or non-additive, and state the correct storage decision: (a) net_amount on fact_order_line; (b) margin_pct on fact_order_line; (c) on_hand_units on a daily inventory snapshot; (d) days_to_ship on a shipment fact.",
                  "solution": "(a) Additive — sums across all dimensions; store as-is. (b) Non-additive — a ratio; SUM(margin_pct) is meaningless. Store the additive components (net_amount, cost_amount) and compute margin at query time as SUM(net−cost)/SUM(net). (c) Semi-additive — sums across products and warehouses at one instant, but summing across days yields 'unit-days'; store it, but temporal rollups must use AVG/MIN/MAX/LAST (unit 3's fourth lesson formalizes this). (d) Additive with care — it sums (to enable AVG via SUM/COUNT) but the sum alone is rarely reported; storing it is correct because it is defined at the shipment grain and averages/percentiles derive from it.",
                  "hint": "Ask of each: summed over which dimensions does this stay meaningful?"
                },
                {
                  "prompt": "A vendor delivers a 'sales fact table' where most rows are order lines but month-end rows contain per-store daily summaries 'for dashboard speed'. Using the mixed-grain proposition, state exactly what SUM(revenue) by month returns, and give the two remediations consistent with 'one fact table, one grain'.",
                  "solution": "For any month-store slice containing both the lines and their summary rows, SUM(revenue) returns twice the true revenue (each line counted in itself and in its summary). No dimension-attribute filter can separate them, since summaries share date/store attributes with their lines. Remediations: (1) split into two tables — fact_sales_line at order-line grain and a separate aggregate table agg_sales_store_day, with dashboards pointed at the aggregate; (2) if forced into one physical table, add an explicit grain-discriminator and rebuild all consumer queries to guard on it — strictly worse, because correctness now depends on every future query remembering the guard.",
                  "hint": "Apply the proposition: what does each covered subtotal contribute?"
                },
                {
                  "prompt": "Trellis's product team asks for a 'subscription status fact table: one row per subscription with its current status, updated nightly'. Using the events-not-states principle, redesign it: give the event-grain fact you would build instead, and show how 'current status' and 'churn rate by cohort by month' are both queries over it.",
                  "solution": "Build fact_subscription_event: one row per status transition (created, paused, resumed, upgraded, canceled), with date, customer, plan dimensions, immutable and timestamped. Current status = each subscription's latest event (window: last value of event_type per subscription_id) — a serving view refreshed as needed. Churn by cohort by month = count of 'canceled' events per month joined to each subscription's first 'created' event month (the cohort), divided by cohort size — impossible to compute from a current-status snapshot (history is overwritten nightly), trivial from events. The state table the product team asked for is delivered — but as a downstream view, not as the stored model.",
                  "hint": "Transitions are events; 'current' is the last event; cohorts need the first event."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u3l1-i1",
              "front": "Kimball's four design steps, in order",
              "back": "1. Select the business process; 2. Declare the grain; 3. Identify the dimensions; 4. Identify the facts. Order matters — grain before columns, always."
            },
            {
              "id": "u3l1-i2",
              "front": "Additive vs semi-additive vs non-additive facts",
              "back": "Additive: sums across all dimensions (revenue). Semi-additive: sums across some, not time (balances, inventory levels). Non-additive: sums across nothing (ratios, unit prices) — store components, derive at query time."
            },
            {
              "id": "u3l1-i3",
              "front": "Why declare the atomic grain rather than a pre-aggregated one?",
              "back": "Atomic grain answers every coarser question by rollup; a pre-aggregated grain forecloses finer questions permanently. Aggregates belong in separate downstream tables."
            },
            {
              "id": "u3l1-i4",
              "front": "What goes wrong in a mixed-grain fact table?",
              "back": "Coarse rows equal the sum of their fine rows, so additive queries count covered subtotals exactly twice — and shared dimension attributes can't filter the grains apart. One fact table, one grain."
            },
            {
              "id": "u3l1-i5",
              "front": "'Model events, not states' — the principle and its payoff",
              "back": "Store immutable, timestamped occurrences (grain = one event); states (current status, cart contents) are queries/views over events. Events reconstruct any state; snapshots can't reconstruct events."
            },
            {
              "id": "u3l1-i6",
              "front": "Characteristic shapes: fact table vs dimension table",
              "back": "Fact: narrow and long (few keys + measures, millions-billions of rows) — built for columnar scans. Dimension: wide and short (dozens of attributes, thousands-millions of rows) — fits in memory for joins."
            }
          ]
        },
        {
          "id": "u3l2",
          "title": "The Star Schema and Its Queries",
          "estMinutes": 27,
          "builds_on": [
            "u3l1",
            "u2l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Assembling the star",
              "body": "*Grain, Facts, and Dimensions* produced parts — a declared fact table and five dimensions — and left three assembly questions open: how the parts connect, what the connecting keys should be, and whether the wide, deliberately redundant dimensions are an extravagance. The answers form the **star schema**, the standard shape of the modeled layer: the fact table at the center, one join away from every dimension, each dimension **denormalized flat** — category and subcategory and supplier name all as plain columns of dim_product, not as satellite tables. The name is literal: draw it and you get a star. What the shape buys is *predictability*. Every analytical question compiles to the same query pattern (filter some dimensions, join to the fact, group by dimension attributes, aggregate measures), every join is fact-to-dimension on a single key, and no question requires discovering a join path — the property the normalized register schema lacked, and the property BI tools depend on to generate SQL mechanically."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Star schema, snowflake schema, surrogate key",
              "statement": "A **star schema** is a fact table at declared grain whose foreign keys reference **denormalized** dimension tables: each dimension is one flat table containing all its attributes, including hierarchies flattened into columns (category, subcategory as sibling columns). A **snowflake schema** normalizes the dimensions instead — dim_product references dim_subcategory references dim_category — trading wider joins for non-redundant dimension storage.\n\nA **surrogate key** is a meaningless integer, assigned by the warehouse, that identifies one row of one dimension version; fact tables reference dimensions *only* by surrogate key. The operational identifier (SKU, customer number) is retained in the dimension as the **natural key**, an ordinary attribute. Surrogates exist for three reasons: independence (natural keys get recycled, reformatted, or collide across source systems and company mergers), performance (a 4-byte integer join column, dictionary-encoded per unit 2, beats a 24-character SKU), and — decisively, next lesson — **versioning**: slowly changing dimensions require multiple rows per natural key, which only a warehouse-assigned key can distinguish."
            },
            {
              "type": "diagram",
              "kind": "graph",
              "directed": false,
              "height": 320,
              "caption": "Trellis's first star: fact_order_line at the atomic grain, one join from each denormalized dimension. Narrow-and-long center, wide-and-short points.",
              "nodes": [
                {
                  "id": "fact",
                  "label": "fact_order_line",
                  "sub": "40M rows · 5 FKs · 4 measures",
                  "x": 50,
                  "y": 50,
                  "r": 16,
                  "tone": "gold"
                },
                {
                  "id": "date",
                  "label": "dim_date",
                  "sub": "3,650 rows · 30 attrs",
                  "x": 50,
                  "y": 8
                },
                {
                  "id": "product",
                  "label": "dim_product",
                  "sub": "10k rows · 50 attrs",
                  "x": 92,
                  "y": 35
                },
                {
                  "id": "customer",
                  "label": "dim_customer",
                  "sub": "4M rows · 40 attrs",
                  "x": 82,
                  "y": 88
                },
                {
                  "id": "promo",
                  "label": "dim_promotion",
                  "sub": "600 rows · 15 attrs",
                  "x": 18,
                  "y": 88
                },
                {
                  "id": "channel",
                  "label": "dim_channel",
                  "sub": "3 rows · 5 attrs",
                  "x": 8,
                  "y": 35
                }
              ],
              "edges": [
                {
                  "from": "date",
                  "to": "fact",
                  "label": "date_key"
                },
                {
                  "from": "product",
                  "to": "fact",
                  "label": "product_key"
                },
                {
                  "from": "customer",
                  "to": "fact",
                  "label": "customer_key"
                },
                {
                  "from": "promo",
                  "to": "fact",
                  "label": "promo_key"
                },
                {
                  "from": "channel",
                  "to": "fact",
                  "label": "channel_key"
                }
              ]
            },
            {
              "type": "example",
              "heading": "Worked example: the Monday query, in its final form",
              "body": "The Monday question — weekly revenue by category, new vs returning, last quarter — has chased us since unit 1. Against the star it is, at last, a straightforward composition of the standard pattern:\n\n`SELECT d.fiscal_week, p.category, c.customer_type, SUM(f.net_amount) AS revenue`\n`FROM fact_order_line f`\n`JOIN dim_date d ON f.date_key = d.date_key`\n`JOIN dim_product p ON f.product_key = p.product_key`\n`JOIN dim_customer c ON f.customer_key = c.customer_key`\n`WHERE d.date >= '2026-06-01' GROUP BY 1, 2, 3;`\n\nRead it as the pattern: filter one dimension (date), group by attributes of three, sum one additive measure. Every business question against this star is this query with different attribute names — which is precisely what lets a BI tool build it from a drag-and-drop, and lets an analyst who has never seen Trellis's source systems write it in their first hour. Now read it *physically*, with units 1–2: the engine scans four columns of the fact (three 4-byte keys + one 8-byte measure ≈ 20 of ~60 bytes — projection), prunes row groups by date via the date-sorted layout (statistics), and joins each surviving row to three dimensions small enough to sit in memory. The model's narrow-long/wide-short asymmetry is what makes each physical step cheap; unit 4 walks the execution in full."
            },
            {
              "type": "text",
              "heading": "Star versus snowflake: an argument unit 2 already settled",
              "body": "The classical case for snowflaking was storage: repeating 'Succulents' as a category string on all 900 products in the category (and 'returning' on two million customer rows) violates every normalization instinct, and on 1990s disks the redundancy cost real money. The classical rebuttal was usability and joins: a snowflaked product dimension turns every category query into a three-table chain, multiplies the join paths BI tools must know, and saves space only in the *small* tables — the dimensions — while the fact table, which dominates storage, is identical either way.\n\nUnit 2 ended the argument. In columnar storage, a repeated low-cardinality string column is precisely the best case of the dictionary + bit-packing proposition: `category` with d = 40 across 10,000 product rows stores the 40 strings once plus 6-bit indices — the normalization is performed *by the encoder*, invisibly, without costing anyone a join. The storage argument for snowflaking is therefore dead at the physical layer; what survives are niche cases — a huge dimension with a frequently updated attribute cluster, or an outrigger shared by several dimensions — and the default is firmly the flat star. This is worth internalizing as a pattern, not just a verdict: **physical-layer advances change which logical designs are affordable**. Kimball's denormalized star was a considered trade-off against 1996 storage; on 2026 storage it is simply free."
            },
            {
              "type": "example",
              "heading": "Worked example: building dim_date, the dimension you generate",
              "body": "One dimension in every warehouse is special: **dim_date** is generated, not extracted — a script emits one row per calendar day for, say, 2015–2035 (~7,300 rows), with the date's every useful description precomputed as columns: day_of_week, week_start, fiscal_week, fiscal_quarter, month_name, is_weekend, is_holiday (per business calendar), days_to_holiday, promo_season. Two design points carry over to all dimensions.\n\n**First**: attributes exist so queries don't compute. 'Revenue by fiscal week' must not require every analyst to re-derive Trellis's fiscal calendar (which starts weeks on Wednesday, because subscription boxes ship Tuesdays) in SQL date arithmetic — the derivation happens once, in the dimension build, and disagreement becomes impossible. A dimension is *institutionalized vocabulary*: the place where the business's words get exactly one definition each.\n\n**Second**: the date key is conventionally a readable integer, 20260827 — the one sanctioned exception to meaningless surrogates, defensible because calendar dates are the one entity that never changes identity or attributes retroactively (a Tuesday never becomes a Wednesday). Every other dimension keeps strictly meaningless keys, and the next lesson shows exactly why: the day dim_customer needs a second row for the same customer, any meaning embedded in the key becomes a bug."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**The fact table stores keys and measures — nothing else.** Every descriptive string belongs in a dimension, even when it feels small ('just put channel = web/app/marketplace on the fact'). The discipline pays three ways: the fact stays narrow (unit 1's scan arithmetic), attributes acquire a single home where corrections and additions happen once, and the model stays navigable — an analyst finds every 'by X' in a dimension, never buried in the fact. The one legitimate exception is the **degenerate dimension**: an operational identifier with no attributes of its own (order_number, tracking_number) rides along in the fact table for drill-down and reconciliation, a dimension key with no dimension table."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The star is assembled: a narrow atomic-grain fact joined by warehouse-assigned surrogate integers to flat, wide, deliberately redundant dimensions — redundancy the columnar encoder normalizes away for free — with dim_date generated as the warehouse's calendar vocabulary and every query an instance of one filter-join-group-aggregate pattern. Trellis's analysts now write the Monday query in four lines against tables whose names mean things. But the model as built has a frozen-world assumption baked in: it describes customers and products *as they are now*. Customers move; products get recategorized; and the first time merchandising renames a category, every historical report silently changes. Keeping the past honest while the present changes is the slowly-changing-dimension problem — the next lesson, and the reason surrogate keys were non-negotiable."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Write the star-pattern SQL for: 'average discount rate by promo_season by channel, 2026 to date, marketplace channel excluded'. Use the Trellis star; recall from lesson 1 which facts are additive and how ratios must be computed.",
                  "solution": "SELECT d.promo_season, ch.channel_name, SUM(f.discount_amount)/SUM(f.gross_amount) AS discount_rate FROM fact_order_line f JOIN dim_date d ON f.date_key = d.date_key JOIN dim_channel ch ON f.channel_key = ch.channel_key WHERE d.date >= '2026-01-01' AND ch.channel_name <> 'marketplace' GROUP BY 1, 2; — the rate is a non-additive ratio, so it is computed from the two additive components *after* aggregation (SUM/SUM), never AVG(f.discount_amount/f.gross_amount), which weights every order line equally regardless of size.",
                  "hint": "Ratio of sums, not average of ratios."
                },
                {
                  "prompt": "A 30 M-row fact has product_key (4 B, d = 10,000). A snowflake advocate says the flat dim_product 'wastes storage repeating category strings'. Compute what flattening actually costs in columnar storage: category (avg 12 B, d = 40) as a column of dim_product (10,000 rows) — and compare with the cost of snowflaking's extra join on every category query. What does the comparison show?",
                  "solution": "Flat: category on dim_product = 10,000 values, d = 40 → dictionary 40×12 B + 10,000×6 bits ≈ 480 B + 7.5 KB ≈ 8 KB. (Even flattened *onto the fact* it would be 30 M × 6 bits ≈ 22.5 MB — trivial beside the fact's measures.) Snowflake: saves ≤ 8 KB, and prices every category query with an extra join (plus a join path every tool must know). The comparison shows the storage stake is four to seven orders of magnitude below anything that matters — the dictionary encoder already 'normalized' the strings — so the decision rests entirely on query simplicity, which the star wins.",
                  "hint": "Apply unit 2's dictionary bound to the repeated strings; then ask what the snowflake saved."
                },
                {
                  "prompt": "For each, decide: dimension attribute, fact measure, or degenerate dimension — and name the table it lands in: (a) order_number; (b) customer's loyalty tier; (c) shipping_weight_g of the ordered product; (d) items_in_order at time of purchase; (e) supplier_name.",
                  "solution": "(a) Degenerate dimension — an identifier with no attributes; lives in fact_order_line as a plain column for drill-down/reconciliation. (b) Dimension attribute — dim_customer (and it *changes*, foreshadowing SCDs). (c) Dimension attribute — dim_product; it describes the product, not the order event (if actual shipped weight per line differed — partial shipments — a shipment fact would measure it). (d) Fact-adjacent trap: it is order-grain, not line-grain — storing it on each line replicates it (mixed-grain hazard); either derive at query time (COUNT lines per order_number) or model an order-grain fact. (e) Dimension attribute — flattened into dim_product in a star (not a snowflaked dim_supplier), unless supplier has many attributes and its own analyses.",
                  "hint": "Ask: does it describe context, measure the event, or merely identify?"
                },
                {
                  "prompt": "Trellis acquires a rival, PetalBox, whose SKUs overlap Trellis's ('P-1001' means different products in each). Explain how surrogate keys make the merged dim_product routine, and what would have broken had fact tables referenced products by natural key.",
                  "solution": "With surrogates: load PetalBox products as new dim_product rows with fresh surrogate keys; natural key becomes a compound attribute (source_system, source_sku) — 'P-1001' appears twice, distinguished by source, and neither company's fact rows change meaning; conformed reporting starts immediately. With natural-key FKs: both companies' fact rows reference 'P-1001' and become indistinguishable — historical facts silently point at the wrong products, and the repair requires rewriting fact history (rekeying billions of rows) under deadline. The surrogate layer is exactly the indirection that isolates the warehouse from source-system identity politics — the 'independence' clause of the definition, demonstrated.",
                  "hint": "Who assigns the key, and what happens when two sources disagree about identity?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u3l2-i1",
              "front": "Star schema — the shape and what it buys",
              "back": "Atomic-grain fact centered one join from flat denormalized dimensions. Buys predictability: every question = filter dims → join fact → group by attributes → aggregate measures; no join-path discovery."
            },
            {
              "id": "u3l2-i2",
              "front": "Surrogate keys: the three reasons facts reference dimensions by them",
              "back": "Independence from source-system identities (mergers, recycled keys); performance (small dictionary-friendly integers); versioning — SCDs need multiple rows per natural key."
            },
            {
              "id": "u3l2-i3",
              "front": "Why did columnar storage kill the snowflake schema's storage argument?",
              "back": "Repeated low-cardinality dimension strings are dictionary-encoded to indices automatically — the encoder performs the normalization without the joins. Flat stars are free at the physical layer."
            },
            {
              "id": "u3l2-i4",
              "front": "dim_date — why generated, and its two lessons for all dimensions",
              "back": "Emitted by script (one row/day, precomputed calendar attributes). Lessons: attributes exist so queries don't re-derive vocabulary (one definition of 'fiscal week'); its readable key 20260827 is the one exception to meaningless surrogates."
            },
            {
              "id": "u3l2-i5",
              "front": "Degenerate dimension",
              "back": "An operational identifier with no attributes (order_number): stored in the fact table as a bare column for drill-down and reconciliation — a dimension key with no dimension table."
            },
            {
              "id": "u3l2-i6",
              "front": "How to compute a ratio (e.g., discount rate) against a star",
              "back": "Aggregate the additive components first, then divide: SUM(discount)/SUM(gross). Never average per-row ratios — it ignores line size and is non-additive."
            }
          ]
        },
        {
          "id": "u3l3",
          "title": "Slowly Changing Dimensions",
          "estMinutes": 28,
          "builds_on": [
            "u3l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The frozen-world bug",
              "body": "*The Star Schema and Its Queries* shipped a model with a silent assumption: that dimensions describe an unchanging world. They do not. Customer 4417 — call her Mara — moves from Provo to Denver in March. Merchandising renames 'Cacti & Succulents' to two separate categories in June. A supplier is replaced in September. Each is a routine **dimension change**, and each puts the model to a choice it cannot dodge, because a report grouped 'by region' or 'by category' must now decide: does Mara's *January* order count under Provo (true when it happened) or Denver (true now)?\n\nBoth answers are legitimate for different questions — 'what did Mountain-region customers buy last winter?' wants history as it was; 'what is the lifetime value of my current Denver customers?' wants history restated under current descriptions. The failure mode is not choosing wrongly; it is *not choosing* — letting the answer be whatever the load script happens to do, which is how a February revenue-by-region report changes retroactively in March and nobody can say why. **Slowly changing dimensions (SCDs)** are Kimball's taxonomy of the deliberate answers. Two matter constantly (Types 1 and 2); one occasionally (Type 3); and Type 2 is the reason surrogate keys were installed in the previous lesson."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "SCD Types 1, 2, and 3",
              "statement": "Let a dimension attribute change value for one natural key (Mara: city Provo → Denver).\n\n**Type 1 — overwrite**: update the attribute in place on the existing dimension row. One row per natural key, always current. History is *restated*: every past fact now joins to the new value; the old value is unrecoverable from the warehouse.\n\n**Type 2 — add a versioned row**: close the current row (set effective_to = change date, is_current = false) and insert a new row with a **new surrogate key**, the new attribute value, effective_from = change date, is_current = true. Facts recorded before the change keep the old surrogate key; facts after reference the new one. History is *preserved as it was*; the dimension holds one row per natural key **per version**.\n\n**Type 3 — add a column**: store previous_value alongside current_value on the one row (e.g., previous_category), typically for planned reorganizations where 'compare under old vs new mapping' is itself the analysis. Tracks exactly one prior state — no full history.\n\nThe choice is **per attribute**, not per table: dim_customer may treat email Type 1 (corrections, no analytical meaning) and city/tier Type 2 (analysis groups by them)."
            },
            {
              "type": "example",
              "heading": "Worked example: Mara's move under Type 1 and Type 2",
              "body": "Concrete rows. Before March, dim_customer holds: `(customer_key 812, natural_key C-4417, name Mara, city Provo, region Mountain, is_current true)`. Her January order line in the fact: `(date_key 20260114, customer_key 812, …, net_amount 62.00)`.\n\n**Type 1**: on the March load, row 812 is updated in place: city Denver. The January fact still references key 812 — which now *says Denver*. Run 'January revenue by city' in February: Provo 62.00. Run the identical query in April: Denver 62.00. The report changed retroactively; finance's printed February numbers no longer reconcile with the warehouse, and no query can recover Provo.\n\n**Type 2**: on the March load, row 812 is closed (effective_to 2026-03-18, is_current false) and a new row inserted: `(customer_key 9105, C-4417, Mara, Denver, Mountain, effective_from 2026-03-18, is_current true)`. The January fact still references 812 → Provo, forever. Mara's *April* orders are loaded with key 9105 → Denver. 'January revenue by city' returns Provo 62.00 in February, in April, and in 2030. Both of Mara's versions share natural_key C-4417, which is how 'all of Mara's orders ever' remains one query (join on natural key, or group by it) — and why the surrogate/natural split was load-bearing: the natural key names the *person*; the surrogate names the *version*."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Type 2 makes historical reports stable",
              "statement": "Under Type 2 discipline — (i) fact rows are immutable and carry the surrogate key of the dimension version current at event time; (ii) dimension versions, once superseded, are never modified (changes only close a version and append a new one) — every aggregate over any fixed set of past facts, grouped or filtered by dimension attributes, returns the same result no matter what dimension changes occur after those facts were loaded. Under Type 1, by contrast, any aggregate grouped by an overwritten attribute is *not* stable: one update to a referenced dimension row changes the historical report's output.",
              "proof": "A star query's result is a function of exactly two inputs: the fact rows in the queried slice and the dimension rows their surrogate keys reference. Fix a set F of past facts. By (i), F's rows and their stored surrogate keys never change. Each referenced key k identifies a version row that was current at some event's time and is therefore, by the time any *later* change occurs, either still current or superseded; by (ii), later changes never modify existing version rows — a change closes a version (touching only its effective_to/is_current bookkeeping columns, not its attributes) and appends a new row with a *new* key, which no fact in F references. Hence the attribute values reached from F are pointwise identical at every future time, and any deterministic aggregate of them is constant. For Type 1: the update to row k mutates an attribute that some fact in F reaches through its stored key, so a group-by on that attribute reassigns that fact's measures to a different group — the report changes without any fact changing. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: the load-time mechanics",
              "body": "Type 2 is a warehouse discipline, not a database feature, so the nightly load (unit 7 industrializes this) must implement it. For each incoming customer record from the source, compare against the dimension's current version, attribute by tracked attribute:\n\n**No change** → nothing. **Type-1 attribute changed** (email fixed) → UPDATE the current row in place; history intentionally not kept. **Type-2 attribute changed** (city) → one transaction: UPDATE current row SET effective_to = today, is_current = false; INSERT new row (new surrogate from the key sequence, new city, effective_from = today, is_current = true). **New natural key** → INSERT first version.\n\nThen the *fact* load consumes the dimension: each incoming order line looks up the surrogate key of the version current at the order's event time — the **surrogate key pipeline**. Two classic bugs live here. Late-arriving facts: Tuesday's file contains a March 10 order for Mara; the lookup must select the version effective *on March 10* (key 812), not is_current (9105) — joining on is_current silently mis-attributes late data to new versions, a bug that passes every eyeball test until someone audits a restated month. Late-arriving dimensions: an order references C-9930, a customer the dimension has never seen (the customer feed lags); the load inserts a placeholder version (attributes 'Unknown') to keep the fact loadable, upgraded on arrival — never dropped, never defaulted to a wrong customer."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Type 2 changes what COUNT means — and hybrid demands are a smell.** After a year of Type 2, dim_customer has more rows than customers: COUNT(*) counts versions. 'How many customers?' must be COUNT(DISTINCT natural_key) — or WHERE is_current for the present population. Every consumer of a Type-2 dimension must know it is versioned; hiding the versioning behind an is_current view and calling it dim_customer invites exactly the silent wrong joins the design exists to prevent. Separately: when stakeholders ask for *both* 'as it was' and 'as it is now' on the same attribute, resist inventing per-report overwrites — model it as Type 2 (which can always *also* restate: join facts to the current version by natural key) rather than Type 1 plus regret, which can never recover history."
            },
            {
              "type": "text",
              "heading": "Choosing types, and what this costs",
              "body": "The decision procedure per tracked attribute is short. Does any analysis group, filter, or cohort by this attribute's *historical* value? If yes — city, region, loyalty tier, category, price band — Type 2. If the attribute is descriptive trivia or error-corrections whose past values have no analytical meaning — email, phone, spelling of a name — Type 1, deliberately. Type 3 only when the business explicitly wants side-by-side old/new mapping during a planned transition (the June category split is the textbook case: previous_category lets merchandising view the summer under either taxonomy).\n\nThe costs are real but bounded. Dimension growth: 4 M customers at ~1.4 versions each averages 5.6 M rows — still 'short' against a 40 M-row fact, and unit 2's encodings eat repeated attributes across versions. Load complexity: the compare-and-version logic and the event-time surrogate lookup are genuine machinery — unit 7 packages them as testable, idempotent transformations rather than hand SQL. Consumer education: the COUNT caveat above. Against these costs stands the proposition: reports that never restate, audits that reconcile, cohorts that mean what they say. Trellis adopts Type 2 for city/region/tier on dim_customer and category/price_band on dim_product, Type 1 for the rest — a decision recorded *in the model's documentation*, because an SCD policy nobody can look up is an SCD policy that erodes one convenient overwrite at a time."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Time is now inside the model honestly: per-attribute SCD policies, Type 2's versioned rows keyed by surrogates with the stability proposition guaranteeing that the past, once written, stays written — plus the load mechanics (event-time lookups, late arrivals, placeholders) that make the guarantee operational rather than aspirational. Mara's January order will say Provo forever, and her lifetime value is still one query away through the natural key. The model so far is one star, though — one process, one fact table. A business measures many processes, and the analyst's real questions cut *across* them: revenue versus shipping cost, orders versus inventory, marketing touches versus purchases. Making many stars behave as one warehouse — conformed dimensions, the bus architecture, and the fact-table types beyond the transaction grain — is the final lesson of the unit."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Trellis's dim_product tracks category as Type 2. On June 1 'Cacti & Succulents' (key 300) splits: cacti products get new versions under 'Cacti' and succulents under 'Succulents'. Write the dimension rows for product P-0077 (a succulent, old version key 300… use key 300 for its old version and 951 for the new) and state which key its May 20 and June 10 order lines carry. Then: what does 'June revenue by category' show for a query run in July versus one run next year?",
                  "solution": "Rows: (product_key 300, natural P-0077, category 'Cacti & Succulents', effective_from 2024-…, effective_to 2026-06-01, is_current false) and (product_key 951, natural P-0077, category 'Succulents', effective_from 2026-06-01, effective_to null, is_current true). May 20 fact rows carry 300 (version current at event time); June 10 rows carry 951. 'June revenue by category' shows June 1–30 sales under 'Succulents'/'Cacti' (all June facts postdate the split) — and by the stability proposition it shows the identical result in July and next year: versions 300 and 951 are immutable, and June's facts and keys never change.",
                  "hint": "One closed row, one new row, new surrogate; facts keep the key current at their event time."
                },
                {
                  "prompt": "A report 'Q1 revenue by customer region' was published in early April. In May, 40,000 customers were re-regioned in a territory rebalance. State what the re-run report shows under (a) Type 1 and (b) Type 2 — then show how, under Type 2, the analyst can *also* produce the restated view ('Q1 revenue under the new territories') with one join change.",
                  "solution": "(a) Type 1: the May overwrite changed the region on rows Q1 facts reference — the re-run reassigns those customers' Q1 revenue to new regions; the published April numbers no longer reproduce, with no way back. (b) Type 2: Q1 facts reference pre-rebalance versions; the re-run matches April exactly. Restated view: join fact → its version → natural key → the *current* version, and group by the current version's region: FROM fact f JOIN dim_customer v ON f.customer_key = v.customer_key JOIN dim_customer cur ON cur.natural_key = v.natural_key AND cur.is_current GROUP BY cur.region. Type 2 can express both readings; Type 1 can express only one — and destroys the other.",
                  "hint": "Type 2 keeps both versions reachable: event-time via the fact's key, current via the natural key."
                },
                {
                  "prompt": "Find the bug: a fact load assigns surrogate keys with `JOIN dim_customer d ON d.natural_key = src.customer_id AND d.is_current = true`. Construct a concrete late-arriving-fact scenario where this loads wrong data that no error or test-by-eyeball catches, and give the correct join predicate.",
                  "solution": "Scenario: Mara moved March 18 (Provo v812 closed; Denver v9105 current). On March 20 a delayed March 10 order arrives in the batch. The is_current join assigns key 9105 — the order is recorded as Denver, though it happened in Provo. Nothing fails: the key is valid, totals are right, only the *attribution* is wrong, surfacing months later as a small unexplained discrepancy in regional history. Correct predicate — version effective at event time: JOIN dim_customer d ON d.natural_key = src.customer_id AND src.order_ts >= d.effective_from AND (src.order_ts < d.effective_to OR d.effective_to IS NULL).",
                  "hint": "What if the fact's event time predates the current version's effective_from?"
                },
                {
                  "prompt": "For each dim_customer attribute, assign SCD Type 1, 2, or 3 with a one-sentence justification: (a) email address; (b) loyalty_tier; (c) marketing_segment during a planned segmentation overhaul where the CMO wants old-vs-new comparisons for two quarters; (d) date_of_birth (a correction of a typo).",
                  "solution": "(a) Type 1 — corrections/contact info; no analysis groups by historical email; keeping wrong emails 'as they were' serves nothing. (b) Type 2 — cohorts and revenue are analyzed by tier at time of purchase; overwriting would restate every tier report. (c) Type 3 — the stated analysis *is* old-vs-new side by side for a bounded window: previous_segment + current_segment columns serve it directly (Type 2 could too, but cross-mapping queries get clumsier than two columns for a planned one-time transition). (d) Type 1 — the old value was an error, not history; preserving a typo as a 'version' would make the version history lie.",
                  "hint": "Ask per attribute: does anyone analyze by its historical value? Is the old value truth-then, or just wrong?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u3l3-i1",
              "front": "SCD Type 1 vs Type 2 — mechanics and what each does to history",
              "back": "Type 1: overwrite in place — history restated, old value unrecoverable. Type 2: close current row, insert new version with new surrogate key + effective dates — history preserved as it was."
            },
            {
              "id": "u3l3-i2",
              "front": "Why does SCD Type 2 require surrogate keys?",
              "back": "Versioning needs multiple rows per natural key; only a warehouse-assigned key can name a *version*. Natural key = the entity; surrogate key = one version of it."
            },
            {
              "id": "u3l3-i3",
              "front": "The Type 2 stability guarantee (and its two preconditions)",
              "back": "If facts are immutable with event-time surrogate keys, and superseded versions are never modified (append-only changes), every historical aggregate is invariant under later dimension changes."
            },
            {
              "id": "u3l3-i4",
              "front": "The late-arriving-fact bug in surrogate key lookups",
              "back": "Joining on is_current mis-attributes delayed facts to versions that postdate the event. Correct join: the version whose [effective_from, effective_to) contains the fact's event time."
            },
            {
              "id": "u3l3-i5",
              "front": "After adopting Type 2, what does COUNT(*) on the dimension return, and how do you count entities?",
              "back": "It counts versions. Entities: COUNT(DISTINCT natural_key); current population: WHERE is_current. Every consumer must know the dimension is versioned."
            },
            {
              "id": "u3l3-i6",
              "front": "How does a Type-2 model produce a 'restated under current attributes' report?",
              "back": "Join fact → its event-time version → natural key → current version, group by the current version's attributes. Type 2 expresses both readings of history; Type 1 only one."
            }
          ]
        },
        {
          "id": "u3l4",
          "title": "Conformed Dimensions and the Wider Warehouse",
          "estMinutes": 29,
          "builds_on": [
            "u3l1",
            "u3l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "From a star to a galaxy",
              "body": "*Grain, Facts, and Dimensions* insisted on one process per fact table, and Trellis obeys: orders in fact_order_line. But the business runs on many processes — shipments leave warehouses, inventory sits in them, customers click through the site — and the questions executives actually ask cut across processes: *revenue versus fulfillment cost by product*; *did the stockout cause the sales dip?*; *which sessions convert?* The warehouse must therefore become a set of stars — a galaxy — without becoming a set of silos. Kimball's instrument for this is deceptively administrative: the **conformed dimension**, one physically shared dimension table used identically by every fact that needs it, plus the **bus matrix**, the planning grid of processes × dimensions that makes conformance a design commitment rather than an accident. This closing lesson builds Trellis's second and third fact tables — which force two new fact-table species and the semi-additivity rules from lesson 1 into action — then shows how cross-process questions are correctly answered (drill-across), and closes the unit by ruling on the modern challenge to all of it: the One Big Table."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Conformed dimensions; the three fact-table types",
              "statement": "A dimension is **conformed** across fact tables when they share the *same* dimension — same table, same surrogate keys, same attribute definitions and SCD policy — or a strict subset of it. Facts joined to conformed dimensions can be analyzed together by common attributes; facts with private, incompatible dimensions cannot be combined at all. The **bus matrix** is the grid of business processes (rows) against dimensions (columns), marking which processes use which dimensions; it is the warehouse's architecture on one page.\n\nFact tables come in three types by temporal shape. **Transaction fact**: one row per event as it occurs (order line, click) — append-only, additive measures, the default. **Periodic snapshot fact**: one row per entity per fixed period capturing a level (one row per SKU per warehouse per day: on_hand_units) — dense, regular, and its level measures are **semi-additive**: they aggregate across non-time dimensions but must never be summed across time (average, min, max, or last instead). **Accumulating snapshot fact**: one row per instance of a process with a defined pipeline of milestones (one row per order: placed_date, packed_date, shipped_date, delivered_date + lags), **updated in place** as milestones occur — the deliberate exception to fact immutability, suited to short-lived processes analyzed for pipeline velocity."
            },
            {
              "type": "example",
              "heading": "Worked example: the inventory snapshot and the semi-additive trap",
              "body": "Trellis's ops team needs stock analytics, and inventory is a *level*, not an event — you can model receipts and picks as transactions, but 'how much was on hand?' is most directly served by a **periodic snapshot**: `fact_inventory_daily — grain: one row per SKU per warehouse per day; FKs date_key, product_key, warehouse_key; measures on_hand_units, on_order_units, unit_cost_snapshot`. At 10,000 SKUs × 3 warehouses × 365 days ≈ 11 M rows/year — dense by construction (a row exists even when nothing moved, which is exactly what makes time series over it trivial).\n\nNow the trap, in numbers. SKU P-0077 at warehouse SLC holds 40 units on hand every day of June. 'Total June inventory' as SUM(on_hand_units) = 40 × 30 = **1,200** — a meaningless 'unit-days' figure that a dashboard will happily label 'units'. Correct temporal aggregations: **AVG** over days (40 — average stock level, the input to carrying-cost), **MIN** (40 — worst-case cover), **LAST** (40 — month-end position for the balance sheet). Across *non-time* dimensions the measure is honestly additive: SUM across the three warehouses on one day is total company stock of the SKU, exactly right. Semi-additivity is thus not a vague warning but a per-dimension contract: sum across product and warehouse, never across date. Good BI semantic layers (unit 9) encode the contract on the measure so the wrong query is *ungenerable*; until then it lives in documentation and code review."
            },
            {
              "type": "example",
              "heading": "Worked example: drill-across, done right and done wrong",
              "body": "Question: **net revenue versus fulfillment cost by product category, June**. Revenue lives in fact_order_line; shipping cost in fact_shipment (grain: one row per shipped package; measures ship_cost, weight; conformed dims: date, customer, warehouse — and product? No: a package contains several products, so product is *not* a dimension of shipment; the shared analyzable dimension here is category via allocation or, cleanly, the conformed dims both facts truly share. Take instead a case both share cleanly: **by fiscal week**, via conformed dim_date).\n\n**Wrong**: join the fact tables to each other — `fact_order_line f JOIN fact_shipment s ON f.order_id = s.order_id` — then aggregate. An order with 3 lines and 2 packages produces 6 joined rows: every line's revenue counted twice, every package's cost thrice — a many-to-many **fan-out** that inflates both sides (the mixed-grain double-count's evil twin). Fact-to-fact row joins are essentially always wrong.\n\n**Right — drill across**: aggregate each fact *separately* to the shared conformed grain, then join the small results: `(SELECT d.fiscal_week, SUM(net_amount) rev FROM fact_order_line JOIN dim_date d … GROUP BY 1) r FULL JOIN (SELECT d.fiscal_week, SUM(ship_cost) cost FROM fact_shipment JOIN dim_date d … GROUP BY 1) c USING (fiscal_week)`. Each fact is summed at its own grain (no fan-out), and the join happens between two already-aggregated week-grain rows — which is only meaningful because both facts share dim_date *conformed*: same keys, same fiscal calendar. Conformance is what makes the FULL JOIN line up; the bus matrix is where you guaranteed it in advance."
            },
            {
              "type": "decision",
              "heading": "Which fact-table type fits the process?",
              "rows": [
                [
                  "Discrete events, each occurring once (orders, clicks, payments)",
                  "transaction fact — append-only rows at event grain; additive measures"
                ],
                [
                  "A level that exists continuously (stock, balances, headcount)",
                  "periodic snapshot — one row per entity per period; semi-additive levels: AVG/MIN/MAX/LAST over time, SUM over other dims"
                ],
                [
                  "A short pipeline with fixed milestones (order fulfillment, claims, onboarding)",
                  "accumulating snapshot — one row per instance, milestone dates + lags updated in place; analyze velocity and bottlenecks"
                ],
                [
                  "An event with no numeric measure (check-in, page view, contact)",
                  "factless transaction fact — COUNT(*) at grain is the measure"
                ],
                [
                  "'Both events and current state requested'",
                  "store the transaction/event fact; serve state as a view (lesson 1's events-not-states) — or add a snapshot fact if levels are queried heavily"
                ]
              ]
            },
            {
              "type": "text",
              "heading": "The One Big Table question, ruled on honestly",
              "body": "The modern objection to all of the above: 'storage is columnar and cheap — skip the star, materialize **One Big Table** (OBT) per subject, every dimension attribute pre-joined onto every fact row, and let analysts query one table with zero joins.' The objection deserves a fair hearing, because unit 2 genuinely changed the physics: flattening category onto 40 M fact rows costs ~30 MB dictionary-encoded, and eliminating query-time joins is real latency and real usability, especially for tools and ad-hoc users.\n\nBut run the *lifecycle*, not just the query. When a Type-2 attribute changes — or worse, when an SCD policy or a definition is corrected — the star updates one dimension table; the OBT must **rewrite history across billions of denormalized fact rows** (and every other OBT sharing the attribute). When a new attribute is added, the star widens a 10 k-row table; the OBT backfills 40 M rows. When two OBTs disagree on 'customer_region', conformance — the property drill-across depends on — has silently died, because nothing structural forces their copies to agree. The mature resolution, and the one Trellis adopts, is layering: **model dimensionally (stars, conformed, SCD-governed) as the governed core; derive OBTs downstream as disposable serving marts** — materialized views of star joins, rebuilt on schedule, optimized for specific dashboards (unit 7 builds them; unit 9 serves them). The star is the source of truth *because* it localizes change; the OBT is a cache of the star, legitimate exactly because it can be dropped and rebuilt. Where teams get hurt is promoting the cache to the model."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**The bus matrix is a political document — write it early.** Conformance fails organizationally before it fails technically: the marketing team builds its own 'customers' with its own keys, and a year later no cross-process question reconciles. A one-page grid — processes down the side (orders, shipments, inventory, sessions), dimensions across the top (date, customer, product, warehouse, promotion, channel), ticks in the cells — is the cheapest artifact in data engineering relative to what it prevents: it is simultaneously the roadmap (build dimensions once, in dependency order), the review checklist (a new fact proposing a private customer table must justify itself), and the org chart of data ownership."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The modeled layer is complete as a design discipline. One process per fact table at a declared grain; three temporal species of fact (transaction, periodic snapshot with its semi-additive contract, accumulating snapshot); dimensions conformed across the galaxy so drill-across — aggregate separately, join at the shared grain — answers cross-process questions without fan-out; SCD policies keeping every star's history stable; and OBTs demoted to derived serving marts of a star-shaped core. Trellis's bus matrix now reads: orders, shipments, inventory, sessions × date, customer, product, warehouse, promotion, channel. What the model cannot do is run itself: every query is still a scan-join-aggregate that some engine must execute in seconds against billions of rows. How columnar engines actually execute the star pattern — vectorized scans, zone-map pruning, and the distributed joins that make a 4-million-row dimension meet a 40-million-row fact — is unit 4."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Design the fact table for Trellis's order fulfillment pipeline (placed → packed → shipped → delivered, typically 1–5 days end to end), where ops wants bottleneck and velocity analysis ('average placed-to-packed lag by warehouse by week'). Name the type, declare the grain, list keys/measures — and state the fact-immutability exception it invokes and why that's acceptable here.",
                  "solution": "Accumulating snapshot: grain = one row per order (the pipeline instance). Keys: order_id (degenerate), customer_key, warehouse_key, and one role-playing date key per milestone (placed_date_key, packed_date_key, shipped_date_key, delivered_date_key). Measures: the lags (hours_to_pack, hours_to_ship, hours_to_deliver) plus order-level amounts if wanted. Rows are updated in place as milestones occur — the sanctioned exception to immutability — acceptable because the process is short-lived and bounded (rows stop changing after ~days), the population is small relative to transactions, and velocity questions ('AVG lag by week by warehouse') are precisely what per-instance milestone columns answer directly; modeling the same via events is possible but pushes every velocity query into multi-row pivots.",
                  "hint": "Fixed milestones + lag analysis is the accumulating snapshot's signature."
                },
                {
                  "prompt": "Using fact_inventory_daily (grain: SKU × warehouse × day), write correct answers for: (a) company-wide stock of SKU P-0077 on June 30; (b) average June stock level of P-0077 at SLC; (c) 'total units held in June' as a colleague's SUM(on_hand_units) — explain what their number actually measures and give the legitimate use it has.",
                  "solution": "(a) SUM(on_hand_units) across warehouses WHERE date = 2026-06-30 AND sku = P-0077 — additive across non-time dimensions at a fixed instant. (b) AVG(on_hand_units) over the 30 daily rows for (P-0077, SLC) — the semi-additive temporal aggregate. (c) Their sum is **unit-days**: units held × days held, summed. As 'units' it is meaningless (30× too big for a constant level); but divided by days it is the average level, and multiplied by daily carrying cost per unit it is exactly June's inventory carrying cost — the one legitimate life of the raw sum. Label it what it is or don't ship it.",
                  "hint": "Instant sums across space are fine; sums across time make unit-days."
                },
                {
                  "prompt": "An analyst answers 'revenue and sessions by fiscal week' with FROM fact_order_line f JOIN fact_session s ON f.customer_key = s.customer_key AND f.date_key = s.date_key. A customer with 3 order lines and 5 sessions in one week contributes how many joined rows, and what happens to their revenue in the sum? Write the drill-across correction and name the property of dim_date it depends on.",
                  "solution": "3 × 5 = 15 joined rows; each order line's net_amount appears 5 times, so the customer's weekly revenue is inflated 5× (and their session count 3×) — classic fan-out. Correction: (SELECT d.fiscal_week, SUM(net_amount) rev FROM fact_order_line JOIN dim_date d USING (date_key) GROUP BY 1) r FULL JOIN (SELECT d.fiscal_week, COUNT(*) sessions FROM fact_session JOIN dim_date d USING (date_key) GROUP BY 1) s USING (fiscal_week). It depends on dim_date being *conformed*: both facts use the same date keys and the same fiscal_week definition, so the two aggregates align row-for-row at the shared grain.",
                  "hint": "Count the cross-product; then aggregate each fact separately and join the summaries."
                },
                {
                  "prompt": "Make the honest case memo (4–6 sentences) for Trellis's data lead: when is an OBT the right deliverable, what must remain star-shaped underneath, and the one operational rule that keeps the arrangement safe. Include the concrete failure that occurs if the rule is broken.",
                  "solution": "OBTs are the right deliverable at the serving edge: dashboard-specific marts where join-free querying, tool simplicity, and latency matter, and where the table can be regenerated wholesale. Underneath, the governed core stays dimensional: stars with conformed, SCD-managed dimensions, because that is where a change (a Type-2 version, a definition fix, a new attribute) touches one small table instead of billions of denormalized rows. The operational rule: every OBT is a *derived, disposable build* of the star — rebuilt on schedule from it, never written by anything else, never treated as a source. Break the rule (teams patch the OBT directly, or build OBTs from raw bypassing the star) and copies of shared attributes drift: two marts report different customer_region for the same customer, drill-across dies because nothing conformed them, and the eventual reconciliation requires rebuilding trust, not just tables.",
                  "hint": "Cache vs model: what property makes a cache safe? Rebuildability and a single upstream."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u3l4-i1",
              "front": "Conformed dimension — definition and what it enables",
              "back": "The same physical dimension (keys, attributes, SCD policy) shared by multiple fact tables — or a strict subset. Enables drill-across: cross-process analysis that actually lines up."
            },
            {
              "id": "u3l4-i2",
              "front": "The three fact-table types and their signatures",
              "back": "Transaction (one row per event, append-only, additive); periodic snapshot (entity × period levels, semi-additive over time); accumulating snapshot (one row per pipeline instance, milestone dates updated in place)."
            },
            {
              "id": "u3l4-i3",
              "front": "The semi-additive contract for snapshot levels",
              "back": "SUM across non-time dimensions at an instant; across time use AVG/MIN/MAX/LAST — SUM over days yields unit-days (whose only legitimate use is carrying-cost / average-level math)."
            },
            {
              "id": "u3l4-i4",
              "front": "Drill-across: the right way to combine two fact tables",
              "back": "Aggregate each fact separately to the shared conformed grain, then join the summaries. Never join fact to fact row-wise — many-to-many fan-out inflates both sides."
            },
            {
              "id": "u3l4-i5",
              "front": "The OBT ruling: where One Big Tables belong",
              "back": "As derived, disposable serving marts rebuilt from the star — never as the governed model, because attribute changes localize in a dimension but require history rewrites across every denormalized copy."
            },
            {
              "id": "u3l4-i6",
              "front": "The bus matrix",
              "back": "Processes × dimensions grid marking usage — the warehouse's one-page architecture; forces conformance decisions early and in the open."
            }
          ]
        }
      ],
      "masteryCheck": {
        "id": "u3-check",
        "questions": [
          {
            "id": "u3q1",
            "type": "open",
            "points": 3,
            "prompt": "A boutique hotel group wants analytics for stays: guests book (booking date), check in, stay some nights at a nightly rate that can differ per night (seasonal pricing), incur charges (room, spa, restaurant), and check out. Marketing analyzes by guest home region and loyalty tier (tiers change over time); revenue management analyzes nightly rates and occupancy by property by season. Design the core model: declare fact table(s) with grain and type, dimensions with SCD policies where they matter, classify each proposed measure's additivity, and flag one modeling trap in this domain and how your design avoids it.",
            "rubric": [
              "Declares grain(s) explicitly and atomically — e.g., fact_stay_night: one row per occupied room-night (with nightly_rate, room_revenue) and/or fact_folio_charge: one row per charge line; a booking-grain or stay-grain-only design that cannot answer per-night rate/occupancy questions is penalized",
              "Chooses correct fact types: transaction fact(s) for nights/charges; occupancy analysis served from the room-night grain (or a periodic snapshot per room per night with occupied flag) — and notes an accumulating snapshot as optional for the booking→checkout pipeline",
              "Dimensions with SCD: guest (loyalty_tier, home_region as Type 2 — cohort/tier analyses need history as it was), property, room/room_type, date (per-night role); justifies at least one Type-2 choice",
              "Classifies additivity correctly: room_revenue/charges additive; nightly_rate non-additive (store revenue and nights, derive ADR = SUM(revenue)/SUM(nights)); occupancy as room-nights occupied (additive) over room-nights available, ratio derived",
              "Names a real trap with mitigation — e.g., storing ADR or occupancy % as a fact (non-additive ratio) instead of components; booking-grain rows double-counting multi-night revenue; or joining charge fact to night fact row-wise (fan-out) instead of drill-across via conformed dims"
            ],
            "solution": "Core: fact_stay_night — grain: one row per room per occupied night; type: transaction (each night's occupancy is an event); FKs: date_key (the night), guest_key, property_key, room_type_key, rate_plan_key; measures: nightly_rate_amount (revenue for that night — additive), plus a room-night implicit count. Companion: fact_folio_charge — grain: one row per charge line posted (room, spa, restaurant); FKs date, guest, property, department; measure charge_amount (additive). Optional fact_booking_pipeline (accumulating snapshot: one row per stay with booked/checkin/checkout dates and lags) for velocity questions. Dimensions: dim_guest with loyalty_tier and home_region as Type 2 (marketing cohorts by tier-at-time-of-stay must not restate when a guest levels up; the stability proposition applies), contact fields Type 1; dim_property, dim_room_type, dim_date conformed across all facts. Additivity: revenue and charges additive everywhere; ADR (average daily rate) is non-additive — never stored as a fact; derived as SUM(nightly_rate_amount)/COUNT(room-nights). Occupancy = SUM(occupied room-nights)/SUM(available room-nights); available room-nights come from a small periodic snapshot (rooms in service per property per night) or a capacity dimension — the ratio is derived, never stored. Trap flagged: seasonal per-night pricing makes any stay-grain table (one row per stay with total_amount and avg_rate) unable to answer 'rate by season' correctly — nights spanning seasons need the night grain; equally, storing ADR as a measure invites SUM(ADR) nonsense. The night grain plus derived ratios avoids both; cross-fact questions (spa revenue vs room revenue by tier) go drill-across through conformed dim_guest/dim_date, never fact-to-fact joins.",
            "explanation": "Tests the full unit: grain-first design, fact-type selection, Type-2 justification, the non-additive-ratio discipline, and fan-out/drill-across awareness — on a domain whose per-night pricing punishes coarse grains exactly the way the mixed-grain proposition predicts."
          },
          {
            "id": "u3q2",
            "type": "numeric",
            "prompt": "dim_customer is Type 2 on city. Customer C-9001's history: created 2024-03-01 (Austin), moved 2025-06-10 (Boise), moved 2026-02-20 (Denver). Their orders: 2024-11-02, 2025-06-10 (order placed that afternoon, after the move was recorded that morning), 2025-12-25, 2026-05-01. After all loads, how many rows does dim_customer hold for C-9001, and how many of this customer's four fact rows reference the Boise version? Answer as two digits separated by nothing (e.g., '32' for 3 rows and 2 facts).",
            "answer": 32,
            "tolerance": 0,
            "explanation": "Three versions (Austin, Boise, Denver) = 3 rows. Boise's effective window is [2025-06-10, 2026-02-20): the 2025-06-10 afternoon order (event time ≥ effective_from that day) and 2025-12-25 both fall inside → 2 facts. 2024-11-02 → Austin; 2026-05-01 → Denver. The event-time join predicate — not is_current — is what assigns the same-day order correctly.",
            "points": 1
          },
          {
            "id": "u3q3",
            "type": "short",
            "prompt": "Inventory on_hand_units is semi-additive. In two words each: which aggregate family is valid across warehouses at one instant, and which family is valid for the same SKU across a month of daily snapshots?",
            "accept": [
              "sum, average",
              "sum average",
              "sum; average",
              "sum, avg",
              "sum avg",
              "sum; avg",
              "sum, mean",
              "sum then average"
            ],
            "explanation": "Across non-time dimensions at a fixed instant, levels add: SUM over warehouses is total stock. Across time, levels must not add — AVG (or MIN/MAX/LAST) over the days is the valid family; SUM over days manufactures unit-days.",
            "points": 1
          },
          {
            "id": "u3q4",
            "type": "mcq",
            "prompt": "A retailer's fact table has grain 'one row per order line', but the ETL also inserts one row per order carrying the order's shipping fee in the same amount column ('so shipping is in the fact somewhere'). Which statement is correct?",
            "options": [
              "Any SUM(amount) sliced by attributes shared between orders and their lines mixes merchandise and shipping and cannot be separated by those attributes alone — the table now holds two grains and needs a discriminator or a split",
              "This is fine because shipping rows have NULL product_key, and NULL keys are automatically excluded from joins to dim_product, so all queries remain correct",
              "The design is correct Kimball practice: heterogeneous events belong in one fact table as long as the amount column is consistently a dollar value",
              "The problem is only performance: extra rows enlarge the table, but correctness is unaffected because shipping and merchandise amounts are both additive"
            ],
            "answer": 0,
            "explanation": "Two grains share one measure column: order-grain rows agree with their lines on date/customer/channel attributes, so slices by those attributes include both, and SUM conflates merchandise with shipping (the mixed-grain proposition's mechanism — here conflation rather than exact doubling, since the fee isn't the sum of the lines). (b) is accidentally half-true for product-joined queries only — any query not joining product (revenue by week) still conflates, so 'all queries remain correct' is false; (c) misstates Kimball — one process, one grain per fact table; (d) additivity of each amount doesn't make their *mixture* meaningful.",
            "points": 1
          },
          {
            "id": "u3q5",
            "type": "proof",
            "points": 2,
            "prompt": "Prove the Type-2 stability proposition: if (i) fact rows are immutable and store the surrogate key of the dimension version current at event time, and (ii) superseded dimension versions are never modified (a change only closes the current version's effective window and appends a new row with a new surrogate key), then any aggregate over a fixed set of past facts, grouped or filtered by dimension attributes, is invariant under all subsequent dimension changes. Also state precisely which step fails under Type 1.",
            "rubric": [
              "Identifies the aggregate's inputs exactly: the fixed fact rows and the dimension rows reachable via their stored surrogate keys — and notes any deterministic aggregate is a function of these inputs",
              "Uses (i): the fact set, including its stored keys, is immutable, so the set of referenced dimension rows is fixed over time",
              "Uses (ii): later changes append rows under new surrogate keys and do not alter attribute values of existing version rows (only effective_to/is_current bookkeeping), so every referenced row's attributes are pointwise unchanged; new versions are unreachable from the old facts",
              "Concludes invariance (function of unchanged inputs) and locates Type 1's failure: the overwrite mutates an attribute of a row that old facts still reference, changing group assignment of fixed measures — the same aggregate returns a different result"
            ],
            "solution": "Let F be the fixed set of past fact rows and A any deterministic aggregate grouped/filtered by dimension attributes. A's value is determined by (a) the rows of F with their measures and stored surrogate keys, and (b) the attribute values of the dimension rows those keys reference. By (i), F is immutable: its measures and keys never change, so the referenced key set K is constant. Consider any dimension change after F's facts were loaded. By (ii) it operates only by closing the current version (updating effective_to/is_current on that row — bookkeeping columns not used as grouping attributes) and inserting a new row under a fresh surrogate key k' ∉ K (fresh by construction of the key sequence; no fact in F references k'). Therefore for every k ∈ K, the attribute values of row k are identical before and after the change; the mapping from F through K to attributes is pointwise unchanged; and A, a deterministic function of unchanged inputs, is unchanged. By induction over any finite sequence of subsequent changes, invariance holds forever. Under Type 1, the change is an in-place UPDATE of an attribute on an existing row k ∈ K: input (b) changes — facts in F referencing k now join to a different attribute value, so a group-by on that attribute reassigns their measures between groups and A returns a different value, though no fact changed. The failure is exactly at the never-modified premise (ii). ∎",
            "explanation": "The unit's central guarantee: the warehouse's honesty about history is a consequence of two mechanical disciplines — immutable facts with event-time keys, append-only dimension versions — not of anyone's good intentions. The proof also shows why effective-window bookkeeping columns must not double as analytical attributes."
          },
          {
            "id": "u3q6",
            "type": "numeric",
            "prompt": "An analyst joins fact_order_line to fact_shipment on order_id to get 'revenue and shipping cost by week'. Order O-100 has 4 order lines totaling $200 and 3 shipped packages costing $30 total. In the joined-then-summed result, what total revenue is attributed to O-100 (in dollars)?",
            "answer": 600,
            "tolerance": 0,
            "explanation": "The row-wise fact-to-fact join produces 4 × 3 = 12 rows; each order line's revenue appears once per package — 3 times — so SUM(revenue) = 3 × $200 = $600 (and shipping would inflate 4× to $120). The fan-out factor is the other fact's row count per key. Drill-across — aggregate each fact separately to the conformed week grain, then join — returns the true $200 and $30.",
            "points": 1
          }
        ]
      }
    },
    {
      "id": "u4",
      "title": "How Analytical Queries Run",
      "summary": "Vectorized execution, zone-map pruning and clustering, and distributed joins — the engine mechanics every warehouse and lakehouse shares.",
      "intro": "Units 2 and 3 built what analytical systems store and how it is modeled; this unit builds what happens when you press enter. It matters practically — the difference between a 40-second and a 0.4-second dashboard is almost always one of this unit's three mechanisms, misapplied — and it matters strategically: Snowflake, BigQuery, Databricks, Redshift, and DuckDB differ loudly in packaging but run on the same three engine ideas, so learning them once here means unit 5 and 6's platforms can be understood as *configurations* rather than magic. The first lesson goes inside a single core: why the classical row-at-a-time iterator collapses on scans, and how vectorized (batch-at-a-time) execution recovers the CPU's throughput — with the speedup derived, not vibed. The second lesson goes to the block level: zone maps, the pruning arithmetic, and the uncomfortable theorem that metadata prunes nothing unless the *layout* concentrates values — sort order is destiny, third appearance. The third lesson goes across machines: massively parallel processing, partial aggregation, and the broadcast-versus-shuffle join decision, priced in network bytes with the course's own tables. The gate makes you the engine: predict the plan, compute its cost, fix the slow one.",
      "references": [
        "Boncz, Zukowski & Nes — MonetDB/X100: Hyper-Pipelining Query Execution (CIDR 2005)",
        "Abadi, Madden & Hachem — Column-Stores vs. Row-Stores (SIGMOD 2008) — late materialization, compression-aware execution",
        "Martin Kleppmann — Designing Data-Intensive Applications, ch. 3 & 10 (columnar execution; MPP vs MapReduce context)",
        "Melnik et al. — Dremel (VLDB 2010) — serving-tree aggregation at scale",
        "Dageville et al. — The Snowflake Elastic Data Warehouse (SIGMOD 2016) — pruning and execution in a production design"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u4l1",
          "title": "Vectorized Execution: Feeding the CPU",
          "estMinutes": 27,
          "builds_on": [
            "u1l3",
            "u2l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The bottleneck moved",
              "body": "Unit 2 shrank the Monday query's I/O from 6.4 GB to ~100 MB — at which point a strange thing happens: the disk stops being the bottleneck. 100 MB arrives from an NVMe drive or a warm cache in well under a second, but a classical database engine can spend *several seconds of CPU* processing it. The scan-era truth 'databases are I/O-bound' quietly inverted for analytical engines: once columnar formats fixed the I/O, **queries became CPU-bound**, and the villain is not the arithmetic — summing 40 million multiplications is ~80 ms of raw ALU work — but the *interpretation machinery wrapped around each value*. This lesson is about that machinery: why the venerable tuple-at-a-time iterator model burns hundreds of CPU cycles to accomplish two cycles of useful work, and how vectorized execution — processing values in cache-resident batches of a few thousand — restores the hardware's actual speed. The idea comes from the MonetDB/X100 project (CIDR 2005), and it is the execution model of effectively every engine built since: Snowflake, DuckDB, Photon, Velox, polars."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The Volcano iterator model and the vectorized model",
              "statement": "In the **Volcano (tuple-at-a-time iterator) model**, a query plan is a tree of operators (scan, filter, project, join, aggregate), each exposing next(); every call returns *one tuple* to its parent. Control flow ping-pongs down and up the tree once per row: for N rows through k operators, ≈ N·k virtual next() calls, each paying function-call overhead, branch misprediction, and per-tuple interpretation (examining types, offsets, expression trees) — while touching row-shaped memory that defeats the columnar layout's cache behavior.\n\nIn the **vectorized model**, next() returns a **batch of ~1,000–10,000 values per column** (a 'vector'), sized so the working batch fits in the CPU's L1/L2 cache. Each operator runs a tight loop (a 'primitive') over the batch — e.g., multiply two float vectors, compare a vector against a constant producing a selection bitmap — with the interpretation overhead paid **once per batch instead of once per value**. The loops are branch-light and contiguous, which is exactly the shape compilers auto-vectorize into SIMD instructions processing 4–16 values per instruction, and exactly the shape that streams through caches at memory bandwidth. (The main alternative, whole-query compilation to native code, attacks the same overhead differently; hybrid engines exist, and the analysis below covers both.)"
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The amortization bound",
              "statement": "Model per-value processing cost as o + w, where w is the useful work (the multiply, the compare) and o the per-call interpretation overhead. Tuple-at-a-time costs N(o + w). Vectorized execution with batch size B pays the overhead once per batch: N(o/B + w). The speedup is\n\nS(B) = (o + w) / (o/B + w),\n\nwhich increases monotonically in B toward the ceiling S(∞) = 1 + o/w. Consequences: (i) when overhead dominates useful work (o ≫ w — the analytical reality: o is tens of nanoseconds of call/branch/dispatch machinery, w a couple of nanoseconds of ALU), the attainable speedup is roughly o/w — one to two orders of magnitude; (ii) most of the ceiling is reached at modest B (B = o/w already yields half the ceiling... precisely S(o/w) = (o+w)/(2w) ≈ half of 1 + o/w), which is why engines use thousands-not-millions batches that fit in cache — past that, growing B buys little and costs cache locality, so real curves peak and then *decline*.",
              "proof": "Total tuple-at-a-time cost: each of N values pays interpretation and work: N(o + w). Vectorized: each batch of B values pays one interpretation o for the primitive dispatch plus B·w work; per value: o/B + w; total N(o/B + w). Ratio gives S(B); dS/dB > 0 and lim_{B→∞} S = (o + w)/w = 1 + o/w. For (ii): substitute B = o/w: S = (o + w)/(w + w) = (o + w)/2w, which is half of (o + w)/w. The empirical decline past cache-sized B is outside this simple model — it enters when the batch's working set exceeds L2, adding a memory-stall term m(B) to the denominator that grows with B; the model's ceiling is then never reached, and the optimum sits where o/B's decrease equals m(B)'s increase — in practice a few thousand values. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: SUM(quantity × unit_price), both ways",
              "body": "Run the revenue kernel over one pruned quarter — N = 10 M order lines — with realistic constants: interpretation overhead o = 40 ns per value per operator hop (function call + branch misses + expression-tree walk; classical engines measure 100–700 instructions per tuple, so 40 ns at 4 GHz is *charitable*), useful work w = 2 ns (a multiply-add on cached values).\n\n**Tuple-at-a-time**: 10 M × (40 + 2) ns = **420 ms** per operator hop — and the value passes through scan → filter → project → aggregate, so several hops: ~1.3–1.7 s of pure CPU. This is why the 100 MB read finished instantly and the query still took seconds.\n\n**Vectorized**, B = 2,048: per value 40/2048 + 2 ≈ 2.02 ns; the whole pipeline of 4 primitives ≈ 10 M × 8.1 ns ≈ **81 ms**. Speedup per the proposition: S = 42/2.02 ≈ **21×**, near the o/w ceiling.\n\n**With SIMD**: the multiply-add primitive on contiguous 8-byte values processes 8 values per AVX-512 instruction; w falls toward 0.4 ns, and the kernel approaches memory bandwidth — the 80 MB of the two referenced column vectors stream at ~20 GB/s: ~4 ms. At that point the engine is limited by RAM, not code — the honest end state of execution engineering, and the reason unit 2's compression was a *speed* feature: fewer bytes through the memory bus is now directly fewer milliseconds."
            },
            {
              "type": "code",
              "heading": "What a vectorized primitive actually looks like",
              "lang": "text",
              "code": "// Tuple-at-a-time (per row: dispatch, branch, interpret, repeat)\nwhile ((t = child.next()) != EOF) {\n  if (eval_predicate(t, pred_tree))       // walks an expression tree — per row!\n    emit(project(t, exprs));              // virtual calls all the way down\n}\n\n// Vectorized (per batch of 2048: one dispatch, then tight loops)\nbatch = child.next_batch();                    // {qty[2048], price[2048], sel}\nmul_f64(batch.qty, batch.price, out.rev);      // SIMD: 8 lanes/instruction\nsum_f64_selected(out.rev, batch.sel, &acc);    // no branches: bitmap-masked add\n\n// The dictionary trick from unit 2, now in execution form:\n// filter category = 'Succulents'  ⇒  compare INDICES against one code —\n// an int-vs-int SIMD compare over the bit-packed column, no strings touched."
            },
            {
              "type": "text",
              "heading": "Late materialization and compressed execution, revisited as engine features",
              "body": "Two unit-2 ideas complete the picture, now from the engine's side. **Late materialization**: the engine keeps data columnar *through* the operators — filters produce selection bitmaps over positions, not copied rows; joins carry (position, key) pairs; full rows are assembled only at the final output. Every operator that can work on positions instead of materialized tuples keeps the batch small, cache-resident, and SIMD-able — Abadi et al. measured late materialization alone worth ~3× in column-store execution, independent of I/O.\n\n**Execution on compressed data**: the filter in the code block above never decoded a string — it compared dictionary codes; a run-length column aggregates by multiplying run values by run lengths (unit 2's COUNT trick, generalized: SUM over RLE = Σ value×length). The general principle: **decode as late as possible, ideally never**, because decoding both costs CPU and *inflates* the bytes that must fit through the cache hierarchy. The engine's dream query touches only dictionary codes, run headers, and positions — integers end to end — and materializes twelve output rows at the very last step. When unit 5 shows Snowflake's engine and unit 6 shows Databricks Photon advertising 'vectorized engine over compressed columnar data', you now possess the entire content of the claim: batched primitives (this lesson) over the encodings of unit 2, deferring materialization."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**Why this matters to a data engineer who will never write an engine.** Three practical reflexes fall out. (1) Row-shaped work is poison in analytical SQL: a scalar UDF (Python or JavaScript per row) forces the engine back to tuple-at-a-time for that expression — the 20× reappears as a 20× *slowdown*; prefer native SQL expressions or vectorized/batch UDF APIs. (2) SELECT * defeats late materialization: forcing all columns to materialize turns a positions-pipeline into a row factory (and, per unit 1, inflates I/O first). (3) High-cardinality GROUP BY and DISTINCT are expensive not because of I/O but because their hash tables outgrow cache — the same working-set logic as batch sizing, which is why approximate variants (unit 9) exist."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "A single core now runs the star pattern at hardware speed: batched primitives amortize interpretation to o/B (the 21× of the proposition), SIMD and cache residency push useful work toward memory bandwidth, and late materialization plus compressed execution keep the pipeline in small integers until the last moment. The Monday quarter kernel fell from ~1.5 s of interpreted CPU to milliseconds. But we cheated once: we said 'one pruned quarter — 10 M rows' as if pruning were free and given. Which blocks does the engine *not read at all*, and what does that depend on? That is the zone-map arithmetic — the second lever, and the one data engineers control most directly through layout."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "With o = 60 ns and w = 3 ns: compute the vectorized speedup at B = 1,024, the theoretical ceiling, and the batch size at which half the ceiling is reached. Then explain in one sentence why B = 10,000,000 would be slower than B = 4,096 despite the formula's monotonicity.",
                  "solution": "S(1024) = (60+3)/(60/1024 + 3) = 63/3.059 ≈ 20.6×. Ceiling: 1 + o/w = 21×. Half the ceiling at B = o/w = 20 (S = 63/6 = 10.5×) — tiny, which is why thousands suffice. B = 10 M makes each batch's working set (tens of MB per column vector) overflow L2/L3, adding memory-stall time per value that the model's o/B term can't compensate — real curves peak at cache-sized batches and decline.",
                  "hint": "Plug into S(B); ceiling is 1 + o/w; half-ceiling at B = o/w; then think about where the batch lives."
                },
                {
                  "prompt": "A pipeline computes `SELECT SUM(net) FROM fact WHERE status_code = 4` over an RLE-encoded status column (1.2 M runs over 600 M rows) and a raw net column. Describe the late-materialized execution — what is compared, what is summed, what is never done — and estimate the operation count versus a naive decode-everything execution.",
                  "solution": "Execution: stream the 1.2 M (code, length, start_position) runs; for runs with code = 4, mark position ranges (selection ranges); sum net over exactly those ranges (SIMD over contiguous spans). Compared: 1.2 M run codes vs one constant. Summed: only net values inside matching ranges. Never done: expanding status to 600 M values, materializing any (status, net) tuples. Operation count: ~1.2 M compares + additions over the matching net values (say f·600 M) versus naive: 600 M decode-writes + 600 M compares + f·600 M additions — roughly (600 M + 600 M)/(1.2 M) ≈ 500× less overhead work before the unavoidable summing, which both must do.",
                  "hint": "Runs are compared wholesale; only matching spans of net are ever touched."
                },
                {
                  "prompt": "An analyst wraps a currency conversion in a per-row Python UDF: `SELECT SUM(py_to_usd(net, currency)) …` over 200 M rows, and the query that took 1.4 s now takes 95 s. Using the amortization model, explain where the time went (assume the UDF costs ~450 ns/row of interpreter and boundary overhead), and give two remediations with their expected effect.",
                  "solution": "The UDF forces tuple-at-a-time across the engine/Python boundary for that expression: added cost ≈ 200 M × 450 ns ≈ 90 s — matching the regression almost exactly; the engine's vectorized primitives (o/B ≈ 0) were replaced by o = 450 ns per value with B = 1. Remediations: (1) express the conversion natively (JOIN to a rates dimension and multiply — a vectorized hash join + mul primitive): restores ~1.4 s + a cheap join; (2) if code is unavoidable, use the platform's vectorized/batch UDF interface (Arrow batches in, batches out), which restores the o/B amortization — typically within 2–5× of native rather than 70×.",
                  "hint": "B collapsed to 1 and o exploded; compute 200 M × 450 ns."
                },
                {
                  "prompt": "True, false, or it-depends, with one-sentence justifications grounded in this lesson: (a) 'Analytical engines are I/O-bound, so CPU optimizations are marginal'; (b) 'SIMD is why column stores beat row stores'; (c) 'Bigger batches are always better'; (d) 'Compression slows queries because of decode cost'.",
                  "solution": "(a) False post-columnar: once formats cut I/O (unit 2), interpretation overhead dominates — that's the entire motivation for vectorization. (b) Overstated: columnar wins first on I/O (unit 1) and cache/amortization; SIMD is an *enabled bonus* — contiguous same-type values are what make SIMD applicable at all. (c) False: S(B) is monotone only in a model without memory stalls; batches must fit in cache, so engines choose thousands, not millions. (d) It-depends, mostly false: lightweight encodings execute *without* decoding (codes, runs) and reduce bytes through the memory bus — a speedup; heavy general-purpose codecs (zstd high levels) do add a real decode pass — the unit-2 caveat.",
                  "hint": "Each statement is a half-truth; locate the missing half."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u4l1-i1",
              "front": "Volcano model vs vectorized model — the one-line contrast",
              "back": "Volcano: next() returns one tuple; interpretation overhead paid N·k times. Vectorized: next() returns cache-sized batches (~1k–10k values/column); overhead paid once per batch, primitives run tight SIMD-able loops."
            },
            {
              "id": "u4l1-i2",
              "front": "Vectorization speedup formula and ceiling",
              "back": "S(B) = (o+w)/(o/B+w) → ceiling 1 + o/w as B→∞; half the ceiling already at B = o/w. o = per-value interpretation overhead, w = useful work."
            },
            {
              "id": "u4l1-i3",
              "front": "Why are batches sized in the thousands, not millions?",
              "back": "The batch's column vectors must fit in L1/L2; beyond cache size, memory stalls add per-value cost the o/B savings can't offset — real speedup curves peak then decline."
            },
            {
              "id": "u4l1-i4",
              "front": "Late materialization at execution time",
              "back": "Filters emit position bitmaps, joins carry positions/keys, rows are assembled only at output — keeping batches small, cached, and SIMD-able (~3× on its own per Abadi et al.)."
            },
            {
              "id": "u4l1-i5",
              "front": "Why does a per-row scalar UDF devastate an analytical query?",
              "back": "It forces B = 1 with a huge o (interpreter + boundary crossing) for that expression — the amortization bound in reverse. Fix: native expressions or vectorized batch UDF APIs."
            },
            {
              "id": "u4l1-i6",
              "front": "After columnar formats fixed I/O, what is the analytical bottleneck and the end state of a well-tuned kernel?",
              "back": "CPU interpretation overhead; the tuned end state is memory-bandwidth-bound — which makes compression a *speed* feature (fewer bytes through the bus)."
            }
          ]
        },
        {
          "id": "u4l2",
          "title": "Pruning: Zone Maps, Sort Order, and Clustering",
          "estMinutes": 28,
          "builds_on": [
            "u2l3",
            "u4l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The fastest read is the one that never happens",
              "body": "*Vectorized Execution* made the engine fast per byte; this lesson is about reading fewer bytes — ideally none. Unit 2 planted the mechanism inside Parquet's footer: per-block **min/max statistics**, consulted before reading, skipping any block whose range cannot contain a match. Every serious platform runs on some version of this — Parquet row-group and page statistics, Snowflake's per-micro-partition metadata (unit 5), Delta and Iceberg's per-file column stats (unit 6), Redshift and DuckDB zone maps — and every platform's documentation quietly adds the same caveat, which this lesson promotes to a theorem: **the statistics are only as good as the layout is ordered**. Metadata does not prune; *correlation between physical position and predicate columns* prunes, and metadata merely reveals it. A data engineer controls that correlation through sort and clustering decisions — making this the highest-leverage performance lever you own that requires no new hardware and no engine settings: the same bytes, rearranged, can turn a full scan into a three-block read."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Zone maps and pruning",
              "statement": "Partition a table's rows into **blocks** (row groups, micro-partitions, files) of ~n rows each, B blocks total. A **zone map** stores, per block and per column, summary statistics — at minimum min and max values, typically also null count and distinct estimates. Given a predicate p over column c, a block whose zone [min_c, max_c] is disjoint from p's satisfying set **cannot contain a match** and is skipped without I/O ('pruned'); blocks whose zones intersect p must be read (the zone is a necessary, not sufficient, condition — false positives are filtered by the scan; false negatives are impossible, which is what makes pruning safe).\n\nThe **pruning ratio** of a query is (blocks skipped)/B. It is determined jointly by p's selectivity *and* the table's **clustering** with respect to c — how concentrated c's values are in physical position. Perfectly clustered (sorted by c): each value range occupies few blocks. Uncorrelated (random order): every block's zone spans nearly c's full range, and nothing prunes regardless of how selective p is."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Pruning is layout, not metadata",
              "statement": "Let a range predicate match fraction f of a table's N rows, stored in B blocks of n = N/B rows.\n\n(a) **Sorted layout** (rows ordered by the predicate column): the matching rows form one contiguous run of f·N rows, which intersects at most ⌈f·B⌉ + 1 blocks; the pruning ratio is at least 1 − (f·B + 1)/B → 1 − f for large B. I/O is proportional to the *answer size*, not the table size.\n\n(b) **Uncorrelated layout** (row order independent of the column): a block contains no matching row with probability (1 − f)ⁿ ≈ e^{−f·n}, so the expected fraction of blocks that must be read is 1 − e^{−f·n}. Since blocks are large (n in the 10⁵–10⁷ range), even extreme selectivity prunes nothing: f = 10⁻⁴ with n = 10⁶ gives e^{−100} ≈ 0 — **every block is read to return 0.01% of the rows**.",
              "proof": "(a) Sorted by c, the rows satisfying a range predicate on c are consecutive in position (any row between two matches also matches, by monotonicity of the order and the interval structure of the predicate's satisfying set). A run of f·N consecutive rows spans at most ⌈f·N/n⌉ + 1 = ⌈f·B⌉ + 1 blocks (the +1 for straddling a boundary). All other blocks' zones lie entirely below or above the range and prune.\n\n(b) Under independence of position and value, each of a block's n rows matches with probability f independently (to first order); the block has zero matches with probability (1−f)ⁿ = e^{n·ln(1−f)} ≈ e^{−f·n} for small f. A block with ≥ 1 match has a zone intersecting the predicate and must be read; expected read fraction = 1 − (1−f)ⁿ. Monotonicity in n gives the design corollary: bigger blocks make uncorrelated pruning *worse* — with n = 10⁶, any predicate matching more than a few per million rows touches essentially all blocks. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: the quarter query's three-block read",
              "body": "Numbers for Trellis's analytical zone: fact_order_line, N = 40 M rows in B = 40 row groups of n = 1 M, files written **sorted by order_ts** (the compaction job's sort, chosen in unit 2). The Monday query filters to the last quarter: f = 0.25.\n\n**Sorted (actual)**: matches are one run of 10 M rows → at most ⌈0.25 × 40⌉ + 1 = **11 blocks read**, 29 pruned (72.5%). A dashboard's narrower filter — last week, f ≈ 0.02 — reads ⌈0.8⌉ + 1 = **2 blocks**: I/O proportional to the answer, exactly clause (a).\n\n**Random (counterfactual)**: expected read fraction 1 − e^{−0.25 × 1,000,000} = 1 − e^{−250,000} — indistinguishable from 100%: all 40 blocks. Even the week query (f = 0.02, f·n = 20,000) reads everything. Identical bytes, identical metadata, identical engine — the *order* alone is a 20× I/O difference for the week query.\n\nNow the second predicate: `AND p.category = 'Succulents'`. Category lives in dim_product, but even flattened onto the fact, category values are *interleaved through time* (people buy succulents every day): with respect to category, the time-sorted layout is uncorrelated — clause (b) — and category prunes nothing. One table has one order; every column not correlated with it rides for free or not at all. Choosing *which* column deserves the order is therefore a workload decision: Trellis sorts by order_ts because virtually every query filters time, and lets category filtering ride on time pruning plus late-materialized dictionary compares (lesson 1)."
            },
            {
              "type": "example",
              "heading": "Worked example: compound keys and the cardinality ladder",
              "body": "Ops adds a heavy workload: per-warehouse daily pick reports, filtering `warehouse_id = W AND order_ts in day`. Candidate sort keys for the analytical files:\n\n**(order_ts)** — the day filter prunes to ~1 block-equivalent per day, but all three warehouses' rows interleave inside it: warehouse prunes nothing further. Reads ≈ day's volume.\n\n**(warehouse_id, order_ts)** — rows partition into 3 runs, each internally time-sorted: the predicate prunes to *one warehouse's one day* ≈ a third of the previous read. Generally: sort by the low-cardinality equality-filtered column first, then the range column — each prefix value gets its own contiguous, internally-sorted segment, and zones on *both* columns become tight.\n\n**(order_ts, warehouse_id)** — nearly useless for warehouse pruning: within a day-run, warehouse alternates rapidly, so every block's warehouse zone spans {1,2,3}. Sort-key order is not commutative: **equality prefixes, then ranges** is the working rule (mirroring composite B-tree index design, for the same geometric reason).\n\nThe rule's limit is the cardinality ladder: prefixing by a *high*-cardinality column (customer_id, 4 M values) shatters the table into 4 M tiny runs — the time column's runs become sub-block-sized, its zones widen to uselessness, and you have effectively randomized every other column (and recreated unit 2's small-segments pathology logically). Low-cardinality prefixes are cheap; each level of the key must earn its place against the columns below it."
            },
            {
              "type": "text",
              "heading": "Clustering as a maintained property: from sort to OPTIMIZE",
              "body": "A one-time sort decays. Tonight's compaction writes today's rows time-sorted — but *today's* file overlaps nothing, while a backfill, a late-arriving batch, or streaming ingest (unit 8) writes files whose ranges straddle old ones; after months, the min/max ranges of files overlap so much that a day-filter matches dozens of files again. Platforms therefore treat clustering as a *maintained, approximate* property with a measurable health metric — overlap depth (how many blocks' zones cover an average value; Snowflake reports exactly this as clustering depth, unit 5) — and a repair action: periodically **re-cluster** the worst regions (Delta's OPTIMIZE ZORDER, Snowflake automatic clustering, unit 5–6) rather than globally re-sorting, since a global re-sort of a growing table is O(table) forever.\n\nOne more tool for the multi-column bind: when two query families each demand a different sort (time-range queries versus customer-equality queries) and neither can be prefix — **space-filling curves** (Z-order/Hilbert) interleave the bits of several columns so that each column is *partially* clustered: no column gets sorted-quality pruning, every indexed column gets substantial pruning, and the e^{−fn} disaster is avoided for all of them. It is a compromise with real math behind it, not magic: Z-ordering k columns gives each roughly the pruning power of a sort on a table B^{1/k} the size. Use it when workloads genuinely split; use plain compound sort when one family dominates — and record the decision, because clustering keys are the schema of the physical layer."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**High-cardinality partitioning is the anti-pattern that will not die.** Unit 2 banned `user_id=` directory partitioning for file-count reasons; the zone-map math adds the deeper reason: partitioning and sorting spend the same budget — physical order — and a high-cardinality key spends all of it on one column that equality-hits once per query, while destroying the correlation every other predicate needed. Partition (directories) by the coarse, always-filtered, low-cardinality dimension — almost always **date** — and cluster (sort within files) by the next one or two workload columns. If you find yourself partitioning by something with more than ~10⁴ values, you are usually re-implementing an index badly; what you want is clustering plus zone maps, or (unit 9) a serving system designed for point lookups."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Pruning now has laws instead of lore. Zone maps skip blocks whose ranges exclude the predicate — safely, because zones give necessary conditions — but the skipping is entirely a function of layout: sorted order reads ⌈fB⌉+1 blocks (answer-proportional I/O), uncorrelated order reads ≈ B·(1−e^{−fn}) (everything, for any realistic block size), compound keys follow the equality-then-range rule, cardinality caps the ladder, clustering decays and must be maintained, and Z-order splits the budget when workloads do. Combined with lesson 1, a single machine now executes the star pattern near its physical floor: read almost nothing, process it at memory bandwidth. What a single machine cannot do is hold the whole problem: 40 M rows fit on a laptop, but Trellis's clickstream (unit 6) will not, and the join of fact to a 4-million-row dimension is about to stop fitting in one memory. Distributing the scan is easy; distributing the *join* is where the third lesson earns its place."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A 12-billion-row events table sits in B = 6,000 blocks of n = 2 M rows. Query: one hour of data, f = 1/720 (a month retained). Compute blocks read if sorted by event_ts, and the expected fraction read if the layout is uncorrelated with time. State each result's regime from the proposition.",
                  "solution": "Sorted: ⌈f·B⌉ + 1 = ⌈8.33⌉ + 1 = 10 blocks (≈ 0.17% of blocks) — clause (a), answer-proportional I/O. Uncorrelated: f·n = 2,000,000/720 ≈ 2,778 ⇒ read fraction 1 − e^{−2778} ≈ 100% — all 6,000 blocks, clause (b): with million-row blocks, even 0.14% selectivity finds a match in every block. Layout is worth ~600× here.",
                  "hint": "⌈fB⌉+1 versus 1 − e^{−fn}; compute fn first."
                },
                {
                  "prompt": "Choose and justify a sort/cluster key for each workload (one table each): (a) IoT readings queried 95% by `device_type` (12 values) + time range; (b) orders queried half by time range only, half by `customer_id` equality (4 M values) + time; (c) a fraud table queried by `amount > threshold` over all time.",
                  "solution": "(a) (device_type, event_ts): low-cardinality equality prefix then range — each of 12 segments internally time-sorted; both predicates prune (the compound-key rule's ideal case). (b) The bind: customer_id can't prefix (4 M values shatters time clustering; each customer's rows are tiny). Options: sort by event_ts and let customer queries ride time pruning only (bad if they span years), or Z-order (order_ts, customer_id) — both families get partial pruning; with the 50/50 split stated, Z-order is defensible; if customer queries are latency-critical point-lookups, the honest answer is a serving copy keyed by customer (unit 9), not layout contortions. (c) amount is the only filter: sort by amount — range predicates on the sort column prune per clause (a); time-sorted layout would leave amount uncorrelated (clause b) and read everything.",
                  "hint": "Equality-prefix cardinality; who gets the one order; when to stop fighting and add a serving copy."
                },
                {
                  "prompt": "A table sorted by order_ts at creation has, eight months later, average 'overlap depth' 25 on order_ts (a typical date's value range is covered by 25 files' zones) because backfills and late loads wrote straddling files. A one-day query that used to read 2 files now reads ~25. Explain the decay mechanism, why re-sorting the whole table is the wrong fix, and what the right maintenance loop is.",
                  "solution": "Mechanism: new files are internally sorted but their [min,max] ranges overlap historical ranges (late data, backfills), so a point in time is covered by many files' zones — pruning degrades from 'few blocks per range' toward 'depth × few'. Global re-sort is O(entire table) rewrite, repeatedly, on an ever-growing table — cost grows without bound and races ingestion. Right loop: monitor overlap depth per partition/region; re-cluster *incrementally* — rewrite only the worst-overlapping file sets (OPTIMIZE/auto-clustering) — bounding work to the decayed regions; schedule it with ingestion patterns (after backfill windows), and keep new writes partition-aligned (dt=) so decay is localized within partitions rather than global.",
                  "hint": "New files are sorted internally but overlap externally; fix the overlap, not the universe."
                },
                {
                  "prompt": "Prove the design corollary from clause (b): for uncorrelated layouts, increasing block size n strictly increases the expected fraction of blocks read for any fixed 0 < f < 1 — then reconcile this with unit 2's rule that small files are poison. What actually resolves the tension?",
                  "solution": "Expected read fraction is g(n) = 1 − (1−f)ⁿ; since 0 < 1−f < 1, (1−f)ⁿ is strictly decreasing in n, so g is strictly increasing — bigger blocks, more reading, for uncorrelated data. ∎ Reconciliation: unit 2's rule addresses per-object *fixed costs* (requests, footers, planning) which favor large files; this clause addresses *pruning granularity* which favors small blocks — but only on uncorrelated layouts. The resolution is correlation, not size: sort/cluster so clause (a) applies, where block count barely matters (⌈fB⌉+1 scales with the answer), then choose large files for the request economics. Formats split the difference structurally: big files (request amortization) containing smaller internal statistics units — row groups and pages — so pruning granularity and object granularity are decoupled.",
                  "hint": "Differentiate (1−f)ⁿ in n; then notice the two rules optimize different cost terms, and sorted layout makes one of them moot."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u4l2-i1",
              "front": "Zone map — what it stores and the safety property of pruning",
              "back": "Per block per column: min/max (+ null/distinct counts). A block whose range is disjoint from the predicate is skipped; zones are necessary conditions, so false skips are impossible — pruning is always safe, just not always effective."
            },
            {
              "id": "u4l2-i2",
              "front": "The two pruning regimes (sorted vs uncorrelated) — formulas",
              "back": "Sorted by predicate column: ≤ ⌈fB⌉+1 blocks read (answer-proportional). Uncorrelated: expected fraction 1 − e^{−fn} ≈ 1 for realistic block sizes — metadata prunes nothing without layout correlation."
            },
            {
              "id": "u4l2-i3",
              "front": "Compound sort-key rule and its limit",
              "back": "Equality-filtered low-cardinality columns first, then the range column — each prefix value becomes a contiguous internally-sorted segment. Limit: high-cardinality prefixes shatter runs and randomize every later column."
            },
            {
              "id": "u4l2-i4",
              "front": "Clustering decay — cause, metric, and cure",
              "back": "Late/backfill files overlap old ranges; measured as overlap depth (files covering an average value); cured by incremental re-clustering of the worst regions (OPTIMIZE / auto-clustering), never repeated global re-sorts."
            },
            {
              "id": "u4l2-i5",
              "front": "When is Z-order (space-filling curve) clustering the right call?",
              "back": "Two+ query families each filtering different columns, none dominant and none prefix-able: each Z-ordered column gets partial pruning (≈ sort-quality on a table B^{1/k} the size) instead of one winner and losers."
            },
            {
              "id": "u4l2-i6",
              "front": "Partition vs cluster — how to split the physical-order budget",
              "back": "Partition directories by the coarse always-filtered low-cardinality key (date); cluster within files by the next 1–2 workload columns. High-cardinality partitioning spends the whole budget on one column and recreates small-files pathology."
            }
          ]
        },
        {
          "id": "u4l3",
          "title": "Distributed Execution: Scatter, Shuffle, and the Join Decision",
          "estMinutes": 29,
          "builds_on": [
            "u4l1",
            "u4l2",
            "u3l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "When one machine stops being enough",
              "body": "*Vectorized Execution* and *Pruning* took a single machine to its physical floor — and for a surprising number of companies, that floor is the finish line: 40 M rows is laptop-scale in 2026, and 'just use one big machine' is underrated. But Trellis's clickstream runs 2,000 events/second (unit 2's compaction exercise) — 60+ billion rows a year — and the market's answer to tables that outgrow one machine is **massively parallel processing (MPP)**: W workers, each holding (or, in unit 5's cloud architecture, each *reading*) a slice of the data, executing the same plan on their slice, exchanging data only where the computation logically requires it. The engineering content of this lesson is exactly that last clause. Scans and filters distribute for free; aggregations distribute with one cheap trick; **joins** are where data must move between machines — and choosing *how it moves* (broadcast the small table, or shuffle both) is the single most consequential decision a distributed planner makes. Get it right and the star join is nearly free; get it wrong and the network becomes the bottleneck unit 1 thought the disk was."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "MPP, partial aggregation, broadcast and shuffle joins",
              "statement": "An **MPP engine** executes a query as a DAG of plan **fragments** over W workers. Data-parallel fragments (scan, filter, project, pre-aggregate) run independently per worker on its slice. Where an operation needs rows grouped by a key that the current placement doesn't respect, workers **exchange** data: a **shuffle** (repartition) routes each row to the worker owning hash(key) mod W, so all rows with equal keys land together.\n\n**Partial (two-phase) aggregation**: for GROUP BY, each worker first aggregates its local slice (partial state per group), then shuffles only the *partial states* by group key for final merge — network bytes scale with (workers × groups), not with rows. Legitimate for any decomposable aggregate (SUM, COUNT, MIN/MAX; AVG as SUM+COUNT; approximate distinct via mergeable sketches).\n\n**Join strategies**: a **broadcast (replicated) join** copies the entire small table to every worker (network ≈ (W−1)·|D|), letting each worker join its fact slice locally with no fact movement. A **shuffle (repartition) join** hash-partitions *both* inputs on the join key (network ≈ |F| + |D|, since nearly every row crosses the wire once), then joins co-partitioned slices locally."
            },
            {
              "type": "diagram",
              "kind": "sequence",
              "caption": "The Monday query on 3 workers: local pruned scans and partial aggregation, one small shuffle of partial states, gather at the coordinator.",
              "actors": [
                "Coordinator",
                "W1",
                "W2",
                "W3"
              ],
              "messages": [
                {
                  "from": "Coordinator",
                  "to": "W1",
                  "label": "fragment: scan+filter+partial agg",
                  "tone": "sage"
                },
                {
                  "from": "Coordinator",
                  "to": "W2",
                  "label": "fragment (same plan)",
                  "tone": "sage"
                },
                {
                  "from": "Coordinator",
                  "to": "W3",
                  "label": "fragment (same plan)",
                  "tone": "sage"
                },
                {
                  "from": "W1",
                  "to": "W1",
                  "label": "prune → vectorized scan → partial SUM by (week,cat)",
                  "dashed": true
                },
                {
                  "from": "W2",
                  "to": "W2",
                  "label": "local partial aggregation",
                  "dashed": true
                },
                {
                  "from": "W3",
                  "to": "W3",
                  "label": "local partial aggregation",
                  "dashed": true
                },
                {
                  "note": "shuffle partial states by group key — KBs, not GBs"
                },
                {
                  "from": "W1",
                  "to": "W2",
                  "label": "states for keys hashing to W2"
                },
                {
                  "from": "W3",
                  "to": "W2",
                  "label": "states for keys hashing to W2"
                },
                {
                  "from": "W2",
                  "to": "W1",
                  "label": "states for keys hashing to W1"
                },
                {
                  "from": "W1",
                  "to": "Coordinator",
                  "label": "final groups (slice)",
                  "tone": "gold"
                },
                {
                  "from": "W2",
                  "to": "Coordinator",
                  "label": "final groups (slice)",
                  "tone": "gold"
                },
                {
                  "from": "W3",
                  "to": "Coordinator",
                  "label": "final groups (slice)",
                  "tone": "gold"
                }
              ]
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The broadcast–shuffle crossover",
              "statement": "Let a join move |F| bytes of (projected, filtered) fact and |D| bytes of (projected) dimension across W workers, with per-byte network cost uniform. Broadcast costs ≈ (W−1)·|D|; shuffle costs ≈ (1 − 1/W)(|F| + |D|) ≈ |F| + |D|. Broadcasting the dimension is cheaper exactly when\n\n(W−1)·|D| < (1 − 1/W)(|F| + |D|), i.e., approximately |D| < |F| / W.\n\nCorollaries: (i) tiny dimensions (unit 3's wide-and-short) broadcast at any realistic scale — the star schema's shape is *why* star joins distribute well; (ii) the decision degrades with W: a dimension worth broadcasting on 8 workers may not be on 80 — cluster resizing (unit 5) silently flips join plans; (iii) both |F| and |D| mean bytes *after* projection and filter pushdown, so the decision belongs to the optimizer's estimates — and stale statistics flip it wrongly, the root of a large fraction of real-world slow queries.",
              "proof": "Broadcast: the dimension must reach W−1 workers that don't hold it: (W−1)·|D| bytes; the fact never moves. Shuffle: each row of both inputs is routed to the worker owning its key's hash; a row already resides at its target with probability 1/W, so expected movement is (1−1/W)(|F|+|D|). Setting (W−1)|D| < (1−1/W)(|F|+|D|) and multiplying both sides by W/(W−1): W·|D| < |F| + |D|, i.e., |D| < |F|/(W−1) ≈ |F|/W for large W. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: Trellis's two joins, priced",
              "body": "The Monday query joins the pruned quarter of fact_order_line to dim_product and dim_customer on a W = 16 cluster. Projected sizes (only needed columns, per the optimizer): fact slice |F| ≈ 10 M rows × 24 B ≈ **240 MB**; dim_product |D₁| ≈ 10 k rows × 20 B ≈ **200 KB**; dim_customer |D₂| ≈ 4 M rows × 12 B (key + customer_type) ≈ **48 MB**.\n\n**dim_product**: broadcast cost 15 × 200 KB = 3 MB versus shuffle ≈ 240 MB — broadcast, by 80×; corollary (i) in action: the small dimension replicates everywhere and the fact never moves.\n\n**dim_customer**: broadcast 15 × 48 MB = 720 MB versus shuffle ≈ (240 + 48) × 15/16 ≈ 270 MB — **shuffle wins**, by ~2.7×; |D₂| = 48 MB exceeds |F|/W = 15 MB, confirming the crossover. The plan: broadcast-join product locally during the scan (it also enables *pruning*: the category filter turns into a product_key list pushed into the fact scan — join pushdown meeting lesson 2), then shuffle the surviving rows and dim_customer by customer_key for the second join, then two-phase aggregate.\n\nNow re-run at W = 64 (someone scaled up for month-end): |F|/W = 3.75 MB < 48 MB — still shuffle for customers, but note dim_product's broadcast cost grew 4×: 63 × 200 KB = 12.6 MB, still trivial. The lesson generalizes: growing the cluster makes broadcasts *more* expensive and shuffles *cheaper per worker* — corollary (ii) — one of several reasons throwing workers at a query can slow it down."
            },
            {
              "type": "example",
              "heading": "Worked example: skew, the shuffle's failure mode",
              "body": "Shuffle's cost model assumed hash(key) spreads rows evenly. Reality: Trellis's marketplace channel sells one viral product — SKU P-2201, 18% of all order lines this quarter. A shuffle join on product_key routes *every* P-2201 row to one worker: 15 workers finish their slices in seconds; worker 11 receives 1.8 M of 10 M rows and grinds for minutes while the cluster waits. The query's latency is the *maximum* over workers, not the mean — skew converts parallelism into queueing.\n\nDiagnosis is mechanical (per-worker rows processed in the query profile: 15 bars level, one tower). Remedies, in order of preference: **(1) broadcast instead** — P-2201's problem vanishes if the *dimension* moves and fact rows never do; the optimizer chooses this automatically when |D| is small, which is why skew bites mostly on large-dimension or fact-to-fact joins. **(2) Salting**: split the hot key into k sub-keys (append hash(row) mod k to P-2201's key on the fact side; replicate P-2201's dimension row k times, once per salt) — the hot partition splits across k workers at the cost of k copies of one dimension row. **(3) Skew hints / adaptive execution**: modern engines detect hot keys at runtime and switch strategy per-key (broadcast the hot keys' dimension rows, shuffle the rest) — Spark's AQE and Snowflake's engine both do versions of this (units 5–6). What no remedy fixes: skew in the *group-by* key of a final aggregation with holistic functions — which is why percentile-exact-over-everything queries stay slow and unit 9's sketches exist."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**Read a distributed plan like a bill.** EXPLAIN output across engines reduces to four line items you can now price: bytes scanned (lesson 2: pruning × projection), bytes shuffled (this lesson: join strategy + partial-agg placement), peak partition size (skew), and rows through each vectorized fragment (lesson 1). When a query is slow, the profile tells you which item blew up — scanned means layout/clustering work, shuffled means join strategy or missing pre-aggregation, one-tall-bar means skew — and each has a named fix from this unit. Slow queries stop being mysteries and become itemized invoices."
            },
            {
              "type": "text",
              "heading": "What is now established — and the bridge to the platforms",
              "body": "The full execution stack is now assembled, one lever per lesson: vectorized primitives process bytes at memory speed; zone maps over deliberate layout ensure most bytes are never read; and distribution scatters the scan, two-phases the aggregation, and prices every join at the broadcast–shuffle crossover with skew as the tax on hot keys. The star schema turns out to be co-designed with all three: narrow facts scan and prune well, wide-short dimensions broadcast well, additive measures two-phase well. What this unit deliberately ignored is *where the workers' data lives*. Classic MPP warehouses (Teradata, early Redshift) bolted storage to workers — each machine owned its slice on local disk — which made resizing a data migration and idle clusters a sunk cost. The cloud's object store (unit 2) broke that coupling: stateless compute reading shared storage, caches instead of ownership, and suddenly a warehouse can be sized per query and billed per second. That architecture — separation of storage and compute, and everything Snowflake built on it — is unit 5."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "W = 32 workers; projected fact |F| = 1.6 GB; three dimensions after projection: dim_channel 200 B, dim_promotion 45 KB, dim_customer 220 MB. Decide broadcast vs shuffle for each via the crossover, showing the arithmetic, and state the full plan's total network bytes.",
                  "solution": "Threshold |F|/W = 50 MB. dim_channel (200 B) and dim_promotion (45 KB): broadcast — costs 31×200 B ≈ 6 KB and 31×45 KB ≈ 1.4 MB, both ≪ shuffle's ~1.6 GB. dim_customer (220 MB > 50 MB): shuffle — cost ≈ (31/32)(1600+220) ≈ 1.76 GB versus broadcast 31×220 MB ≈ 6.8 GB. Total network ≈ 6 KB + 1.4 MB + 1.76 GB ≈ 1.76 GB, dominated by the one shuffle — plus the final partial-aggregate exchange (KB–MB scale). The broadcasts also enable scan-side pushdown of their filters.",
                  "hint": "Compare each |D| to |F|/W; price both options for the borderline one."
                },
                {
                  "prompt": "Explain why partial aggregation turns 'SUM(net) GROUP BY fiscal_week, category' into a cheap distributed query even over 60 B rows — quantify the shuffle for W = 32, 200 weeks × 40 categories — and then exhibit an aggregate for which this trick is *impossible* in exact form, explaining what property fails.",
                  "solution": "Each worker aggregates locally: its shuffle output is at most one partial state per group = 8,000 states × ~32 B ≈ 256 KB per worker, ~8 MB total across 32 workers — independent of the 60 B input rows; the final merge sums partials per group. The trick requires decomposability: merge(agg(A), agg(B)) = agg(A ∪ B). Exact MEDIAN (any exact percentile) fails it: the median of medians is not the median, and no fixed-size partial state summarizes a slice sufficiently — exact computation needs the values (or a full sort/distribution) centralized, Ω(rows) movement. Practice substitutes mergeable sketches (t-digest/KLL) for approximate percentiles — restoring small partial states at the cost of bounded error.",
                  "hint": "Shuffle bytes scale with groups × workers; then ask which functions have mergeable states."
                },
                {
                  "prompt": "A shuffle join on customer_key is slow: the profile shows 31 workers processing ~9 M rows each and one processing 290 M — Trellis's 'guest checkout' pseudo-customer (customer_key = 0) owns 3% of all historical order lines. Give three remedies in preference order with one-line mechanics, and say which you'd actually ship and why.",
                  "solution": "(1) Model fix: guest checkouts aren't one customer — stop joining them to dim_customer at all (split the scan: key-0 rows bypass the join and aggregate directly, or map to a 'guest' row via broadcast) — removes the hot key from the shuffle entirely. (2) Salting: fact side appends salt = hash(order_id) mod 32 to key 0; dimension side replicates the guest row 32×; hot partition splits evenly. (3) Adaptive/skew-hint execution: let the engine broadcast just the hot key's dimension row and shuffle the rest. Ship (1): it is a one-time modeling correction that fixes every future query and the semantic wart simultaneously (a pseudo-customer in dim_customer violates unit 3's entity discipline); salting and hints treat the symptom per-query and leave the modeling debt.",
                  "hint": "The hot key isn't skew — it's a modeling error wearing skew's costume."
                },
                {
                  "prompt": "'We doubled the cluster from 16 to 32 workers and the dashboard got slower.' Using this unit, list three distinct mechanisms that make this outcome unsurprising, each with the specific cost term that grew.",
                  "solution": "(1) Broadcast costs scale with W: every broadcast join's network bytes doubled ((W−1)·|D|), and dimensions near the crossover may have flipped to shuffle plans with different (possibly worse, if stats are stale) performance. (2) Fixed per-query overheads multiply: more fragments to schedule, more partial-aggregate states to exchange (workers × groups), more stragglers to wait for — latency is max over workers, and the max of more samples is larger under variance. (3) The workload wasn't network/CPU-bound at all: if the query was dominated by scanning few pruned blocks or by one skewed partition, extra workers add coordination without touching the binding constraint (the skewed worker still processes the same tower). Doubling W helps only costs that scale with 1/W — local scan and local CPU on evenly spread data.",
                  "hint": "Which cost terms contain W on the wrong side?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u4l3-i1",
              "front": "Partial (two-phase) aggregation — mechanics and the property it requires",
              "back": "Workers aggregate locally, shuffle only per-group partial states (bytes ∝ workers × groups, not rows), merge finally. Requires decomposable aggregates: merge(agg(A),agg(B)) = agg(A∪B) — true for SUM/COUNT/MIN/MAX, false for exact percentiles (hence sketches)."
            },
            {
              "id": "u4l3-i2",
              "front": "Broadcast vs shuffle join — costs and the crossover",
              "back": "Broadcast: (W−1)·|D|, fact never moves. Shuffle: ≈ |F|+|D|. Broadcast wins iff |D| ≲ |F|/W (projected, filtered bytes). Star schemas distribute well because dimensions are small enough to broadcast."
            },
            {
              "id": "u4l3-i3",
              "front": "Why can growing the cluster flip or slow join plans?",
              "back": "Broadcast cost scales with W while the shuffle threshold |F|/W shrinks — a dimension worth broadcasting at W=8 may not be at W=80; plus more stragglers and exchange overhead. Only 1/W-scaling costs benefit."
            },
            {
              "id": "u4l3-i4",
              "front": "Skew in a shuffle — symptom, cause, remedies in order",
              "back": "One worker's partition towers over the rest (latency = max, not mean); a hot join/group key. Remedies: broadcast instead; salt the hot key (split fact side, replicate dim side); adaptive per-key execution — and check whether the hot key is really a modeling error."
            },
            {
              "id": "u4l3-i5",
              "front": "The four line items of any distributed query profile",
              "back": "Bytes scanned (pruning × projection), bytes shuffled (join strategy, partial-agg), peak partition size (skew), rows per fragment (vectorized CPU). Each maps to a named fix."
            },
            {
              "id": "u4l3-i6",
              "front": "What did classic MPP couple that the cloud warehouse separated?",
              "back": "Storage bolted to workers (each machine owns its slice) — resizing meant data migration. Cloud model: stateless compute over shared object storage with caches — sized per query, billed per second (unit 5)."
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
            "prompt": "An engine has per-value interpretation overhead o = 50 ns and useful work w = 2.5 ns. What speedup does vectorized execution with batch size B = 1,000 achieve over tuple-at-a-time? Round to one decimal.",
            "answer": 20.6,
            "tolerance": 0.3,
            "explanation": "S = (o+w)/(o/B+w) = 52.5/(0.05+2.5) = 52.5/2.55 ≈ 20.6× — essentially at the ceiling 1 + o/w = 21, reached already at modest B because half the ceiling arrives at B = o/w = 20. Larger batches would add nothing and eventually cost cache locality.",
            "points": 1
          },
          {
            "id": "u4q2",
            "type": "numeric",
            "prompt": "A table of N = 8 B rows sits in B = 4,000 blocks (n = 2 M rows each), physically sorted by event_ts. A query filters to a range matching f = 0.3% of rows. Using the pruning proposition, how many blocks are read (worst case)?",
            "answer": 13,
            "tolerance": 0,
            "explanation": "Sorted layout: ⌈f·B⌉ + 1 = ⌈0.003 × 4000⌉ + 1 = 12 + 1 = 13 blocks of 4,000 — answer-proportional I/O. Had the layout been uncorrelated, f·n = 6,000 ⇒ 1 − e^{−6000} ≈ 100%: all 4,000 blocks for the same 0.3% answer.",
            "points": 1
          },
          {
            "id": "u4q3",
            "type": "short",
            "prompt": "A join on W = 20 workers: projected fact 900 MB, projected dimension 60 MB. One word: broadcast or shuffle?",
            "accept": [
              "shuffle",
              "shuffle join",
              "repartition",
              "shuffle (repartition)"
            ],
            "explanation": "Threshold |F|/W = 45 MB < |D| = 60 MB ⇒ shuffle. Check: broadcast = 19 × 60 = 1,140 MB; shuffle ≈ (19/20)(900+60) ≈ 912 MB. Close — which is exactly when stale statistics flip plans wrongly; at W = 10 the same join flips to broadcast (threshold 90 MB).",
            "points": 1
          },
          {
            "id": "u4q4",
            "type": "mcq",
            "prompt": "A query filtering `WHERE customer_id = 88231` on a 6-billion-row table reads every block, despite per-block min/max metadata on customer_id. The table's files are written in event-time order. What is the correct explanation, and the correct fix if this query family matters?",
            "options": [
              "customer_id is uncorrelated with the physical (time) order, so every block's customer_id zone spans nearly the full key range — no zone can exclude the predicate; fix by re-clustering (or Z-ordering) on customer_id, or serving point-lookups from a copy keyed by customer",
              "Min/max statistics do not support equality predicates, only ranges; fix by adding bloom filters, which are the only structure that can prune equality queries",
              "The blocks are too large for pruning to apply; fix by shrinking block size until each block holds one customer's rows",
              "The engine cannot combine pruning with vectorized execution; fix by disabling vectorization for selective queries"
            ],
            "answer": 0,
            "explanation": "Clause (b) of the pruning proposition: uncorrelated layout ⇒ every zone spans the range ⇒ nothing prunes, regardless of metadata. (b) is false — equality is a degenerate range and min/max handles it (bloom filters do *help* precisely in this uncorrelated case, but the stated claim 'only structure' and 'don't support equality' is wrong); (c) shrinking blocks toward per-customer granularity recreates the small-files pathology and still requires clustering to group a customer's rows; (d) is a non-sequitur — pruning and vectorization compose.",
            "points": 1
          },
          {
            "id": "u4q5",
            "type": "proof",
            "points": 2,
            "prompt": "Prove the broadcast–shuffle crossover: with W workers, projected sizes |F| and |D|, broadcast costs ≈ (W−1)|D| network bytes, shuffle costs ≈ (1−1/W)(|F|+|D|), and broadcast wins iff approximately |D| < |F|/W. Then state two practical corollaries: what the star schema's dimension shape implies, and what resizing the cluster does to the decision.",
            "rubric": [
              "Derives broadcast cost: the dimension must be replicated to the W−1 workers not already holding it, fact never moves — (W−1)|D|",
              "Derives shuffle cost: every row of both inputs is hash-routed to its key's owner; a row is already home with probability 1/W, so expected movement (1−1/W)(|F|+|D|)",
              "Solves the inequality correctly to |D| < |F|/(W−1) ≈ |F|/W (algebra shown)",
              "States both corollaries: wide-short dimensions (star schema) fall below the threshold and broadcast at any realistic scale, keeping the fact stationary; increasing W raises broadcast cost linearly while lowering the threshold — resizing can silently flip join plans"
            ],
            "solution": "Broadcast: the joining requires every worker to see the whole dimension; one copy exists somewhere, so W−1 copies traverse the network: (W−1)|D| bytes, and each worker joins its local fact slice — |F| contributes zero movement. Shuffle: both inputs are partitioned by hash(join key) mod W; each row must reside at its hash owner; under uniform placement a row is already there with probability 1/W, so expected transported bytes = (1−1/W)|F| + (1−1/W)|D|. Broadcast preferable iff (W−1)|D| < (1−1/W)(|F|+|D|) = ((W−1)/W)(|F|+|D|); multiply both sides by W/(W−1): W|D| < |F| + |D| ⟺ (W−1)|D| < |F| ⟺ |D| < |F|/(W−1) ≈ |F|/W. ∎ Corollaries: (i) unit 3's dimensions are wide-and-short — projected to join columns they are KB–MB while projected facts are hundreds of MB–GB, so |D| ≪ |F|/W holds and star joins run with the fact never leaving its workers (the model and the executor are co-designed); (ii) the threshold |F|/W shrinks and the broadcast bill (W−1)|D| grows as W increases, so scaling the cluster flips borderline joins from broadcast to shuffle (or makes stale-statistics broadcasts costly) — query plans are not invariant under resizing.",
            "explanation": "The one distributed-systems calculation every data engineer uses weekly, plus the two consequences that explain both why star schemas scale and why bigger clusters sometimes disappoint."
          },
          {
            "id": "u4q6",
            "type": "open",
            "points": 2,
            "prompt": "A nightly report joins a 2 TB (projected 300 GB) clickstream fact to a 90 GB (projected 8 GB) sessions table on session_id, then groups by landing_page (700 distinct values). On a 24-worker cluster it takes 70 minutes. The profile shows: bytes scanned ≈ full table (files written in arrival order across sources, report filters last 7 of 90 retained days); shuffle ≈ 308 GB; worker times balanced; final aggregation trivial. Prescribe the fixes in priority order with quantified expected effects, and state which unit-4 mechanism each invokes.",
            "rubric": [
              "Attacks scan first: files uncorrelated with event date ⇒ no pruning (1−e^{−fn} regime); prescribe date partitioning/clustering (re-cluster or fix the writer), cutting scanned bytes ≈ 90/7 ≈ 13× — cites the layout-not-metadata principle",
              "Attacks the shuffle: 8 GB dimension vs threshold |F|/W = 300/24 ≈ 12.5 GB ⇒ borderline broadcast candidate *after* the scan fix shrinks |F| (7-day |F| ≈ 23 GB ⇒ threshold ~1 GB ⇒ shuffle stays; OR argues pre-aggregation) — the answer must actually run the crossover arithmetic with post-fix numbers, not hand-wave",
              "Considers partial aggregation placement: grouping by landing_page (700 values) means workers can pre-aggregate before any exchange if the join is restructured (e.g., join then local pre-agg, or pre-aggregate clicks per session first) — shuffle of partial states ≈ workers × groups, KB-scale",
              "Orders fixes by leverage with quantified estimates (scan 13×; shuffle from 308 GB toward tens of GB or KB-scale exchanges) and notes verification via the profile's line items after each change"
            ],
            "solution": "Fix 1 — layout (pruning proposition, clause b): the 7-of-90-day filter should prune ~92% of blocks, but arrival-order files leave event_date uncorrelated with position, so zones exclude nothing. Repartition/re-cluster the clickstream by dt= (and fix the writer to partition on event date going forward). Expected: scanned bytes fall ~13× (300 GB → ~23 GB projected); scan time proportionally. Fix 2 — join strategy (broadcast–shuffle crossover): recompute with post-fix sizes: |F| ≈ 23 GB, |D| = 8 GB, threshold |F|/W ≈ 1 GB — 8 GB ≫ 1 GB, so shuffle remains correct; the 308 GB shuffle shrinks to ≈ 23 + 8 = 31 GB from the scan fix alone. To go further, restructure for partial aggregation: the report needs SUM/COUNT by landing_page — pre-aggregate clicks by (session_id) or directly by landing_page-after-join per worker before exchanging: with 700 groups × 24 workers the exchange is ~KB–MB scale; if landing_page lives on the sessions table, join locally after a broadcast of only the (session_id → landing_page) projection *if* that projection is small (8 GB is not; but a pre-aggregated click count per session_id shrinks the fact side to sessions-count scale, flipping the economics). Fix 3 — verify by the invoice: after each change re-read the profile's four line items (scanned, shuffled, peak partition, rows/fragment); expected end state: ~23 GB scanned, ~30 GB → few-GB shuffled, runtime from 70 min to single-digit minutes, dominated by the scan. No skew action needed (times balanced).",
            "explanation": "The unit as a diagnostic method: read the profile as line items, fix layout before strategy (pruning dominates), then price the join with the crossover using *post-fix* sizes, then place aggregation before exchange. The numbers matter — a prescription without the arithmetic is pattern-matching, which is what the grader penalizes."
          }
        ]
      }
    },
    {
      "id": "u5",
      "title": "The Cloud Data Warehouse",
      "summary": "Separation of storage and compute, Snowflake's micro-partition anatomy, the credit economics of elastic warehouses, and the honest BigQuery/Redshift comparison.",
      "intro": "Everything so far — columnar formats, star schemas, vectorized pruning engines — existed before the cloud. What the cloud changed is architecture and economics, and this unit studies the change through its clearest exemplar: **Snowflake**, whose 2016 SIGMOD paper described the design nearly every analytical platform has since converged toward. The first lesson isolates the architectural move itself — separating storage from compute — and quantifies, with utilization arithmetic, why it demolished the coupled MPP appliances of unit 4's closing bridge. The second lesson goes inside Snowflake's storage layer: micro-partitions as immutable, statistics-bearing blocks (unit 4's zone maps, productized), and the two features immutability yields almost for free — time travel and zero-copy cloning, the latter proved correct rather than marveled at. The third lesson prices compute: virtual warehouses, the elasticity theorem (when a bigger warehouse is literally free), and the caches that complicate it. The fourth lesson widens the lens — BigQuery and Redshift as different points in the same design space, whose *pricing models* (per-byte versus per-time) change what you optimize. Trellis migrates its analytical zone into Snowflake in this unit — and leaves its clickstream in the lake, a tension unit 6 resolves. The gate asks for architecture and arithmetic: size the warehouses, predict the pruning, price the workload three ways.",
      "references": [
        "Dageville et al. — The Snowflake Elastic Data Warehouse (SIGMOD 2016)",
        "Snowflake documentation — micro-partitions & data clustering; virtual warehouses; time travel & cloning (docs.snowflake.com)",
        "Melnik et al. — Dremel: Interactive Analysis of Web-Scale Datasets (VLDB 2010) and the VLDB 2020 retrospective (BigQuery's engine)",
        "Joe Reis & Matt Housley — Fundamentals of Data Engineering, chs. 6 & 10 (storage platforms; the cloud economics undercurrent)"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u5l1",
          "title": "Separation of Storage and Compute",
          "estMinutes": 27,
          "builds_on": [
            "u4l3",
            "u2l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The coupling that had to break",
              "body": "Unit 4 closed on the classic MPP warehouse's defining constraint: **shared-nothing** architecture, each worker owning its slice of data on local disk. The design was rational — in 2005, local disk was the only way to feed scans fast enough — but it fused three things that have no business being fused: how much you *store*, how much you *compute*, and how many *concurrent teams* you can serve. Growing data meant buying compute you didn't need; a heavy quarter-close meant either an oversized cluster all year or analysts queueing behind the ELT job; and resizing meant redistributing terabytes across nodes — a weekend maintenance window, so nobody resized. The unit-2 object store dissolved the premise: S3-class storage delivers effectively unbounded aggregate bandwidth through parallel range reads, at eleven nines of durability, priced per gigabyte-month with zero compute attached. Once the data can live *there*, compute can become what it always should have been: **stateless, ephemeral, sized to the moment's work** — spun up against the shared data, caching what it reads, discarded when idle. That inversion — from compute-owns-storage to compute-visits-storage — is the entire architectural content of 'cloud data warehouse', and everything in this unit is its consequences."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Shared-nothing, shared-data, and Snowflake's three layers",
              "statement": "A **shared-nothing** MPP system partitions data across workers' local storage; each worker computes only on its slice, and membership changes require data movement (re-sharding). A **shared-data** (disaggregated) system keeps the durable data in a common store reachable by all compute; compute nodes are stateless (caches aside) and can be added, removed, or replaced without moving durable data.\n\nSnowflake's realization (SIGMOD 2016) has **three layers**: (1) **data storage** — tables as immutable columnar files (micro-partitions, next lesson) in cloud object storage; (2) **virtual warehouses** — independent, ephemeral MPP compute clusters (unit 4's workers, now rentable by the second) that read the shared storage and cache hot data on local SSD; multiple warehouses run *concurrently against the same tables without contention*, each sized and billed separately; (3) **cloud services** — the always-on multi-tenant brain: parsing, optimization, transaction management, access control, and the **metadata store** holding every micro-partition's statistics — which is why pruning decisions (unit 4's zone maps) happen *before* any warehouse touches a byte."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The utilization argument",
              "statement": "Let a workload consist of jobs j with compute demand cⱼ (node-hours) in disjoint time windows of lengths tⱼ within a day, and let peak instantaneous demand be P nodes. A coupled (shared-nothing) system must provision P nodes continuously: cost ∝ P · 24 node-hours/day. A decoupled system pays only Σⱼ cⱼ. The savings ratio is\n\nR = 24·P / Σⱼ cⱼ = 1 / utilization,\n\nthe reciprocal of the coupled cluster's utilization. Since analytical workloads are bursty by nature (nightly ELT, business-hours BI, episodic science), utilization is typically 10–30%, making decoupling worth 3–10× *before* any performance work — and unlike a discount, the ratio grows as the workload gets burstier.",
              "proof": "The coupled system's size is fixed by its peak: any moment demanding P nodes requires P provisioned at all times (re-sharding to resize is not an intra-day operation, and storage locality means capacity cannot follow demand). Its daily cost is 24P node-hours regardless of use. The decoupled system provisions each job's compute for its window only — possible precisely because compute holds no durable state, so creation and destruction are cheap — paying Σⱼ cⱼ ≤ 24P (with equality only at 100% utilization). R follows by division; burstier workloads reduce Σⱼ cⱼ relative to a fixed peak, increasing R. The hidden premises worth naming: object-store bandwidth must feed stateless compute fast enough (true via parallel range reads + local caching, at the price of cold-start effects — lesson 3), and per-window provisioning must be fast and billable at fine grain (per-second billing, minute-scale spin-up). ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: Trellis's day, priced both ways",
              "body": "Trellis's analytical compute demand, in unit-4 worker terms: **nightly ELT** (unit 7's transformations): 64 nodes × 2 h = 128 node-hours; **business-hours BI**: an 8-node-equivalent load × 12 h = 96 node-hours; **data science**, one heavy weekly backtest: 32 nodes × 1 h ⇒ ≈ 4.6 node-hours/day amortized. Peak instantaneous demand P = 64.\n\n**Coupled**: provision 64 nodes around the clock — 1,536 node-hours/day. Utilization = 228.6/1,536 ≈ **15%**; the cluster spends 85% of its life billing for idleness — and it *still* serves BI badly for two hours a night, because the ELT job saturates the same nodes the analysts query (unit 1's interference, reborn at cluster scale).\n\n**Decoupled**: three independent warehouses — an ELT warehouse (64 nodes, alive 2 h), a BI warehouse (8 nodes, alive ~12 h), a science warehouse (32 nodes, alive when used) — totaling ≈ 229 node-hours/day: **6.7× cheaper**, matching R = 1/0.15. And the non-monetary clause is often worth more than the money: the three workloads *cannot interfere* — the ELT job may hammer its warehouse to 100% while the CFO's dashboard, on its own warehouse, reads the same tables at full speed. Workload isolation used to be a data-copying project ('build a reporting replica'); shared-data makes it a checkbox."
            },
            {
              "type": "example",
              "heading": "Worked example: what resizing costs under each architecture",
              "body": "The utilization argument priced steady state; resizing prices *change* — and change is where the coupled design truly hurts. Trellis's data grows to 100 TB and the 16-node cluster must become 24 nodes.\n\n**Shared-nothing**: every worker owns 1/16 of the data on local disk; at 24 nodes each must own 1/24. Even with optimal placement (consistent hashing, moving only what must move), at least 1 − 16/24 = **one third of the data — ~33 TB — must physically migrate** between workers' disks. Over a 10 Gbps effective internal budget (the cluster is also serving queries), that is 33 TB ÷ 1.25 GB/s ≈ **7.3 hours** of rebalancing, during which queries compete with the migration for disk and network — which is why coupled-era resizes were weekend maintenance windows, and why teams provisioned for next year instead of resizing.\n\n**Shared-data**: 'resize' allocates 8 more stateless workers that mount the same object store. No durable data moves at all; the new workers start with cold SSD caches and warm within minutes of query traffic. The operation is so cheap it stops being an *event* — which is precisely what makes per-workload, per-hour sizing (and lesson 3's elasticity theorem) possible. The architectural difference is not that one system copies faster; it is that one system made resizing a data-movement problem and the other made it a scheduling problem.",
            },
            {
              "type": "text",
              "heading": "What shared-data must solve to be honest",
              "body": "The inversion creates three problems the architecture must answer, and the answers preview the rest of the unit. **Latency**: object storage serves ranged GETs in tens of milliseconds — fatal if every scan re-reads it. Answer: each warehouse caches file segments on local SSD; the *first* scan is object-store-speed, subsequent scans are local-disk-speed — which makes cache *warmth* an economic object (lesson 3's auto-suspend trade-off). **Consistency**: many warehouses, one table — who arbitrates concurrent writes? Answer: the cloud services layer runs transactions over the *metadata*: a table version is a list of immutable files; a commit atomically swaps version pointers (next lesson) — snapshot isolation without any warehouse-to-warehouse coordination. **The brain's own scale**: metadata for millions of micro-partitions, thousands of concurrent queries planning against it — the services layer is itself a distributed system, multi-tenant across all customers, which is how features like result caching (lesson 3) and data sharing (grant another account's warehouses read access to your metadata — no copies) fall out naturally. Notice the pattern: every 'magic' Snowflake feature is a corollary of *immutable shared files + versioned central metadata*. Keep that lens; unit 6 shows Delta Lake and Iceberg rebuilding the same two primitives in the open."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**'Separation of storage and compute' is now table stakes, not a differentiator.** BigQuery had it from birth (Dremel never owned disks); Redshift retrofitted it (RA3 managed storage); Databricks was born on it (compute over object-store files, unit 6); even Postgres-compatible newcomers advertise it. When evaluating any analytical platform, the discriminating questions are one level down: *where does metadata live and what does it record* (pruning power, unit 4), *what is cached where* (cold-start behavior), *what is the unit of compute isolation and billing* (lesson 3), and *is the storage format open or proprietary* (the warehouse-versus-lakehouse fault line, unit 6). The slogan is universal; the answers are not."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The cloud warehouse is shared-data MPP: durable tables as immutable files in object storage, stateless per-workload compute clusters that visit and cache them, and a central always-on services layer owning metadata and transactions. The utilization proposition prices the move — 1/utilization, typically 3–10× — and workload isolation arrives as a structural freebie. Trellis commits: the analytical zone's Parquet lineage moves into Snowflake-managed tables (the clickstream stays in the lake — a fork we revisit pointedly in unit 6). But 'immutable files plus versioned metadata' has so far been asserted, not examined. What exactly is inside a micro-partition, what does the metadata record, and how do updates, time travel, and cloning work against files that can never change? That anatomy is the next lesson."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A retailer's daily compute: ELT 40 nodes × 3 h; BI 12 nodes × 10 h; a month-end close needing 80 nodes × 4 h one day per month. Compute the coupled provisioning (sized to the true peak), the decoupled daily average, and R — then explain which single job dominates the coupled cost and why decoupling neutralizes it.",
                  "solution": "Peak P = 80 (month-end). Coupled: 80 × 24 = 1,920 node-hours/day, every day. Decoupled average: 120 + 120 + (320/30 ≈ 10.7) ≈ 250.7 node-hours/day. R ≈ 1,920/250.7 ≈ 7.7× (utilization ≈ 13%). The month-end close dominates: one 4-hour job per month forces 80 nodes provisioned for all 720 hours — 96.5% of its provisioned capacity is never used by it. Decoupled, the close is just 320 node-hours *once a month*; the peak stops being a standing cost because compute no longer has to pre-exist to hold data.",
                  "hint": "The coupled cluster is sized by its worst hour of the month."
                },
                {
                  "prompt": "In the shared-data design, three warehouses run simultaneously against fact_order_line: ELT is rewriting yesterday's partitions, BI dashboards read current data, and a data scientist queries the table 'as of last Monday'. Explain, using immutable files + versioned metadata, why none of the three blocks or corrupts the others.",
                  "solution": "The table at any moment is a metadata version: a list of immutable files. BI reads resolve against the current committed version's file list — files that, being immutable, cannot be affected by concurrent writing. ELT's rewrite creates *new* files and, at commit, atomically publishes a new version pointing to them; until that instant no reader can observe partial state, and after it new queries see the new list (snapshot isolation via metadata pointer swap). The scientist's as-of query resolves against the *retained older version's* file list — those files still exist (immutability + retention), so history reads are ordinary reads. No warehouse ever locks another because no shared mutable state exists except the version pointer, and that changes atomically in the services layer.",
                  "hint": "Readers hold a version; writers publish a new one; files never change."
                },
                {
                  "prompt": "A skeptic: 'Reading from object storage over the network must be slower than the old cluster's local disks — the separation is a performance downgrade dressed as economics.' Give the two-part rebuttal with the mechanisms named, and the one scenario where the skeptic is genuinely right.",
                  "solution": "Part 1 — parallelism: object storage's aggregate bandwidth scales with concurrent range reads (unit 2's contract); an MPP warehouse issues hundreds of parallel ranged GETs, and with unit-4 pruning it reads far fewer bytes than the old full-slice scans — throughput per query is competitive or better. Part 2 — caching: warehouses cache read segments on local SSD, so steady-state hot workloads run at local-disk speed anyway; the object store is the cold path and the durability layer, not the per-query path. The skeptic is right for: cold starts — the first query after a warehouse resumes (or after cache eviction) pays object-store latency on every miss; latency-critical, sub-second, cache-hostile workloads on freshly resumed compute genuinely regress versus always-on local-disk clusters (which is a real argument for keeping such a warehouse always on — at utilization cost).",
                  "hint": "Aggregate bandwidth + pruning; SSD caches; then think about the first query of the morning."
                },
                {
                  "prompt": "Trellis's ELT job and the BI dashboards currently share one warehouse; during the 2 a.m.–4 a.m. window, dashboard p95 latency triples. A colleague proposes doubling the warehouse size. Using this lesson, name what the proposal misdiagnoses, give the correct fix, and state its cost change relative to the doubling proposal.",
                  "solution": "Misdiagnosis: the problem is *interference* (two workloads contending for one compute pool), not capacity; doubling shares a bigger pool but preserves contention (and doubles cost for 24 h to fix 2 h — utilization logic in reverse). Correct fix: split into two warehouses — ELT on its own (sized to finish the window), BI on its own (sized for query concurrency) — shared-data makes both read/write the same tables with zero copies. Cost: the split adds no storage and prices each workload's actual hours; versus doubling (2× the 24 h bill), the split typically costs ≈ the original bill ± sizing changes, while eliminating rather than diluting the interference. Isolation is the feature; size is orthogonal.",
                  "hint": "Unit 1's register-vs-analyst interference, at warehouse scale — and what does doubling cost for the other 22 hours?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u5l1-i1",
              "front": "Shared-nothing vs shared-data architecture",
              "back": "Shared-nothing: workers own data slices on local disk; resize = data migration; one cluster serves everyone. Shared-data: durable data in a common object store; stateless compute clusters visit it, cache locally, scale independently."
            },
            {
              "id": "u5l1-i2",
              "front": "Snowflake's three layers",
              "back": "(1) Storage: immutable columnar micro-partitions in object storage. (2) Virtual warehouses: independent ephemeral MPP clusters with SSD caches. (3) Cloud services: always-on brain — planning, transactions, access control, and the metadata store with per-partition statistics."
            },
            {
              "id": "u5l1-i3",
              "front": "The utilization proposition",
              "back": "Coupled cost ∝ 24 × peak nodes; decoupled cost = Σ job node-hours; savings R = 1/utilization (typically 3–10× at 10–30% utilization) — and burstier workloads increase R."
            },
            {
              "id": "u5l1-i4",
              "front": "Why can many warehouses share one table without locks?",
              "back": "A table version is a list of immutable files; commits atomically swap the version pointer in the services layer. Readers hold snapshots; writers publish new files + new version — no shared mutable state beyond the pointer."
            },
            {
              "id": "u5l1-i5",
              "front": "The three problems shared-data must answer (and their answers)",
              "back": "Object-store latency → local SSD caches (cold-start trade-off); consistency across warehouses → metadata-versioned snapshot isolation; metadata scale → the multi-tenant cloud services layer (which also yields result caching and zero-copy data sharing)."
            },
            {
              "id": "u5l1-i6",
              "front": "What actually differentiates cloud warehouses now that separation is universal?",
              "back": "Where metadata lives and what it records (pruning power), cache architecture (cold starts), the unit of compute isolation/billing, and open vs proprietary storage format (the lakehouse fault line)."
            }
          ]
        },
        {
          "id": "u5l2",
          "title": "Micro-Partitions, Time Travel, and Zero-Copy Cloning",
          "estMinutes": 28,
          "builds_on": [
            "u5l1",
            "u4l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The storage layer, examined",
              "body": "*Separation of Storage and Compute* leaned on one phrase — 'immutable files plus versioned metadata' — as the source of Snowflake's coherence. This lesson opens the phrase. When Trellis runs `COPY INTO fact_order_line FROM @stage`, Snowflake does not append rows to some great mutable heap; it writes **micro-partitions** — modest, immutable, columnar blocks — and registers each in the metadata store with per-column statistics. Every capability the platform then exhibits — pruning, DML, time travel, cloning, replication, data sharing — is an operation on *that catalog of immutable blocks*, and most of this lesson's work is watching ordinary SQL verbs (UPDATE, DELETE, SELECT … AT) compile down to block-and-catalog operations. The payoff for a data engineer is predictive power: you can reason about what a Snowflake operation costs — in time, credits, and storage — from first principles, because the primitives are exactly the ones units 2 and 4 already priced."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Micro-partition; table version",
              "statement": "A **micro-partition** is Snowflake's storage block: a horizontal slice of a table holding contiguous rows in a proprietary columnar format (**50–500 MB uncompressed**, typically ~16 MB compressed with unit-2-style per-column encodings), **immutable** once written, stored as an object in the cloud object store. For every micro-partition and every column, the metadata store records: **min and max values, null count, and distinct-value estimates** — unit 4's zone map, gathered automatically at write time, with no user action, on every column.\n\nA **table version** is an ordered set of micro-partition references in the metadata store. All DML compiles to versions: **INSERT/COPY** writes new micro-partitions and adds their references; **DELETE** rewrites affected micro-partitions *without* the deleted rows (copy-on-write) and swaps references; **UPDATE** likewise rewrites affected partitions with modified values. A **commit** atomically publishes the new version; readers always resolve a consistent version (snapshot isolation, per lesson 1). Old versions — and thus the old micro-partitions they reference — are retained for the table's **time-travel window** (default 1 day, configurable to 90), after which unreferenced files become reclaimable."
            },
            {
              "type": "example",
              "heading": "Worked example: what UPDATE actually costs",
              "body": "Trellis runs a correction: `UPDATE fact_order_line SET net_amount = net_amount - 2.00 WHERE order_id = 'O-88231'` — one order, 4 rows, in a 40 M-row table of ~250 micro-partitions.\n\n**Step 1 — find**: the services layer prunes by metadata. If order_id's ranges are tight (the table is loaded in time order and order ids are time-correlated), the 4 rows live in 1 micro-partition; pruning identifies it without reading data.\n\n**Step 2 — rewrite**: the warehouse reads that one partition (~16 MB), writes a *new* micro-partition identical except for 4 values (~16 MB out), and the commit swaps one reference. Cost: ~32 MB of I/O and seconds of one small warehouse — for a 4-row update. The old partition remains, referenced by the previous version (time travel).\n\nNow the anti-pattern, priced with the same primitives: a daily job that updates a `last_seen_date` on **every** customer row of a 4 M-row dimension rewrites *every* micro-partition of the table, every day — the table's entire storage churns daily, time-travel retention holds every yesterday's full copy, and the job costs like a full table rebuild because, physically, **it is one**. Copy-on-write turns row-update *frequency × spread* into the real cost driver: narrow, clustered updates are cheap; broad shotgun updates are table rewrites. (Unit 6 meets the same physics in Delta Lake under the same name, plus a merge-on-read alternative that defers the rewrite.)"
            },
            {
              "type": "text",
              "heading": "Pruning and clustering, productized",
              "body": "Because every column of every micro-partition carries min/max statistics, Snowflake pruning is unit 4's arithmetic verbatim: a predicate excludes every micro-partition whose range misses it, and effectiveness is a pure function of *layout correlation*. Natural ingestion order gives Trellis time-clustering for free — `WHERE order_ts ≥ last quarter` prunes to the recent ~60 of 250 partitions, and the query profile reports it plainly ('partitions scanned: 61 of 250') — while `WHERE customer_id = …` scans all 250, since customers scatter across time (unit 4's uncorrelated regime, e^{−fn} ≈ 1 with n ≈ 150 k rows).\n\nWhen a second query family matters enough, you declare a **clustering key** — `ALTER TABLE … CLUSTER BY (channel, order_ts)` — which does *not* sort the table on the spot; it states a target order that a background service (**automatic clustering**) maintains by incrementally rewriting the worst-overlapping micro-partitions, exactly unit 4's re-cluster-the-decayed-regions loop, now sold as a managed service billed in credits. The health metric is **clustering depth** (`SYSTEM$CLUSTERING_INFORMATION`): the average number of overlapping micro-partitions covering a value — unit 4's overlap depth, verbatim. The engineering judgment transfers unchanged: cluster for the dominant filter family; prefixes low-cardinality; expect decay under churn; and *price the maintenance* — automatic clustering on a heavily-updated table can quietly out-bill the queries it accelerates, which is unit 9's cost lesson knocking early."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Zero-copy cloning is O(metadata) and interference-free",
              "statement": "`CREATE TABLE dev_orders CLONE prod_orders` completes in time and storage proportional to the table's **metadata** (its micro-partition reference list), not its data bytes; thereafter, no operation on the clone can affect the source's contents or vice versa, while unmodified micro-partitions remain physically shared. Storage grows only by each side's *subsequent divergence*: after the clone, added or rewritten partitions belong to the writing table alone.",
              "proof": "The clone operation copies the source's current version — a list of P references — into a new table's metadata: O(P) work, zero data movement; both tables now reference the same immutable files. Reads on either side resolve through their own reference lists to files that, being immutable, are bit-identical forever — so neither table can observe any change it did not itself commit. A write to either table follows the DML rule: it creates *new* micro-partitions and updates *its own* reference list; the other table's list is untouched and the shared files are unmodified (immutability), so isolation holds. Storage accounting: shared files are stored once; each write adds files referenced only by the writer, so incremental storage = bytes of divergence. Reclamation: a physical file is deletable only when no table version within any retention window references it — reference counting over immutable objects, with no coordination beyond the metadata store. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: time travel and cloning as daily tools",
              "body": "Three Trellis incidents, solved from the catalog. **(1) The fat-fingered DELETE**: an analyst deletes a month instead of a day at 14:02. `SELECT * FROM fact_order_line AT(TIMESTAMP => '14:01'::…)` reads the pre-mistake version — the old micro-partitions still exist inside the 24 h window — and `CREATE TABLE recovered CLONE fact_order_line AT(…14:01)` (or INSERT-select the difference) restores in minutes: an *undo* built from retention, no backup tapes involved. **(2) The dev environment**: unit 7's transformation rewrite needs production-scale test data. `CREATE DATABASE dev CLONE analytics` — the full multi-TB estate, cloned in seconds for zero marginal storage; the team mutates freely (their writes diverge privately, per the proposition) and drops it when done, paying only for what they changed. The old alternative — copy a 10% sample and hope it exhibits production's skew — died the day cloning shipped. **(3) The audit**: finance asks what June's revenue report showed *on July 3*, before a restatement. If the table's retention covers it, `AT` answers directly; if not — and this is the honest caveat — time travel is an *operational* undo window, not an archival system: 90 days maximum, priced as retained storage churn. Long-horizon reproducibility belongs to the modeled layer's own history (unit 3's SCDs) and to raw-zone replay (unit 2), not to storage-layer retention."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Time-travel retention prices your churn, not your size.** Retained storage = every micro-partition version written inside the window. A stable 1 TB table with 90-day retention stores ~1 TB; the same table fully rewritten nightly (the shotgun-update anti-pattern, or a rebuild-the-world transformation from unit 7) stores toward 90 TB. Before raising DATA_RETENTION_TIME_IN_DAYS, look at the table's *rewrite rate* — the same copy-on-write physics that made the 4-row UPDATE cheap makes high-churn tables' history expensive. High-churn staging tables usually deserve retention 0–1 and TRANSIENT status; the modeled layer deserves the long window."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Snowflake's storage layer is now transparent: micro-partitions as auto-profiled immutable zone-mapped blocks; every DML a copy-on-write rewrite plus an atomic version swap; pruning and clustering as unit 4's theory running as a managed background service with clustering depth as the gauge; and time travel and zero-copy cloning falling out of retention and reference-sharing — the latter proved interference-free from immutability alone. The predictive rules of thumb: query cost tracks partitions *scanned* (layout!), DML cost tracks partitions *touched* (spread!), storage cost tracks *churn × retention*. What we have not yet priced is the other half of the bill: the warehouses themselves — sizes, credits, caches, and the strange theorem that a bigger warehouse is often free. That economics is the next lesson."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A 500-partition table is loaded in event-time order. Query A filters a 3-day range (the table spans 300 days); query B filters one device_id (50 k devices, uncorrelated with time). Predict 'partitions scanned' for each, citing the regime — then state the two options to make B prune well and the cost each carries.",
                  "solution": "A: time is the physical order — clause (a) of unit 4's proposition: ≈ ⌈(3/300)×500⌉ + 1 ≈ 6 partitions. B: uncorrelated — with n ≈ 100 k+ rows per partition and f = 1/50,000, f·n ≥ 2 ⇒ 1 − e^{−2} ≈ 86%+ of partitions contain the device: effectively all 500 scanned. Options: (1) CLUSTER BY (device_id) or Z-order-like compound — B prunes toward answer-proportional, but A's time clustering degrades unless time stays in the key ((device_id, ts) shatters time across 50 k prefixes — A regresses), plus ongoing automatic-clustering credits under churn; (2) leave layout for A and serve B from a different structure (a device-keyed serving copy or search optimization service) — extra storage/service cost, no layout fight. The decision is workload arithmetic, not doctrine.",
                  "hint": "Which regime does each predicate sit in? Then: one physical order, two claimants."
                },
                {
                  "prompt": "Price these three operations in micro-partition I/O on a 250-partition, ~4 GB-compressed table: (a) DELETE of one day's rows, table loaded in time order (day ≈ 1/500 of history… assume the day spans 1 partition); (b) UPDATE setting a flag on 0.5% of rows scattered uniformly at random; (c) ALTER TABLE … ADD COLUMN with a DEFAULT of NULL. Explain each.",
                  "solution": "(a) ~1 partition read + ~1 written (~32 MB): pruning finds the day's partition(s); copy-on-write rewrites without the rows. (b) Expected fraction of partitions containing ≥1 affected row: with n ≈ 160 k rows/partition and f = 0.005, 1 − e^{−800} ≈ 100% — all 250 partitions rewritten: ~8 GB I/O for 0.5% of rows; scattered small updates are full rebuilds (batch them, or restructure as inserts + view). (c) ~0 data I/O: adding a nullable column is a metadata operation — no existing micro-partition changes; the column materializes only in newly written partitions (readers treat absence as NULL).",
                  "hint": "Partitions *touched*, not rows touched; then recall which DDL is metadata-only."
                },
                {
                  "prompt": "Prove or refute using the cloning proposition: 'After CREATE TABLE dev CLONE prod, running a huge UPDATE on dev can slow prod's queries, because they share storage.' Then give the one resource dimension where clone-heavy workflows *do* genuinely collide, and the governing quantity.",
                  "solution": "Refuted for correctness and data-path interference: dev's UPDATE creates new micro-partitions and updates dev's reference list; prod's list and the shared immutable files are untouched, so prod's queries read exactly the same bytes as before (proposition's isolation argument). Compute can't collide either if the workloads run on separate virtual warehouses (lesson 1). The genuine collision: **storage cost** (and metadata volume) — divergence bytes accumulate per the proposition, and clones extend the reachability of old files (a file is reclaimable only when no version of no table references it within retention), so long-lived, heavily-diverged clones inflate the storage bill. Governing quantity: bytes of divergence × number of live clones × retention windows.",
                  "hint": "Isolation is by reference lists; the shared thing that grows is reachable bytes."
                },
                {
                  "prompt": "Design the recovery runbook for: 'A transformation bug at 03:10 corrupted fact_order_line; discovered 09:30; the table has 24 h retention; correct loads continued to run at 04:00 and 08:00 adding new valid data.' State the exact time-travel moves and what is genuinely unrecoverable.",
                  "solution": "1. Freeze writers (pause the pipeline). 2. Snapshot the evidence: CREATE TABLE broken_copy CLONE fact_order_line — preserves the corrupted state for diagnosis beyond the retention clock. 3. Recover the pre-bug base: CREATE TABLE base CLONE fact_order_line AT(TIMESTAMP => 03:09) — valid as of 03:09. 4. Re-apply the valid post-bug loads: the 04:00 and 08:00 batches exist in the raw zone (unit 2's immutable raw — this is exactly why); rerun their transformations against base (or INSERT the delta computed from staging). 5. Swap: ALTER TABLE … SWAP WITH base (atomic), resume pipeline, 6. Postmortem with broken_copy. Genuinely unrecoverable: nothing in data terms *if* raw retains the inputs; what time travel alone could not do is separate the bug's corruption from the valid 04:00/08:00 writes — AT() restores whole versions, not selected changes, so replay-from-raw (the lifecycle's insurance) is the necessary partner. If retention had lapsed (discovered day 3 with 1-day retention), the base itself would be gone: retention length is an RTO/RPO decision, not a default to leave untouched.",
                  "hint": "Clone the wreckage first (the clock is running), restore the last good version, replay the good loads from raw."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u5l2-i1",
              "front": "Micro-partition — the five facts",
              "back": "50–500 MB uncompressed (~16 MB compressed) columnar block; immutable; auto-profiled per column (min/max, nulls, distinct) into the metadata store; the unit of pruning and of copy-on-write DML."
            },
            {
              "id": "u5l2-i2",
              "front": "What do INSERT, DELETE, UPDATE compile to in Snowflake?",
              "back": "INSERT: new partitions + added references. DELETE/UPDATE: copy-on-write rewrite of *touched* partitions + atomic version swap. Cost tracks partitions touched × their size — spread, not row count."
            },
            {
              "id": "u5l2-i3",
              "front": "The shotgun-update anti-pattern",
              "back": "Small updates scattered across all partitions (e.g., touch one column on every row daily) rewrite the whole table — full-rebuild cost and churn×retention storage. Batch updates, keep them clustered, or model as inserts."
            },
            {
              "id": "u5l2-i4",
              "front": "Clustering key, automatic clustering, clustering depth",
              "back": "CLUSTER BY declares a target order; a background service incrementally rewrites the worst-overlapping partitions (billed in credits); clustering depth = avg overlapping partitions per value — unit 4's overlap metric, productized."
            },
            {
              "id": "u5l2-i5",
              "front": "Why is zero-copy cloning safe and instant?",
              "back": "Clone = copy the version's reference list (O(metadata)); both tables point at immutable shared files; writes diverge privately via each table's own new files and list. Storage grows only by divergence."
            },
            {
              "id": "u5l2-i6",
              "front": "Time travel — mechanism, window, and what it is not",
              "back": "Old table versions (and their partitions) retained 1–90 days; AT()/BEFORE() reads them; retention prices churn, not size. It is an operational undo, not an archive — long-horizon history lives in SCDs and raw-zone replay."
            }
          ]
        },
        {
          "id": "u5l3",
          "title": "Virtual Warehouses and the Elasticity Theorem",
          "estMinutes": 28,
          "builds_on": [
            "u5l1",
            "u4l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Renting the workers by the second",
              "body": "*Separation of Storage and Compute* freed compute to be sized per workload; this lesson prices it. A **virtual warehouse** is unit 4's MPP cluster with a meter attached: T-shirt sizes where each step **doubles** the node count — XS = 1 credit/hour, S = 2, M = 4, L = 8, XL = 16, 2XL = 32, and so on — billed **per second** after a 60-second minimum, with **auto-suspend** after configurable idleness and **auto-resume** on the next query. A credit is the billing unit (a few dollars, contract-dependent; we'll use $3 illustratively). Three consequences follow immediately from the pricing shape and drive everything else. Doubling size doubles the burn rate — but if it also halves the runtime, *the job's cost is unchanged*, a symmetry worth a theorem. Idle time is pure waste — so suspension policy is a first-order cost lever. And because warehouses are ephemeral, their local SSD caches die with them — so the suspension lever is coupled to a performance lever, and the two must be reasoned about together."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The elasticity theorem (and its three breakdown clauses)",
              "statement": "Model a job as W units of perfectly parallelizable work run on a warehouse of size s (capacity ∝ s, burn rate c·s credits/hour). Runtime T(s) = W/(k·s); cost = c·s · T(s) = c·W/k — **independent of s**. Under perfect scaling, you choose latency freely and cost is fixed: a 2XL finishing in 4 minutes costs exactly what an XS finishing in 128 minutes costs.\n\nThe theorem fails in three named ways. **(i) Amdahl clause**: with a non-parallelizable fraction — T(s) = a + b/s — cost = c·(a·s + b) grows linearly in s once a·s ≳ b; past the knee, bigger warehouses buy little latency at real cost. **(ii) Granularity clause**: per-second billing with a 60 s minimum and per-query fixed overheads means short queries (seconds) cannot convert size into proportional speedup — a dashboard query dominated by compile + small scans runs no faster on XL than S, so cost scales with s at flat latency. **(iii) Utilization clause**: cost follows *provisioned-alive* time, not busy time; a warehouse serving sporadic queries at 10% busy pays 10× its useful compute unless suspension (or multi-tenancy of workloads on it) closes the gap.",
              "proof": "Main claim: cost = burn rate × runtime = c·s × W/(k·s) = c·W/k; s cancels. (i): substitute T(s) = a + b/s (Amdahl's law with serial time a): cost = c·s·(a + b/s) = c·(a·s + b); monotone increasing in s, with latency floor a — so past s ≈ b/a, latency gains vanish while cost grows ∝ s. (ii): if runtime has a floor t₀ (compile, metadata, minimum billing) independent of s, then for jobs with W/(k·s) ≪ t₀, T ≈ t₀ and cost ≈ c·s·t₀ ∝ s with no latency benefit. (iii): if the warehouse is alive A hours but busy B < A, billed cost c·s·A exceeds useful cost c·s·B by the idle ratio; suspension reduces A toward B at the price of cache loss (below). ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: sizing Trellis's three warehouses",
              "body": "Apply the theorem to the lesson-1 topology. **ELT warehouse**: the nightly build is long-running, scan-and-join heavy, highly parallel — the theorem's home turf. On M (4 cr/h) it takes 4 h = 16 credits; on XL (16 cr/h), ~1 h = 16 credits. Same cost, 4 h earlier data — take the XL and set auto-suspend to 60 s; the warehouse lives exactly as long as the job. (Verify the Amdahl knee empirically: if XL → 2XL only cuts 1 h to 45 min — cost 24 credits — the serial fraction has surfaced; back off.)\n\n**BI warehouse**: dozens of second-scale dashboard queries — clause (ii) territory. Size for *concurrency and working set*, not single-query speed: an S or M whose cache holds the hot modeled tables; scale **out**, not up, for peak hours (a multi-cluster warehouse adds same-size clusters when queues form, min 1 – max 3, so 9 a.m. Monday doesn't queue behind capacity sized for Tuesday afternoon). Auto-suspend: *not* 60 s — every resume starts with a cold SSD cache, and the first analyst of the morning eats object-store latency on the whole working set; 10–15 min idle tolerance (or a scheduled warm-up query at 7:55) trades pennies of idle burn against the day's first-impression latency.\n\n**Science warehouse**: bursty, huge, occasional — the decoupling poster child. L or XL, auto-suspend 60 s, auto-resume on; it exists only inside the backtest's wall-clock. Total topology cost: within pennies of lesson 1's 229 node-hour estimate — but now each workload also has the *right* latency, which the coupled cluster could never give all three at once."
            },
            {
              "type": "text",
              "heading": "The three caches, and what invalidates each",
              "body": "Snowflake answers repeated work at three levels, and confusing them produces bad sizing decisions. **(1) Warehouse (SSD) cache**: file segments read from object storage are cached on the warehouse's local disks; scope = that warehouse, lifetime = until eviction **or suspension** (the cluster's machines are returned); effect = second reads at local-disk speed. This is why suspend policy is a performance decision and why per-workload warehouses beat one shared pool: each cache holds *its* workload's working set instead of thrashing. **(2) Result cache**: the services layer memoizes complete query results for **24 hours**, returned with *zero warehouse* (and zero credits) when a query is textually identical (byte-level, same role/context) and the underlying tables' versions are **unchanged** — the metadata versioning of lesson 2 is what makes the staleness check exact rather than heuristic. Dashboards refreshing unchanged data at 5-minute intervals cost nothing between loads; one character of SQL drift (or a session parameter difference) forfeits it. **(3) Metadata 'cache'** — really the metadata store itself: COUNT(*), MIN/MAX on a column, and some fully-pruned queries answer from statistics alone, warehouse never resumed. The diagnostic habit: before sizing up a 'slow' workload, check the profile for which level *should* have served it — a dashboard fleet missing the result cache over a churning staging table, or a BI warehouse whose cache dies every 60 s, is a policy bug wearing a capacity costume."
            },
            {
              "type": "example",
              "heading": "Worked example: reading a week's bill",
              "body": "Trellis's first Snowflake invoice surprises nobody who has the theorem. Line 1: ELT_WH (XL), ~16 credits/night × 22 nights ≈ 352 credits — matches plan. Line 2: BI_WH (M, multi-cluster 1–3): 4 × 12 h × 22 ≈ 1,056 credits *if* single-cluster… actual 1,310 — the delta is the second cluster spinning up for the Monday-morning and month-end concurrency peaks: correct behavior, visible in the warehouse's cluster-count history. Line 3: SCIENCE_WH (XL): 68 credits — four backtests. Line 4, the surprise: DEV_WH (L, created by an engineer 'temporarily') idled at auto-suspend = **never** over a long weekend: 8 cr/h × 60 h = 480 credits of pure idleness — clause (iii) in a single line item, and a third of the bill. Fixes, in order of leverage: account-level policy that no warehouse may set suspend > 1 h without review; resource monitors with alerts and hard caps per warehouse; and the cultural rule the elasticity theorem implies — *warehouses are cattle*: create one per purpose, sized to the purpose, and let it die when idle. The bill is now itemized by workload — which is precisely what the coupled cluster of lesson 1 could never tell you: *who* spent *what* on *which* question. Unit 9 builds full FinOps on this observability; the primitive is per-workload warehouses."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**'Scale up' answers exactly one question — is the job parallel-bound?** Before resizing, classify the complaint. Single long scan-heavy job too slow → up a size, verify near-halving, stop at the Amdahl knee. Many small queries queueing → scale *out* (multi-cluster) or split workloads; a bigger single cluster mostly adds unused lanes (clause ii). First-query-of-the-morning slow → suspension/cache policy, not size. Everything slow all the time on a busy warehouse → check spillage in the profile (working sets exceeding memory *do* justify sizing up — one of the few cases where up fixes small queries). The reflex 'slow ⇒ bigger' is how clause-(iii) bills get written."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Compute is now priced with the same rigor as storage: credits = size × alive-time; the elasticity theorem makes size a *latency* choice (free at fixed cost) exactly while work is parallel-bound, with Amdahl, granularity, and utilization clauses marking where the freedom ends; caches at three levels (warehouse SSD / result / metadata) convert policy into performance; and per-workload warehouses give isolation *and* an itemized bill. Trellis's topology: XL ELT that lives two hours, cached M multi-cluster BI, ephemeral XL science, and monitors that make idleness loud. One question remains for this unit: is any of this specifically *Snowflake*, or is it the shape of the whole market? The final lesson compares the architectures and — more consequentially — the pricing models of BigQuery and Redshift, because what a platform bills for is what its users end up engineering around."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A parallel-bound transformation runs 6 h on a S (2 cr/h). Using the elasticity theorem: what does it cost on S, and what are the predicted runtime and cost on L (8 cr/h)? Measurement then shows L takes 2.1 h. Extract the Amdahl parameters (a, b) from the two runs and predict runtime and cost on XL — is the next doubling worth it?",
                  "solution": "S: 12 credits, T = 6 h. Perfect scaling predicts L (4× capacity): 1.5 h, 12 credits. Measured 2.1 h ⇒ fit T(s) = a + b/s with s in S-units (s=1: 6 = a + b; s=4: 2.1 = a + b/4): subtract — 3.9 = 3b/4 ⇒ b = 5.2, a = 0.8 h serial. XL (s = 8): T = 0.8 + 0.65 = 1.45 h; cost = 16 cr/h... in S-units burn = 2·s cr/h = 16 cr/h × 1.45 ≈ 23.2 credits vs L's 8×... L cost = 8 cr/h? No: L = 8 cr/h × 2.1 = 16.8 credits. XL: 16 cr/h × 1.45 = 23.2 credits for 0.65 h saved — cost +38% for −31% latency, deep past the knee (a·s ≈ 6.4 ≥ b/… ). Worth it only if a deadline values the 39 minutes; otherwise stay at L — and note the serial 0.8 h is the real optimization target (find the non-parallel stage).",
                  "hint": "Two equations, two unknowns; then cost = burn(s) × T(s); compare marginal credit per saved minute."
                },
                {
                  "prompt": "A 5-minute-refresh dashboard fleet issues 40 distinct queries against modeled tables rebuilt nightly at 02:00. Yesterday the fleet cost ~0 credits between 08:00 and 24:00; today it billed the BI warehouse continuously. List the three most likely result-cache-forfeiting changes, the mechanism of each, and the check that identifies the culprit in minutes.",
                  "solution": "(1) A table version churns: something now writes one of the referenced tables intraday (a new micro-batch load, an automatic-clustering rewrite, even a small MERGE) — version change invalidates every dependent cached result. Check: query history's 'result reused' flag + the table's DML history. (2) Query text drift: the BI tool started injecting a changing literal (timestamp, session comment, request id) — byte-identity broken. Check: diff two adjacent query texts from history. (3) Context change: role/warehouse/parameter differences between sessions (a migration to a new service role). Check: history's role/session columns. The general lesson: the result cache is a contract about *identical text over unchanged versions* — and intraday writers are the usual silent breaker (which is also an argument for batching intraday loads, or pointing dashboards at tables that change on the dashboard's own cadence).",
                  "hint": "Cache key = (exact text, context) + table versions; which of the three moved?"
                },
                {
                  "prompt": "Compare two BI-warehouse policies for a team active 09:00–18:00 with lunchtime and meeting lulls: (a) M with auto-suspend 60 s; (b) M with auto-suspend 15 min. Estimate the credit difference for ~2 h of scattered idle gaps per day, and describe the performance difference the 60 s policy inflicts — then pick one and defend it.",
                  "solution": "(a) suspends in every lull: saves up to ~2 h × 4 cr/h ≈ 8 credits/day minus resume minimums — but each resume starts cold: the working set (say tens of GB) re-reads from object storage, so the first queries after every meeting are multi-second-slow; with a dozen lulls the team experiences 'randomly slow mornings, afternoons' — a real productivity tax. (b) rides through lulls (bills the ~2 h ≈ 8 credits/day ≈ $24) and suspends only on true absence; cache stays warm all day. Defensible pick: (b) for an interactive team — $24/day against a whole team's latency experience; (a) for warehouses whose consumers are machines (scheduled jobs don't mind cold starts) — which is exactly why suspend-fast is right for ELT/science and wrong for interactive BI. Policy follows consumer, not thrift.",
                  "hint": "Credits saved are computable; cache-cold minutes are the hidden price — who feels them?"
                },
                {
                  "prompt": "'Our month-end close job must finish by 06:00; it's parallel-bound and takes 9 h on M. Finance also asks that closing costs not grow.' Using the theorem, give the sizing that meets the deadline, its cost versus M, and the two verifications you'd run before promising the deadline.",
                  "solution": "Parallel-bound ⇒ elasticity theorem: 2XL (8× M's capacity) predicts 9/8 ≈ 1.1 h — start 04:30, done before 06:00 — at identical cost (M: 4 cr/h × 9 = 36; 2XL: 32 cr/h × 1.125 = 36). Finance's constraint is satisfied *by the theorem*, not by luck. Verifications: (1) scaling test — run once on XL and check runtime ≈ 2.25 h (near-halving); if materially worse, extract (a, b) and re-plan around the knee (maybe XL + earlier start); (2) profile for spillage and skew (unit 4) — a skewed join caps scaling regardless of size (latency = max over workers), and spilling stages sometimes *benefit* super-linearly from bigger memory, changing the arithmetic in your favor. Promise the deadline only after (1); the theorem is a model, and Amdahl collects from those who don't measure.",
                  "hint": "Same cost at any size while parallel-bound — so buy latency; then verify the 'while'."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u5l3-i1",
              "front": "The elasticity theorem",
              "back": "For parallel-bound work, cost = c·s × W/(k·s) = c·W/k — size cancels: a bigger warehouse is the same cost, sooner. Size is a latency dial while (and only while) scaling is near-linear."
            },
            {
              "id": "u5l3-i2",
              "front": "The three breakdown clauses of warehouse elasticity",
              "back": "Amdahl (serial fraction a: cost c(as+b), latency floor a); granularity (short queries can't use added lanes — floor t₀ makes cost ∝ s at flat latency); utilization (billed alive-time ≥ busy-time — idleness is pure waste)."
            },
            {
              "id": "u5l3-i3",
              "front": "Scale up vs scale out — which complaint maps to which",
              "back": "One long parallel job too slow → up (verify near-halving, stop at the knee). Many small queries queueing → out (multi-cluster) or split workloads. Morning slowness → suspend/cache policy. Spillage → up genuinely helps."
            },
            {
              "id": "u5l3-i4",
              "front": "Snowflake's three answer-reuse levels and their invalidation",
              "back": "Warehouse SSD cache (dies on suspend; scope = one warehouse); result cache (24 h, byte-identical text + unchanged table versions, zero credits); metadata answers (COUNT/MIN/MAX from statistics, no warehouse at all)."
            },
            {
              "id": "u5l3-i5",
              "front": "Why does auto-suspend policy differ between ELT and BI warehouses?",
              "back": "ELT consumers are machines — suspend at 60 s, cold starts don't matter. BI consumers are humans — suspension kills the SSD cache and the next analyst pays object-store latency; tolerate 10–15 min idle or pre-warm."
            },
            {
              "id": "u5l3-i6",
              "front": "The cultural rule per-second billing implies",
              "back": "Warehouses are cattle: one per workload/purpose, sized to it, auto-suspended, capped by resource monitors — yielding both isolation and a bill itemized by workload (the FinOps primitive)."
            }
          ]
        },
        {
          "id": "u5l4",
          "title": "The Warehouse Market: BigQuery, Redshift, and What Pricing Optimizes",
          "estMinutes": 27,
          "builds_on": [
            "u5l1",
            "u5l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "One design space, three points",
              "body": "Everything in lessons 1–3 was taught on Snowflake because its paper is the clearest articulation, but the claims are about an architecture, not a vendor. This closing lesson maps the market onto the concepts you now own, through the two questions that actually discriminate: **how is compute provisioned and isolated**, and — more behaviorally important — **what quantity does the meter measure?** Pricing models are incentive structures: a platform that bills bytes scanned trains its users into layout engineers; one that bills cluster-time trains them into schedulers and right-sizers. Same physics underneath (columnar blocks, zone maps, vectorized MPP — units 2 and 4 verbatim), different economic gradients on top. We take the three majors in turn, then put one Trellis workload on all three meters."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The three compute/pricing models",
              "statement": "**Snowflake — provisioned elastic clusters, billed by time**: you choose warehouse sizes; the meter runs credits = size × alive-seconds (lesson 3). Isolation is explicit (one warehouse per workload). The optimization gradient points at *runtime and idleness*: pruning and clustering matter because they shorten jobs, not because bytes are billed.\n\n**BigQuery — serverless slot pool, billed by bytes or by capacity**: no clusters exist for the user; queries draw on a shared pool of **slots** (units of compute) scheduled per-stage by the Dremel engine. Two meters: **on-demand** — dollars per TB of data *scanned* (columns read after partition pruning; ~$6.25/TB), compute itself unmetered; or **capacity** — reserved slots per hour (editions), a time-based meter resembling a permanent warehouse. On-demand's gradient points directly at *bytes scanned*: partitioning, clustering, and column discipline are literally bill reductions; a SELECT * over an unpartitioned table is the most expensive sentence in the dialect.\n\n**Redshift — provisioned cluster, billed by node-hours (plus serverless)**: the classic coupled MPP lineage (unit 4) modernized: **RA3** nodes separate compute from managed S3-backed storage, restoring shared-data; but the default operating mode remains a long-lived cluster whose *distribution styles* (KEY/EVEN/ALL) and *sort keys* put unit-4's shuffle-avoidance and zone-map decisions in the schema designer's hands. The gradient points at *sustained utilization*: a well-loaded 24/7 cluster is cost-effective; bursty workloads fight the shape (Redshift Serverless exists to answer exactly this)."
            },
            {
              "type": "example",
              "heading": "Worked example: one workload, three meters",
              "body": "Trellis's BI fleet: 2,000 dashboard queries/day; each, after date pruning, touches ~2 GB of columnar data (projection over the modeled star); runtime ~4 s on an M-class capacity.\n\n**Snowflake**: M warehouse (4 cr/h), multi-cluster; alive ~12 h with gaps ⇒ ~40–48 credits/day ≈ **$130/day** at $3/credit. Meter couples to *alive-time*: idle lulls, cache policy, and concurrency spikes move the bill; bytes scanned per query do not (they move runtime, second-order).\n\n**BigQuery on-demand**: 2,000 × 2 GB = 4 TB scanned/day × $6.25 ⇒ **$25/day** — cheap, *because* the star is well-partitioned so each query scans little. Now un-partition the fact table (or let a SELECT * slip into a popular dashboard): 2,000 × 60 GB = 120 TB ⇒ **$750/day**. Same platform, 30× swing, purely from layout discipline — the meter *is* unit 4's bytes-scanned line item.\n\n**Redshift provisioned**: a cluster sized for the working set and concurrency — say ~$45–90/day for a small RA3 pair — flat regardless of query count while it fits; the engineering effort goes into dist/sort keys so it *keeps* fitting.\n\nThe meta-lesson: none of these is 'cheapest'; each is cheapest for a workload *shape*. Spiky-and-light favors per-byte or per-second serverless; heavy-and-steady favors owned capacity (reserved slots, provisioned cluster, or a Snowflake warehouse that never idles). The platform decision is a workload-integral calculation, and it changes as the company grows — which is why unit 9 treats re-evaluating it as routine FinOps, not betrayal."
            },
            {
              "type": "decision",
              "heading": "Mapping the concepts you own onto the three platforms",
              "rows": [
                [
                  "Zone-map pruning (u4l2)",
                  "Snowflake: micro-partition metadata, automatic. BigQuery: partitioned tables (usually by date) + clustered columns. Redshift: sort keys + zone maps. Same math everywhere"
                ],
                [
                  "Join locality (u4l3)",
                  "Snowflake/BigQuery: optimizer chooses broadcast vs shuffle at run time. Redshift: DISTSTYLE KEY co-locates fact/dim by hash at *load* time; DISTSTYLE ALL replicates small dims — the crossover, decided in the schema"
                ],
                [
                  "Elastic sizing (u5l3)",
                  "Snowflake: warehouse sizes per workload. BigQuery: invisible (slots auto-scheduled) or reserved. Redshift: resize events / serverless RPUs — slowest to flex"
                ],
                [
                  "Workload isolation (u5l1)",
                  "Snowflake: separate warehouses. BigQuery: reservations/assignments per team. Redshift: workload-management queues within one cluster — weakest isolation"
                ],
                [
                  "What the meter trains you to optimize",
                  "Snowflake: runtime + idleness (schedule, suspend, right-size). BigQuery on-demand: bytes scanned (partition, cluster, never SELECT *). Redshift: sustained utilization (keep the cluster busy and well-keyed)"
                ]
              ]
            },
            {
              "type": "code",
              "heading": "The same layout intent, three dialects of cost control",
              "lang": "sql",
              "code": "-- Snowflake: declare the order; a billed background service maintains it.\nCREATE TABLE fact_order_line ( ... )\n  CLUSTER BY (order_ts);          -- unit 4's clustering, as a managed service\n\n-- BigQuery: layout moves the BILL, not just the runtime (on-demand meter).\nCREATE TABLE analytics.fact_order_line\nPARTITION BY DATE(order_ts)        -- coarse pruning; unfiltered queries can be rejected:\nCLUSTER BY channel_id, product_id  -- fine pruning; bytes are billed AFTER both\nOPTIONS (require_partition_filter = TRUE);\n\n-- Redshift: locality is prepaid at load time, in the schema itself.\nCREATE TABLE fact_order_line ( ... )\n  DISTSTYLE KEY DISTKEY (customer_key)  -- co-locate with dim_customer: the\n                                        --   shuffle join, materialized at load\n  COMPOUND SORTKEY (order_ts);          -- zone maps for date pruning\nCREATE TABLE dim_product ( ... ) DISTSTYLE ALL;  -- the broadcast join, prepaid",
            },
            {
              "type": "text",
              "heading": "Loading and the semi-structured escape hatch",
              "body": "Two operational corners complete the platform picture. **Loading**: all three ingest the same way at heart — files staged in object storage, bulk-loaded into native format (`COPY INTO` from a stage in Snowflake; load jobs or external tables in BigQuery; `COPY` from S3 in Redshift). Snowflake adds **Snowpipe**: event-triggered micro-batch loading that fires COPY on file arrival — near-real-time freshness *without* a streaming system, the pragmatic middle of unit 1's batch-to-stream dial (and a preview of unit 8's ingestion spectrum). The unit-2 pipeline shape survives intact: row-binary lands in the raw zone, compaction writes columnar, the warehouse ingests from there — the warehouse replaces the *analytical zone's engine*, not the zones.\n\n**Semi-structured data**: Trellis's clickstream events carry nested, evolving JSON payloads that unit 3's tidy star cannot fully anticipate. Warehouses answer with a variant/JSON column type (Snowflake `VARIANT`, BigQuery `JSON`/nested-repeated fields — the Dremel encoding of unit 2's Parquet aside, come home) that stores semi-structured values *columnarized where possible*: common paths are shredded into internal columns with statistics, so `payload:device.os` prunes and scans like a real column while rare paths fall back to parsed storage. The design guidance: VARIANT is a landing format, not a model — extract stable, queried paths into typed columns in the modeled layer (unit 7's transformations), and leave the long tail queryable in place. It is also the first honest answer to 'why keep a lake at all, then?' — a question the next unit takes up properly."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Benchmarketing is the industry's oldest genre — price your workload, not theirs.** Vendor comparisons choose the workload shape their meter flatters: byte-billed platforms demo tiny pruned scans; time-billed platforms demo sustained saturation; provisioned platforms demo steady-state utilization. The only benchmark that matters is your query mix × your data layout × your concurrency curve, run on trials of each — a week of engineering that regularly re-prices a seven-figure decision. And whatever platform wins, the *skills* transfer wholesale: every dollar saved in this unit came from units 2–4's concepts (layout, pruning, join locality, utilization), not from vendor knowledge."
            },
            {
              "type": "text",
              "heading": "What is now established — and the fork in the road",
              "body": "The cloud warehouse is now complete: shared-data architecture (lesson 1), immutable statistics-bearing storage with versioned metadata giving DML, time travel, and cloning (lesson 2), elastic per-workload compute with a theorem for sizing it (lesson 3), and a market whose real differences are provisioning models and meters that steer user behavior (this lesson). Trellis runs its modeled star in Snowflake, loads via Snowpipe from the unit-2 zones, and its bill is itemized by workload. But notice what the migration quietly did: the modeled layer now lives in a **proprietary format** readable only through one vendor's engine, while the clickstream — too big, too raw, too ML-bound for warehouse economics — still sits in open Parquet in the lake, growing 60 billion rows a year, with no transactions, no DML, and no metadata layer at all. Two storage worlds, two governance stories, one company. The lakehouse — Delta Lake, Iceberg, and Databricks' claim that the lake can *become* the warehouse — is the industry's answer to exactly this fork, and it is unit 6."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A team runs one nightly 45-minute parallel-bound transformation and nothing else. Price a month (30 nights) on: Snowflake L (8 cr/h, $3/credit, suspend at job end); BigQuery on-demand where the job scans 1.8 TB/night; BigQuery on-demand after a partitioning fix cuts scanning to 240 GB/night. Which meter is friendlier to this workload before and after the fix, and what general rule does the flip illustrate?",
                  "solution": "Snowflake: 0.75 h × 8 cr = 6 cr/night × $3 = $18/night → $540/mo (elasticity theorem says any size ≈ same cost). BigQuery before: 1.8 TB × $6.25 = $11.25/night → $337/mo. After: 0.24 × $6.25 = $1.50/night → $45/mo. On-demand wins both before (1.6×) and dramatically after (12×) — because the workload is *brief and byte-light*: time-metered platforms charge for the whole run regardless of bytes, byte-metered ones charge nothing for compute duration. Rule: spiky, byte-efficient workloads favor byte meters; long-running, byte-heavy, or highly concurrent workloads favor time/capacity meters (invert the example — a 45-min job scanning 40 TB nightly: BQ $250/night vs Snowflake's unchanged $18 — the meter flips allegiance with the workload shape).",
                  "hint": "Compute each meter's billed quantity; then invert the byte-to-time ratio and watch the winner flip."
                },
                {
                  "prompt": "Translate Trellis's unit-4 join plan (broadcast dim_product, shuffle dim_customer) into Redshift schema decisions: assign DISTSTYLE and SORTKEY for fact_order_line, dim_product, dim_customer, and state what each choice pre-computes that Snowflake/BigQuery decide at runtime — plus the operational cost of getting it wrong.",
                  "solution": "fact_order_line: DISTSTYLE KEY on customer_key (co-locate with the big dimension to eliminate the shuffle — the repartition join, materialized at load time), SORTKEY (order_ts) for zone-map date pruning. dim_customer: DISTSTYLE KEY on customer_key (same hash space ⇒ every join is node-local). dim_product: DISTSTYLE ALL (replicate to every node — the broadcast join, materialized at load). This bakes unit 4's crossover decisions into the schema: locality is prepaid rather than planned per query. Cost of error: distribution is *static* — if the workload shifts (joins by product dominate, or a new fact needs customer co-location too), the fix is redistributing the table (a rebuild), and a wrong DISTKEY silently reintroduces full shuffles on every affected join; runtime optimizers (Snowflake/BQ) adapt per query and per statistics instead. Static locality buys peak efficiency for a stable workload at the price of agility.",
                  "hint": "DISTSTYLE KEY = shuffle-at-load; ALL = broadcast-at-load; SORTKEY = zone maps."
                },
                {
                  "prompt": "A BigQuery on-demand team discovers their bill is dominated by a monitoring dashboard that runs `SELECT * FROM events WHERE user_id = X` every minute (events: 90 TB, date-partitioned, not clustered by user_id). Diagnose the cost per query and per month, and give the three-step fix with the new cost — citing which unit-4 concept each step applies.",
                  "solution": "Per query: date partitioning doesn't help (no date filter) and user_id is uncorrelated ⇒ full scan of referenced columns; SELECT * references everything ⇒ ~90 TB billed... per query — $562. (In practice BQ caps/errs, but the model holds: this query is catastrophic.) Monthly at 1/min it's unrunnable — which is the point: the meter makes the layout error existential. Fix: (1) column discipline — select only needed columns (projection, u1/u4): 90 TB → ~4 TB; (2) cluster the table by user_id (zone maps for the equality predicate, u4l2): 4 TB → GBs per query; (3) question the access pattern — a per-minute point lookup is an operational read, not analytics: serve it from a keyed store fed by the pipeline (u4l2's 'stop fighting and add a serving copy'; unit 9). End state: dashboard on the serving copy ≈ $0; ad-hoc user queries on the clustered table ≈ cents.",
                  "hint": "What does the meter bill? Then: projection, clustering, and 'is this even an analytical query?'"
                },
                {
                  "prompt": "Write the five-line 'platform memo' for a startup with: 200 GB total modeled data, 3 analysts, no dedicated data team, spiky usage, Google-stack infrastructure — and a different five-line memo for an enterprise with 2 PB, 40 concurrent BI users all day, a 6-person platform team, and strict per-team chargeback requirements. Name the decisive factor in each.",
                  "solution": "Startup: BigQuery on-demand. At 200 GB, most queries scan MBs–GBs — pennies; zero clusters to size, suspend, or babysit (no team to do it); serverless absorbs the spikes; stack affinity lowers integration cost. Decisive factor: operational headcount ≈ 0 — the platform that needs no operator wins, and the byte meter at this scale is effectively free. Enterprise: Snowflake (or BQ capacity — but the memo picks one): per-workload warehouses give the isolation and *itemized chargeback* the org requires (each team's warehouses = each team's bill); steady all-day concurrency favors owned capacity over per-byte exposure (40 users × big scans on-demand is a lottery); the platform team exists to run right-sizing, monitors, and clustering. Decisive factor: isolation + chargeback structure and utilization shape — at sustained load, capacity meters dominate and organizational cost-attribution is worth more than raw price. (Both memos note: revisit annually; the workload integral moves.)",
                  "hint": "Headcount and workload shape decide, not feature checklists."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u5l4-i1",
              "front": "The three compute/pricing models of the warehouse market",
              "back": "Snowflake: provisioned elastic warehouses, billed size × alive-time. BigQuery: serverless slots — on-demand $/TB scanned or reserved capacity. Redshift: provisioned node-hours (RA3 = managed shared storage; serverless option)."
            },
            {
              "id": "u5l4-i2",
              "front": "What does each meter train its users to optimize?",
              "back": "Time-billed (Snowflake): runtime + idleness — scheduling, suspension, right-sizing. Byte-billed (BQ on-demand): bytes scanned — partitioning, clustering, column discipline. Node-billed (Redshift): sustained utilization + load-time locality keys."
            },
            {
              "id": "u5l4-i3",
              "front": "Redshift DISTSTYLE/SORTKEY in unit-4 terms",
              "back": "DISTSTYLE KEY = shuffle join materialized at load (co-location); ALL = broadcast at load (replicated dim); SORTKEY = zone-map clustering. Static prepaid locality vs the runtime optimizers of Snowflake/BQ."
            },
            {
              "id": "u5l4-i4",
              "front": "Which workload shape favors byte meters vs time/capacity meters?",
              "back": "Spiky, brief, byte-efficient (well-pruned) workloads → byte/serverless meters. Sustained, concurrent, byte-heavy workloads → owned capacity. The winner flips with the byte-to-time ratio — price your own integral."
            },
            {
              "id": "u5l4-i5",
              "front": "Snowpipe (and its place on the freshness dial)",
              "back": "Event-triggered micro-batch COPY on file arrival: near-real-time warehouse freshness without a streaming system — the pragmatic middle between nightly batch and unit 8's true streams."
            },
            {
              "id": "u5l4-i6",
              "front": "VARIANT/JSON columns — what they are and the design rule",
              "back": "Semi-structured values stored with common paths shredded into internal statistics-bearing columns (Dremel-style). Rule: a landing format, not a model — promote stable queried paths to typed columns; leave the long tail queryable in place."
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
            "prompt": "Daily workload: ELT 48 nodes × 2 h; BI 6 nodes × 14 h; ad-hoc science 24 nodes × 0.5 h. A coupled shared-nothing cluster must be provisioned at peak (48 nodes... assume the science burst overlaps BI but not ELT, so instantaneous peak = 48) around the clock. Compute the savings ratio R = coupled node-hours / decoupled node-hours, to one decimal.",
            "answer": 6,
            "tolerance": 0.15,
            "explanation": "Coupled: 48 × 24 = 1,152 node-hours/day. Decoupled: 96 + 84 + 12 = 192. R = 1,152/192 = 6.0 — the utilization proposition, R = 1/utilization (here ~17%). The peak-sized always-on cluster pays 6× the work actually demanded.",
            "points": 1
          },
          {
            "id": "u5q2",
            "type": "numeric",
            "prompt": "A parallel-bound job runs 8 h on size S (2 credits/h). Assuming the elasticity theorem holds through XL (16 credits/h), what is the job's cost in credits on XL?",
            "answer": 16,
            "tolerance": 0.5,
            "explanation": "S cost: 2 × 8 = 16 credits. XL has 8× S's capacity ⇒ runtime 1 h ⇒ 16 × 1 = 16 credits — identical. Size cancels for parallel-bound work; you bought 7 hours of latency for free. The promise must be verified against the Amdahl clause before being relied on.",
            "points": 1
          },
          {
            "id": "u5q3",
            "type": "short",
            "prompt": "Two words: name the storage property and the metadata mechanism that together make zero-copy cloning safe (the clone and source can never affect each other).",
            "accept": [
              "immutability, versioning",
              "immutable files, versioned metadata",
              "immutability and versioning",
              "immutable files and version pointers",
              "file immutability, metadata versioning",
              "immutability versioning"
            ],
            "explanation": "Files are immutable (shared bytes can never change under either table) and each table has its own versioned reference list (writes create new files and update only the writer's list). Clone = O(metadata) copy of the list; divergence is private by construction.",
            "points": 1
          },
          {
            "id": "u5q4",
            "type": "mcq",
            "prompt": "A dashboard's query cost zero credits all yesterday (result cache) but bills every execution today. The SQL text is byte-identical and the role unchanged. Which is the most likely cause?",
            "options": [
              "A table referenced by the query now receives intraday writes (micro-batch loads or automatic clustering rewrites), so its version changes between refreshes and invalidates the cached result",
              "The result cache expired permanently after 24 hours and must be rebuilt by an administrator",
              "The warehouse was resized, and the result cache is stored per warehouse size",
              "Auto-suspend evicted the result cache along with the warehouse's SSD cache"
            ],
            "answer": 0,
            "explanation": "The result cache lives in the services layer and requires identical text + unchanged table versions; the usual silent breaker is a new intraday writer (including background clustering) churning versions. (b) the 24 h window rolls per result and rebuilds automatically on any serving execution — no admin involved; (c) result caching is warehouse-independent (that's why it costs zero credits); (d) suspension kills the *SSD* cache, not the services-layer result cache.",
            "points": 1
          },
          {
            "id": "u5q5",
            "type": "proof",
            "points": 2,
            "prompt": "Prove the elasticity theorem and derive its Amdahl breakdown: (a) show that for perfectly parallelizable work, job cost is independent of warehouse size while latency scales as 1/s; (b) show that with runtime T(s) = a + b/s (serial fraction a), cost is c·(a·s + b) — monotonically increasing in s — and identify the size beyond which doubling buys less than 25% latency improvement, in terms of a and b.",
            "rubric": [
              "(a) Sets up cost = burn rate × runtime = (c·s)·(W/(k·s)) and shows s cancels; states latency T = W/(k·s) ∝ 1/s",
              "(b) Substitutes T(s) = a + b/s into cost = c·s·T(s) and obtains c·(a·s + b), noting monotonic growth in s with latency floor a",
              "Latency-improvement analysis: computes the relative gain of doubling, (T(s) − T(2s))/T(s) = (b/2s)/(a + b/s) = b/(2as + 2b), and sets it < 1/4 to solve s > b/a",
              "Interprets the result: past s ≈ b/a (serial time ≈ parallel time remaining), further doubling costs ∝ s for < 25% gains — the operational 'knee' where measurement should halt scaling"
            ],
            "solution": "(a) Perfect parallelism: capacity k·s, runtime T(s) = W/(k·s), burn rate c·s credits/hour. Cost = c·s · W/(k·s) = cW/k — no s. Latency scales as 1/s: each doubling halves runtime at constant cost; size is purely a latency dial. (b) With serial fraction: T(s) = a + b/s (a = irreducible serial time, b = parallelizable time at s = 1). Cost = c·s·(a + b/s) = c(as + b): strictly increasing in s — every doubling now adds c·a·s of pure cost — while latency approaches the floor a. Gain from doubling: T(s) − T(2s) = b/s − b/2s = b/(2s); relative gain = (b/2s)/(a + b/s) — multiply numerator and denominator by s — = b/(2as + 2b). Set b/(2as + 2b) < 1/4 ⟺ 4b < 2as + 2b ⟺ 2b < 2as ⟺ s > b/a. So once s exceeds b/a — equivalently once the remaining parallel time b/s falls below the serial time a — each doubling improves latency by under 25% while cost grows linearly. Operational reading: measure one doubling; if runtime didn't near-halve, fit (a, b) from two runs, locate b/a, and stop scaling there — spend effort on shrinking a instead. ∎",
            "explanation": "The unit's central economic result with its failure boundary made quantitative: elasticity is free exactly while parallel time dominates, and the knee s = b/a is computable from two measured runs — turning 'should we size up?' from taste into arithmetic."
          },
          {
            "id": "u5q6",
            "type": "open",
            "points": 2,
            "prompt": "Design Trellis's complete Snowflake deployment: warehouses (sizes, auto-suspend, multi-cluster where justified) for nightly ELT (parallel-bound, currently 6 h on M), business-hours BI (bursty, ~30 concurrent at peak, hot working set ~80 GB), weekly data-science backtests, and a dev environment; clustering/retention policy for fact_order_line (time-filtered queries dominate; occasional per-customer investigations) and for high-churn staging tables; plus the two account-level guardrails you would set. Quantify at least the ELT sizing decision and one retention decision.",
            "rubric": [
              "ELT: applies the elasticity theorem with numbers (e.g., 6 h × 4 cr/h = 24 cr on M ⇒ XL ≈ 1.5 h ≈ 24 cr — same cost, earlier data), auto-suspend ~60 s, with a stated verification step (measure near-halving / Amdahl check before relying on it)",
              "BI: sized for concurrency and cache (M or L holding the ~80 GB working set on SSD), multi-cluster (e.g., 1–3) for the peak, auto-suspend relaxed (10–15 min) or pre-warm — with the cache-vs-idleness trade-off explicitly argued; science and dev: ephemeral, aggressive suspend, dev cloned zero-copy from prod rather than copied",
              "Storage policy: fact_order_line — natural time clustering kept (or CLUSTER BY channel/order_ts justified against auto-clustering credit cost), per-customer investigations served by pruning-aware means or explicitly deprioritized; long retention on modeled tables vs retention 0–1 + TRANSIENT on high-churn staging, justified by churn × retention pricing",
              "Guardrails: resource monitors with caps/alerts per warehouse and an account policy on max auto-suspend (or per-workload warehouse discipline) — tied to the lesson-3 idle-warehouse failure mode; overall answer derives choices from the unit's propositions rather than asserting vendor defaults"
            ],
            "solution": "Warehouses. ELT_WH: XL, auto-suspend 60 s, auto-resume. Arithmetic: M = 4 cr/h × 6 h = 24 credits; parallel-bound ⇒ XL (16 cr/h) ≈ 1.5 h ≈ 24 credits — identical cost, data ready by ~3:30 instead of 8:00; verify with one L run (expect ≈ 3 h) before committing, per the Amdahl clause. BI_WH: M multi-cluster 1–3 (peak 30 concurrent is a queueing problem — scale out, not up), auto-suspend 15 min: each resume cold-starts the ~80 GB working set from object storage, and a dozen daily cold restarts tax every analyst; ~pennies of idle burn is the cheaper side of the trade. Pre-warm at 07:55 via a scheduled query touching the hot tables. SCI_WH: XL, suspend 60 s, resume on demand — exists only during backtests. DEV: L, suspend 60 s, and the environment itself is CREATE DATABASE dev CLONE analytics (zero-copy; storage grows only with divergence; refresh weekly by re-clone). Storage. fact_order_line: loaded in time order — natural clustering serves the dominant date-filtered workload (partitions scanned ≈ answer-proportional); do *not* add CLUSTER BY customer_id — it would fight the time order and bill automatic clustering forever for a minority workload; per-customer investigations either tolerate the scan or (if they become an SLA) get a keyed serving copy in unit 9's terms. Retention: modeled tables 30–90 days (low churn: nightly incremental loads touch recent partitions only, so retained storage ≈ recent churn, cheap insurance for fat-finger recovery per lesson 2's runbook); staging tables TRANSIENT with retention 0–1 day — they rewrite wholesale on every run, and churn × retention would price a nightly full copy per retained day for tables with no recovery value (raw-zone replay covers them). Guardrails: (1) resource monitors per warehouse — notify at 75%, suspend at 110% of monthly budget — making the lesson-3 'forgotten L over a long weekend' structurally loud; (2) account policy: auto-suspend may not exceed 60 min without platform review, and every warehouse is named by workload/owner so the bill stays itemized. All choices trace to the unit's propositions: elasticity for ELT, cache-vs-idleness for BI, churn × retention for storage, utilization clause for the guardrails.",
            "explanation": "The unit synthesized as one deployment: every sizing, suspension, clustering, and retention choice derived from a proposition (elasticity, Amdahl, pruning regimes, churn pricing) with the arithmetic shown — which is exactly what the course grader rewards over vendor-default recitation."
          }
        ]
      }
    },
    {
      "id": "u6",
      "title": "Lakes and the Lakehouse",
      "summary": "The data lake and its failure modes, Spark, Delta Lake's transaction log, Iceberg's metadata tree, and the honest warehouse-versus-lakehouse decision.",
      "intro": "Unit 5 ended at a fork Trellis could not avoid: the modeled star thrives in Snowflake's proprietary comfort, while the clickstream — 60 billion rows a year, half-structured, feeding ML as much as BI — sits in open Parquet with no transactions, no schema enforcement, and no way to delete a user who asks to be forgotten. This unit is about that second world and the decade-long project to civilize it. The first lesson takes the data lake seriously — why it exists, what it is genuinely best at — and then catalogs, with incidents, exactly how it degenerates into a swamp; the failures form a requirements list. The second lesson covers the lake's engine: Spark — lineage, lazy evaluation, stages and shuffles — taught through the clickstream job that motivates it. The third lesson is the pivot of the unit: Delta Lake's transaction log, which rebuilds unit 5's 'immutable files plus versioned metadata' in the open, with the commit protocol proved correct rather than trusted. The fourth lesson adds Iceberg's alternative construction, states the lakehouse argument as its authors make it, and closes the fork honestly: when the warehouse wins, when the lakehouse wins, and what Trellis actually ships. The gate asks you to reason about torn writes, price a GDPR delete three ways, and defend a platform decision with numbers.",
      "references": [
        "Armbrust et al. — Delta Lake: High-Performance ACID Table Storage over Cloud Object Stores (VLDB 2020)",
        "Armbrust, Ghodsi, Xin & Zaharia — Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics (CIDR 2021)",
        "Zaharia et al. — Resilient Distributed Datasets (NSDI 2012)",
        "Apache Iceberg table format specification (iceberg.apache.org/spec)",
        "Martin Kleppmann — Designing Data-Intensive Applications, ch. 10 (batch processing; the lineage idea in context)"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u6l1",
          "title": "The Data Lake: Promise, Physics, and Swamp",
          "estMinutes": 26,
          "builds_on": [
            "u2l3",
            "u5l4"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Why the lake exists at all",
              "body": "If the warehouse of unit 5 is so capable, why did Trellis leave the clickstream out of it? Four honest reasons, each a real engineering force and not mere fashion. **Scale economics**: 60 billion events a year is ~20 TB/year compressed; in object storage that is ~$5,500/year to hold — and the events are scanned in bulk by a few ML and sessionization jobs, not dashboarded by thirty analysts, so the warehouse's premium compute and per-workload isolation buy little. **Schema volatility**: the mobile team ships event payload changes weekly; forcing every change through modeled DDL would either block releases or produce a warehouse full of half-mapped VARIANT columns — the lake's **schema-on-read** stance (store now, interpret at query time) matches data whose meaning is still moving. **ML access**: training pipelines want raw history as files — Parquet read directly into dataframes at full parallel bandwidth — not row-limited SQL cursors through a warehouse driver. **Openness**: Parquet on S3 is readable by every engine that will exist in ten years; unit 5 closed on the lock-in cost of proprietary formats. These forces are permanent, which is why the lake never lost to the warehouse and the industry needed a synthesis instead of a winner."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Data lake; schema-on-read",
              "statement": "A **data lake** is an architecture in which the durable analytical store is a cloud object store (or HDFS, historically) holding data as files in open formats (Parquet, Avro, JSON, …), organized by path convention (unit 2's zones and dt= partitions), with compute engines (Spark, Trino, warehouse external tables) reading the files directly. Storage carries **no database services of its own**: no transactions, no schema enforcement, no DML, no indexes — only the object-store contract of unit 2.\n\n**Schema-on-read** defers interpretation to query time: the reader asserts a schema (or infers one) when it reads, rather than the store enforcing one at write. Its strength is admitting data whose structure is evolving or heterogeneous; its cost is that *every reader re-decides what the data means*, and nothing at the storage layer stops a producer from writing files that silently break every reader — unit 2's loud-failure argument, inverted. (Self-describing formats like Parquet soften this: the file declares its own schema; what is missing is a *table-level* contract across many files and writers.)"
            },
            {
              "type": "example",
              "heading": "Worked example: the torn write, on schedule",
              "body": "Trellis's sessionization job (lesson 2 builds it) rewrites the last three days of `analytics/sessions/` nightly — 41 files. One night the Spark driver is killed by a spot-instance reclaim after writing 17 of 41 files into the target prefix. There is no transaction: the object store executed 17 successful PUTs (unit 2's contract — *no multi-object atomicity* — collecting its debt).\n\nAt 06:10, the marketing dashboard's first query reads the prefix: 17 new files + 24 stale files, some date ranges doubled (new file written, old not yet deleted), some missing. Every number it produces is wrong, *silently* — no error occurred anywhere. At 07:30 the rerun completes the write; numbers change again. The postmortem's finding is structural, not procedural: **on a plain lake, readers can observe every intermediate state of every multi-file writer**, and the only defenses are conventions — write to a temp prefix then 'rename' (which on S3 is a copy-per-object, itself non-atomic), or partition-swap protocols that every reader and writer must correctly implement, forever. Convention-based atomicity is a bug with a deferral schedule. Requirement #1 for civilizing the lake: **atomic multi-file commits with snapshot isolation** — readers see version N or N+1, never 17/41ths of N+1."
            },
            {
              "type": "example",
              "heading": "Worked example: the right to be forgotten, priced against plain Parquet",
              "body": "A user invokes GDPR erasure. Their events are scattered through the clickstream lake: f = 1 in 4 M users, files of n ≈ 5 M rows. Unit 4's uncorrelated-layout mathematics returns, wearing a compliance costume: the probability a given file contains at least one of the user's rows is 1 − e^{−fn} = 1 − e^{−1.25} ≈ **71%** of all files. And Parquet files are immutable: removing three rows from a file means **rewriting the file**.\n\nSo the erasure job must read and rewrite ~71% of a 20 TB-per-year lake — call it ~40 TB of I/O per deletion batch across three years of history — with no transaction around the rewrite (see previous example: a crash mid-erasure leaves the lake torn *and* non-compliant), no record proving which files changed and why, and no protection against a concurrent writer re-adding a copy. Batch the requests monthly and it is still a monthly full-lake rewrite. Requirements #2–4 fall out directly: **row-level DML** (DELETE/UPDATE/MERGE as table operations, not hand-rolled file surgery), **an auditable change log** (what changed, when, by what), and **concurrency control** between writers. Add requirement #5 from the schema-drift incidents unit 2 catalogued — **table-level schema enforcement with controlled evolution** — and #6 from unit 2's small-files economics — **maintained compaction and clustering as table services** — and the requirements list is complete. It is also, item for item, the feature list of Delta Lake and Iceberg; lessons 3 and 4 are the two constructions."
            },
            {
              "type": "text",
              "heading": "The swamp is a governance failure with a physics substrate",
              "body": "'Data swamp' is usually told as an organizational morality tale — nobody documented anything, nobody owned anything, five teams wrote five date formats into the same prefix. All true; unit 9 takes governance seriously. But the physics deserves equal billing: the swamp is what the object-store contract *defaults to* when nothing supplies the missing database services. No schema enforcement means every producer's drift lands successfully (the discount incident, at lake scale, daily). No transactions means every multi-file writer is a torn-read generator. No DML means corrections are full rewrites, so corrections don't happen and known-wrong data accretes. No compaction duty means streaming ingest shreds prefixes into millions of small files until queries cost more in requests than in bytes. Each failure is individually survivable; compounded across two years and forty pipelines, the lake becomes a place where **no query can be trusted without forensic work**, which is the operational definition of a swamp. The two-zone discipline of unit 2 — immutable raw, compacted analytical — was the manual, partial antidote: it contains the blast radius but polices none of the six requirements. What the industry actually built is a *table format*: a metadata layer that makes a set of Parquet files behave like a database table. That layer is the subject of the rest of this unit."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**Keep the lake's virtues in view while cataloguing its sins.** The failure list can read like an argument to put everything in the warehouse — but every failure is a missing *service*, while every virtue (open formats, object-store economics, schema tolerance, direct file access for ML, engine plurality) is *structural*. The lakehouse bet, stated precisely, is that services can be added to the open substrate more easily than openness can be added to a proprietary service. Whether that bet beats the warehouse for a given workload is a real decision — lesson 4 gives it a framework, not a slogan."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The lake exists for permanent reasons — economics at event scale, schema volatility, ML file access, openness — and fails for equally structural ones: the object store's missing services turn multi-file writes into torn reads, erasure into 40 TB rewrites, drift into silent corruption, and time into swamp. The six-item requirements list (atomic commits + snapshot isolation, row-level DML, audit log, writer concurrency control, schema enforcement/evolution, maintained compaction/clustering) is the specification the table formats were built against. Before the formats, though, the engine: nearly everything that reads or writes Trellis's lake does so through Spark, and the table formats' design choices — file-level operations, log replay, optimistic concurrency — assume Spark-shaped consumers. Ten honest pages on Spark are next."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "For each workload, argue lake or warehouse as the *primary* home using the four lake forces (economics, schema volatility, ML access, openness) and unit 5's warehouse strengths: (a) the finance team's revenue star, 200 GB, 40 dashboard users; (b) ad-impression logs, 80 TB/year, feeding attribution models and occasional ad-hoc scans; (c) product telemetry whose event schema changes weekly, consumed by one analytics engineer.",
                  "solution": "(a) Warehouse: small, stable schema, high-concurrency BI — exactly unit 5's sweet spot (isolation, caches, semantic stability); no ML file access needed; economics trivial at 200 GB. (b) Lake(house): scale economics dominate (80 TB/year of bulk-scanned data), ML pipelines want file access, dashboard concurrency is low; the warehouse would charge premium compute for jobs that are batch scans. (c) Lake: schema volatility is the binding force — schema-on-read absorbs weekly drift without DDL ceremony; one consumer means governance overhead is low; promote stable slices to modeled tables later (unit 7). The pattern: concurrency + stability → warehouse; scale + volatility + ML → lake.",
                  "hint": "Ask each workload which forces bind: who reads it, how fast it changes, how big it is."
                },
                {
                  "prompt": "A colleague proposes fixing the torn-write problem by convention: 'write to sessions_tmp/, then rename to sessions/, and tell every reader to only read sessions/'. Using the object-store contract (unit 2), explain the two ways this still fails on S3-class storage, and what property a real fix must have.",
                  "solution": "(1) 'Rename' of a prefix is not an operation S3 has: it is a copy of every object then a delete of every original — a long non-atomic sequence; a crash mid-'rename' tears exactly as before, and readers can see mixed old/new during it. (2) Even if each object copy is atomic, the *set* switch is not: there is no instant at which all 41 files change identity together, so a reader listing mid-switch sees a mixture; and LIST is eventually-then-strongly consistent about *keys*, not about your intended set membership. A real fix needs a single atomic operation that switches the entire table state — which is only achievable by making the state a *single small object or pointer* (a log entry, a metadata file) that readers consult before reading data files: exactly the table-format move of lessons 3–4.",
                  "hint": "What single atomic primitive does the object store actually offer, and how big is the thing it can switch?"
                },
                {
                  "prompt": "Recompute the GDPR blast radius under two layout changes, and draw the design conclusion: (a) files shrink to n = 500 k rows; (b) the lake is clustered by user_id (each user's rows concentrated in 1–2 files). For (a) and (b), what fraction/number of files must be rewritten per erased user, and what does each change cost the rest of the workload?",
                  "solution": "(a) f·n = 500,000/4,000,000 = 0.125 ⇒ fraction touched 1 − e^{−0.125} ≈ 11.8% — better than 71%, but the lake now has 10× more files: unit 2's request-cost pathology returns for every scan; you traded erasure cost for everyone's query cost. (b) Clustered by user: ~1–2 files rewritten per user — erasure is nearly free — but unit 4's one-physical-order budget was spent on user_id: time-range queries (the dominant analytical family) lose their pruning and scan everything. Conclusion: layout alone cannot serve both compliance and analytics; the honest fix is a *mechanism*, not a layout — row-level DML with merge-on-read (deletion vectors, lesson 3) that marks rows cheaply without rewriting files or re-clustering the world.",
                  "hint": "Both are 1 − e^{−fn} games; then ask what each parameter change does to scans."
                },
                {
                  "prompt": "Write the six-item requirements list from this lesson from memory, and for each item name the concrete incident (from this course or your own experience) that motivates it.",
                  "solution": "1. Atomic multi-file commits with snapshot isolation — the 17-of-41 torn sessionization write read by the 06:10 dashboard. 2. Row-level DML — the GDPR erasure requiring ~71%-of-lake rewrites by hand. 3. Auditable change log — the erasure job that cannot prove what it changed (and unit 1's 'why did Tuesday's numbers change?'). 4. Writer concurrency control — compaction racing streaming appends to the same prefix (or the erasure racing a re-ingest). 5. Schema enforcement with controlled evolution — the discount semantic drift and unit 2's shifted-CSV, landing 'successfully' at lake scale. 6. Maintained compaction/clustering as table services — unit 2's small-files pricing and unit 4's clustering decay, which conventions never keep up with. Together: the specification of a table format.",
                  "hint": "Each requirement is a named incident with the missing service circled."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u6l1-i1",
              "front": "The four structural forces that keep data lakes existing",
              "back": "Object-store economics at event scale; schema volatility (schema-on-read absorbs drift); ML's need for direct parallel file access; open formats readable by every engine (anti-lock-in)."
            },
            {
              "id": "u6l1-i2",
              "front": "Schema-on-read — strength and cost",
              "back": "Interpretation deferred to query time: admits evolving/heterogeneous data without DDL ceremony; but every reader re-decides meaning and the store stops no producer from silently breaking all of them."
            },
            {
              "id": "u6l1-i3",
              "front": "Why are torn reads structural (not procedural) on a plain lake?",
              "back": "The object store has no multi-object atomicity: a multi-file writer's intermediate states are all observable; 'temp prefix + rename' is a non-atomic copy sequence on S3. Fix requires switching table state via one atomic small object."
            },
            {
              "id": "u6l1-i4",
              "front": "The GDPR arithmetic on an unclustered Parquet lake",
              "back": "P(file touched) = 1 − e^{−fn}; with n = 5 M rows and 1-in-4 M users ≈ 71% of files must be rewritten per user — immutable files turn row deletion into near-full-lake rewrites without row-level DML."
            },
            {
              "id": "u6l1-i5",
              "front": "The six requirements a table format must satisfy",
              "back": "Atomic commits + snapshot isolation; row-level DML; auditable change log; writer concurrency control; schema enforcement/evolution; maintained compaction & clustering as table services."
            },
            {
              "id": "u6l1-i6",
              "front": "The lakehouse bet, stated precisely",
              "back": "Database services can be layered onto the open substrate (files + object store) more easily than openness can be retrofitted onto a proprietary warehouse — a bet to evaluate per workload, not a slogan."
            }
          ]
        },
        {
          "id": "u6l2",
          "title": "Spark: The Lake's Engine in Ten Pages",
          "estMinutes": 27,
          "builds_on": [
            "u4l1",
            "u4l3",
            "u6l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "What Spark is, without the mythology",
              "body": "Spark began (2010–2012, Berkeley) as an answer to MapReduce's central waste: MapReduce persisted every intermediate result to disk for fault tolerance, so multi-stage jobs — and iterative ML above all — spent their lives writing and rereading scratch data. Spark's founding idea, the **resilient distributed dataset**, was to make fault tolerance *informational* instead of *material*: keep intermediates in memory, and instead of replicating them, remember the **lineage** — the recipe of transformations that produced each partition — so a lost partition is *recomputed*, not restored. Everything else grew around that seed: a lazy, DAG-building API; a SQL optimizer (Catalyst) compiling dataframe operations into unit-4-style physical plans; and eventually vectorized native execution (Databricks' Photon) that is unit 4's first lesson wearing a C++ jacket. For this course's purposes Spark is two things: the general-purpose compute layer of the lake — the thing that runs sessionization, compaction, GDPR erasure, and table-format maintenance — and a live demonstration that every concept from unit 4 transfers outside the warehouse."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "RDDs, lineage, transformations, stages",
              "statement": "A **resilient distributed dataset (RDD)** is an immutable, partitioned collection with a deterministic recipe: either a source (files, a table) or a **transformation** of parent RDDs (map, filter, join, groupBy). The recipe graph is the **lineage**. Transformations are **lazy** — they build the DAG; only an **action** (write, collect, count) triggers execution.\n\nDependencies classify as **narrow** — each output partition depends on a bounded set of parent partitions (map, filter: partition-to-partition) — or **wide** — each output partition depends on *many* parent partitions (groupBy, join by a new key): a wide dependency is exactly unit 4's **shuffle**. The scheduler cuts the DAG at wide dependencies into **stages**: within a stage, narrow ops pipeline in memory partition-by-partition; between stages, data repartitions across the cluster.\n\n**Fault tolerance by lineage**: if an executor dies, its partitions are recomputed from parents along the lineage (narrow: cheap, local recompute; wide: requires parents' shuffle outputs, which is why shuffle files are materialized and why long lineages past many shuffles motivate **checkpointing** — cutting lineage by persisting a stage's output durably)."
            },
            {
              "type": "example",
              "heading": "Worked example: sessionizing the clickstream",
              "body": "The job unit 1's lifecycle promised: turn raw events into sessions (a visit = events by one user with gaps < 30 minutes). Input: one day, ~165 M events, ~50 GB compressed Parquet in `analytics/events/dt=2026-08-26/`. Logic: *for each user*, sort events by time, start a new session whenever the gap exceeds 30 minutes, emit one row per session (user, start, end, pages, device, converted).\n\nRead it as the definition demands. 'For each user' is a **wide dependency**: events for one user are scattered across all input files (arrival order ≈ time, not user — unit 4's uncorrelated layout, again), so the job must **shuffle by user_id** — every event crosses the network to the executor owning hash(user_id). 'Sort by time within user' is narrow *after* the shuffle (each partition sorts locally). The gap-and-emit pass is narrow. So the physical plan is two stages: **Stage 1** — scan (with dt= pruning and column projection: unit 4 line items), project the ~6 needed columns, shuffle-write by user_id (~15 GB after projection); **Stage 2** — shuffle-read, sort within partition, sessionize, write ~40 M session rows (~2 GB) back to the lake. On 16 executors the wall clock is dominated by Stage 1's scan and the 15 GB shuffle — and every diagnosis tool from unit 4 applies verbatim: a slow job here is scanned-bytes (missing projection/pruning), shuffled-bytes (needless columns through the shuffle), or one towering partition (a bot account with 40 M events — unit 4's skew, mitigated by salting or by capping events per user per day)."
            },
            {
              "type": "code",
              "heading": "The job, in dataframe form (and what each line becomes)",
              "lang": "text",
              "code": "sessions = (spark.read.parquet(\"analytics/events/dt=2026-08-26/\")   # scan: pruning+projection\n    .select(\"user_id\",\"event_ts\",\"page\",\"device\",\"event_type\")       # projection (Catalyst\n    .repartition(\"user_id\")                                          #   pushes it into the scan)\n    .sortWithinPartitions(\"user_id\",\"event_ts\")                      # narrow, post-shuffle\n    .withColumn(\"new_sess\",                                          # gap > 30 min ⇒ boundary\n        (col(\"event_ts\") - lag(\"event_ts\").over(w_user) > 1800).cast(\"int\"))\n    .withColumn(\"session_id\", sum(\"new_sess\").over(w_user_ordered))  # running count per user\n    .groupBy(\"user_id\",\"session_id\")                                 # narrow: data already\n    .agg(min(\"event_ts\"), max(\"event_ts\"), count(\"*\"), ...)          #   partitioned by user\n    .write.parquet(\"analytics/sessions/dt=2026-08-26/\"))             # ACTION — DAG executes\n\n# Stage cut: everything before repartition = Stage 1; after = Stage 2.\n# Lazy until .write — Catalyst sees the WHOLE plan, so the .select's projection\n# is pushed into the Parquet scan and unused columns never leave the files."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Lineage recovery beats replication exactly when failures are rare",
              "statement": "Consider a stage producing intermediate data of size D across P partitions in time T. **Replication** (MapReduce-style durable intermediates) pays a certain, always-on cost: materializing D (and typically a second copy) every run — ΔT_repl ≈ c·D per run, failure or not. **Lineage** pays only on failure: expected cost ≈ p_fail · (T_recompute of lost partitions), where recompute of one lost partition after a narrow chain is T/P (recompute just that slice). Hence lineage wins whenever per-run failure probability × recompute cost < certain materialization cost — the common case for minute-scale stages on reliable clusters — and loses (motivating checkpoints) when lineages grow long across many shuffles, when recompute is expensive relative to storage (long chains, wide fan-in), or when failures are frequent (spot fleets).",
              "proof": "Replication's cost is unconditional: every run writes D durably (cost c·D) whether or not anything fails; over R runs, R·c·D. Lineage's cost over R runs: R·p_fail·E[recompute]. For a narrow chain, one lost partition requires recomputing only its own slice through the chain: E[recompute] ≈ T/P per lost partition (parents are still available as source files or prior shuffle outputs). The comparison R·p_fail·T/P < R·c·D reduces to p_fail·T/P < c·D — with minute-scale T, hundreds of P, and single-digit-percent p_fail, the left side is seconds against a certain multi-GB write. The reversal conditions follow from the same inequality: wide dependencies make E[recompute] balloon (a lost post-shuffle partition needs *all* upstream shuffle outputs; if those were lost too, recomputation cascades upstream — cost approaching T, not T/P), long lineages multiply chain length, and spot fleets raise p_fail — each growing the left side until durable checkpointing (paying c·D once at a chosen cut) is the cheaper insurance. Spark's design encodes exactly this arithmetic: narrow intermediates in memory, shuffle outputs materialized locally, explicit checkpoints where lineage grows dangerous. ∎"
            },
            {
              "type": "text",
              "heading": "From RDDs to Catalyst to Photon: unit 4 comes home",
              "body": "Nobody writes production RDD code anymore; the working surface is **DataFrames/Spark SQL**, and the reason is unit 4's reason: declarative plans can be *optimized*. **Catalyst** takes the logical plan (the whole plan — laziness is what makes this possible), applies the classics — predicate and projection pushdown into scans (your `.select` becoming Parquet column pruning), join reordering, constant folding — then chooses physical operators with unit 4's exact decision table: broadcast-hash join when the small side fits (the crossover proposition; Spark's `autoBroadcastJoinThreshold` is that inequality with a config knob), sort-merge/shuffle join otherwise. **Adaptive Query Execution (AQE)** re-plans at stage boundaries using *observed* sizes: demoting a shuffle join to broadcast when a filter shrank one side, coalescing straggly partitions, and splitting skewed ones — unit 4's skew remedies, automated. And **Photon** replaces JVM row-ish execution with a native vectorized engine — batched columnar primitives, SIMD, late materialization: lesson u4l1 verbatim, which is why Databricks' benchmark claims center on CPU-bound SQL. The takeaway for a data engineer: a Spark UI is read with unit 4's four line items (scanned, shuffled, peak partition, rows per stage), and a Spark tuning session is unit 4's checklist — push projections early, prune partitions, watch the broadcast threshold, hunt skew — with different knob names."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Spark's sharp edge is the collect-shaped anti-pattern.** `collect()`, `toPandas()`, and giant broadcast hints pull distributed data onto one JVM — the driver — and the job that processed 50 GB across 16 executors dies OOM assembling 8 GB on one machine. The rule: data leaves the cluster only through *writes* (to the lake, a table, a message bus) or through *aggressive aggregation* (the dashboard-sized result of unit 4's two-phase aggregate). If a step needs pandas, use the distributed pandas-on-Spark API or Arrow-batched UDFs (unit 4's vectorized-UDF lesson) — never a driver-side collect of the raw."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Spark is the lake's general-purpose executor: immutable partitioned datasets with lineage-based recovery (proved cheaper than replication exactly when failures are rare and lineages short), lazy DAGs cut into stages at shuffles, Catalyst applying unit 4's optimizations to whole plans, AQE patching them with runtime facts, and Photon running the vectorized playbook. The sessionization job is built and its costs are legible with unit-4 eyes. But notice what the job still does at its final line: `.write.parquet(...)` into a prefix — the exact torn-write generator lesson 1 dissected. The engine is civilized; the *storage* still isn't. Making that final write transactional — a log-governed atomic commit over the same open files — is Delta Lake, next."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Classify each transformation as narrow or wide for the sessionization pipeline, and mark where the stage boundaries fall: (a) filter(event_type != 'heartbeat'); (b) repartition('user_id'); (c) sortWithinPartitions('user_id','event_ts'); (d) groupBy('user_id','session_id').agg(...); (e) join with a 2 MB device-lookup dataframe.",
                  "solution": "(a) Narrow — per-partition filter, pipelined in Stage 1. (b) Wide — the shuffle; stage boundary here. (c) Narrow — local sort of already-partitioned data (Stage 2). (d) Narrow *in this pipeline* — data is already partitioned by user_id, and (user_id, session_id) is a refinement of that partitioning, so no second shuffle is needed (Catalyst recognizes the existing distribution); in general groupBy is wide. (e) Narrow via broadcast — 2 MB is far under any broadcast threshold (unit 4's crossover: |D| ≪ |F|/W), so the lookup ships to every executor and joins map-side; no boundary. Final stage count: 2.",
                  "hint": "Wide = data must regroup by a new key that current partitioning doesn't already satisfy."
                },
                {
                  "prompt": "A 40-minute job on 200 spot executors (per-run executor-loss probability ~15%) has this shape: scan → narrow chain (25 min) → shuffle → heavy aggregation (15 min). Using the lineage proposition, identify where a lost executor is cheap, where it is expensive, and where you would place a checkpoint (or equivalent) and why.",
                  "solution": "Cheap: losses during the narrow chain — each lost partition recomputes just its slice from source files (≈ T/P ≈ seconds-to-minutes, local). Expensive: losses *after* the shuffle — a lost Stage-2 partition needs shuffle outputs from all 200 upstream executors; if the lost executor also held shuffle files, upstream slices must recompute too (cascade toward whole-stage rerun — the wide-dependency clause). With p_fail = 15% per run this expected cascade cost is material, so cut the lineage at the shuffle: persist Stage 1's output durably (checkpoint / write to the lake / a shuffle service that survives executor loss). That converts post-shuffle recovery to 'reread a durable input', bounding recompute at T_stage2 regardless of upstream losses — paying c·D once, exactly the proposition's reversal condition.",
                  "hint": "Narrow losses recompute a slice; post-shuffle losses fan in. Where does the inequality flip?"
                },
                {
                  "prompt": "The sessionization job suddenly takes 4× longer. The Spark UI shows: input 50 GB (unchanged), shuffle write 61 GB (was 15 GB), stage 2 median task 40 s / max task 42 s. Diagnose using unit 4's line items, find the likely code change, and fix it.",
                  "solution": "Line items: scanned unchanged; *shuffled* quadrupled; no skew (median ≈ max). A 4× shuffle with equal input means the projection before the shuffle widened — someone moved the .select after the repartition (or added columns, e.g. carrying the full payload struct through the shuffle 'to use later'). Catalyst pushes projections into scans, but it cannot un-ship columns you reference downstream of the shuffle. Fix: restore projection-before-shuffle — select only the six needed columns (or pre-extract the needed payload fields) upstream of repartition; shuffle returns to ~15 GB and the job to ~1×. Moral: in distributed plans, *where* you narrow the data matters as much as whether you do — bytes through the exchange are the bill.",
                  "hint": "Which of the four line items moved, and what controls bytes entering a shuffle?"
                },
                {
                  "prompt": "Explain to a new engineer why their notebook cell `df.toPandas()` on the 165 M-row events dataframe crashed the driver with OOM while every previous cell ran fine — and give the three legitimate patterns for 'I need this in pandas-ish form', each with its size regime.",
                  "solution": "Previous cells built lazy plans or ran distributed actions (results stayed on executors / tiny aggregates returned); toPandas() *collects the entire distributed dataset into the single driver JVM* then converts — 165 M rows ≫ driver memory. Patterns: (1) aggregate first — if the real need is a chart or summary, reduce distributed (groupBy/agg) to dashboard-sized rows, then toPandas() on thousands of rows (the two-phase-aggregation shape); (2) sample — df.sample(0.001).toPandas() for exploratory eyeballing, explicit about representativeness; (3) stay distributed — pandas-on-Spark API or Arrow-vectorized UDFs (unit 4's batch-UDF lesson) when pandas-style logic must run over all rows: the code feels like pandas, the execution stays on executors. Raw full collects are never a pattern — data leaves the cluster via writes or via aggregation.",
                  "hint": "Where does collected data physically land, and how big is that machine?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u6l2-i1",
              "front": "RDD + lineage — the founding Spark idea",
              "back": "Immutable partitioned datasets defined by deterministic recipes; fault tolerance by *recomputing* lost partitions along the lineage instead of replicating intermediates — informational, not material, redundancy."
            },
            {
              "id": "u6l2-i2",
              "front": "Narrow vs wide dependencies, and what cuts a stage",
              "back": "Narrow: output partition depends on bounded parents (map/filter) — pipelined in memory. Wide: depends on many parents (groupBy/join on new key) = a shuffle; the DAG is cut into stages at wide dependencies."
            },
            {
              "id": "u6l2-i3",
              "front": "When does lineage recovery lose to checkpointing?",
              "back": "p_fail × recompute > certain materialization: long lineages, wide fan-in (post-shuffle losses cascade upstream), or high failure rates (spot fleets) — cut the lineage by persisting at the dangerous boundary."
            },
            {
              "id": "u6l2-i4",
              "front": "What do Catalyst and AQE do, in unit-4 vocabulary?",
              "back": "Catalyst: whole-plan optimization — projection/predicate pushdown into scans, join reordering, broadcast-vs-shuffle by the crossover (a config threshold). AQE: re-plans at stage boundaries from observed sizes — demotes to broadcast, coalesces/splits partitions (automated skew remedies)."
            },
            {
              "id": "u6l2-i5",
              "front": "Why is laziness (transformations vs actions) load-bearing?",
              "back": "Execution deferred until an action means the optimizer sees the whole plan — enabling pushdowns and join choices that eager row-by-row evaluation forecloses."
            },
            {
              "id": "u6l2-i6",
              "front": "The collect-shaped anti-pattern and its three legitimate substitutes",
              "back": "collect()/toPandas() funnels distributed data into one driver JVM (OOM). Substitutes: aggregate-then-collect (dashboard-sized), explicit samples, or distributed pandas/Arrow-batched UDFs — data leaves the cluster only by write or aggregation."
            }
          ]
        },
        {
          "id": "u6l3",
          "title": "Delta Lake: Transactions over Object Storage",
          "estMinutes": 30,
          "builds_on": [
            "u6l1",
            "u5l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The move: make the table a log",
              "body": "*The Data Lake* ended with six requirements; *Spark* ended with a `.write.parquet()` that satisfies none of them. Delta Lake's construction closes the gap with one structural move, and it is worth savoring because you have seen it before: **a table is not a prefix of files — a table is a log of versions, each version a list of immutable files**. Alongside the Parquet data files lives a `_delta_log/` directory of numbered commit files: `000…000.json`, `000…001.json`, …, each recording a set of **actions** — chiefly `add` (this file, with per-column min/max statistics and row count, now belongs to the table) and `remove` (this file no longer does) — plus schema and protocol metadata. The table's state at version N is the effect of replaying actions 0…N (with Parquet **checkpoint** files every ~10 commits so replay is O(recent), not O(history)). Readers first read the log, then read exactly the files their version lists. If that is Snowflake's micro-partition catalog rebuilt in the open — JSON files in your own bucket instead of a proprietary metadata service — that is precisely the point, and the comparison is the fastest way to understand both systems."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The Delta transaction log; optimistic concurrency",
              "statement": "A **Delta table** is a directory of immutable Parquet data files plus `_delta_log/`, an ordered sequence of commit files where commit N is named by the zero-padded integer N. **Table version N** = the file set produced by replaying commits 0…N (accelerated by periodic checkpoints). A **commit** is the atomic creation of log entry N+1; it succeeds for exactly one writer because the storage primitive is **put-if-absent** (mutual exclusion on the name `N+1`; on stores lacking conditional puts historically — S3 before conditional writes — a coordination service supplied the same guarantee).\n\n**Snapshot isolation for readers**: a reader resolves the latest committed version once, then reads only that version's files — immutable, hence stable — observing no concurrent writer. **Optimistic concurrency for writers**: a writer reads snapshot version N, stages its new data files (invisible: not yet in any log), then attempts to commit as N+1; if another writer won N+1, the loser re-reads the interloping commit(s) and **conflict-checks**: if the sets of files/partitions read-and-modified are disjoint (an append vs a compaction of old partitions), it rebases its actions onto the new version and retries at N+2; if they genuinely conflict (both rewrote the same files), it aborts. **DML**: DELETE/UPDATE/MERGE compile to copy-on-write file rewrites (`remove` old + `add` new) — or, with **deletion vectors**, to merge-on-read: a small bitmap sidecar marks dead rows and readers apply it, deferring the rewrite."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The commit protocol yields serializable table history and torn-read freedom",
              "statement": "Under three premises — (i) data files are immutable and staged before being referenced, (ii) log entry N+1 is created by an atomic put-if-absent that exactly one writer can win, (iii) readers read only files listed by a committed version — the Delta protocol guarantees: (a) the table's version history is a single total order (no forks); (b) no reader ever observes a partial write (the lesson-1 torn read is impossible); (c) concurrent writers either serialize cleanly or one aborts/retries — no lost updates.",
              "proof": "(a) Versions are named by consecutive integers and created by put-if-absent: for each N+1 there is exactly one winning commit file, so the sequence of committed versions is a chain — a fork would require two distinct objects at one name, which the primitive excludes. (b) A reader's file list comes from some committed entry N. Every file in that list was fully written *before* the commit that referenced it (premise i: staging precedes referencing), and files are immutable afterward — so the reader sees exactly the complete state at N. A writer's staged-but-uncommitted files appear in no committed list and are therefore invisible; a crash mid-job leaves only unreferenced garbage (cleaned later), never a visible partial state — 17 of 41 files can exist in the bucket, but the *table* never lists them. (c) Two concurrent writers both targeting N+1: exactly one wins (premise ii). The loser observes the winner's commit and re-validates: if its read-and-write sets are disjoint from the winner's changes, appending its actions at N+2 produces the same table state as any serial order of the two — serializable; if the sets overlap, the retry validation fails and the transaction aborts rather than silently clobbering — no lost update. Induction over writers extends both cases. ∎"
            },
            {
              "type": "code",
              "heading": "A day of _delta_log, annotated",
              "lang": "text",
              "code": "analytics/sessions/_delta_log/\n  00000000000000000411.json   02:14  streaming append: add 9 files (dt=08-26)\n  00000000000000000412.json   02:31  sessionize batch: remove 41 stale files,\n                                     add 38 files  ← ONE atomic commit; the\n                                     lesson-1 torn write is now impossible\n  00000000000000000413.json   03:02  OPTIMIZE (compaction): remove 214 small\n                                     files, add 6 big ones — data unchanged,\n                                     readers at v412 unaffected (immutability)\n  00000000000000000414.json   03:05  MERGE (CDC upsert): remove 3, add 4\n  00000000000000000415.json   03:20  DELETE (GDPR): add 2 deletion-vector\n                                     sidecars — no data file rewritten\n  00000000000000000420.checkpoint.parquet   ← replay accelerator: full state\n                                              snapshot every ~10 commits\n# Reader protocol: read latest checkpoint + tail commits → file list → read files.\n# Writer protocol: snapshot N → stage files → put-if-absent commit N+1 → on loss:\n#                  conflict-check against winner, rebase & retry, or abort."
            },
            {
              "type": "example",
              "heading": "Worked example: MERGE, the workhorse of civilized ingestion",
              "body": "Unit 8 will deliver change data capture from the register: a nightly (soon hourly) batch of upserts — new orders, changed statuses, the occasional correction. Against plain Parquet this was unimplementable without hand-rolled rewrites; against Delta it is one statement:\n\n`MERGE INTO orders t USING updates s ON t.order_id = s.order_id WHEN MATCHED THEN UPDATE SET * WHEN NOT MATCHED THEN INSERT *`\n\nExecution, priced with this unit's primitives: the engine joins `updates` (say 200 k rows) against the table's *files* — using the log's per-file min/max on order_id to touch only files whose ranges intersect the updates (unit 4's pruning, applied to a write): perhaps 30 of 2,000 files. Those 30 are rewritten copy-on-write (`remove`+`add` ≈ 30 files × 100 MB — the u5l2 'spread × size' rule verbatim), unmatched update rows land in fresh files, and the whole edit — old files out, new files in — is **one atomic commit**: concurrent readers see the table before or after the merge, never mid-surgery. Two operational notes with unit-5 echoes: MERGE cost scales with *files touched, not rows changed* — 200 k updates scattered across every file is a table rewrite (keep updates clustered with the table's order, or let deletion vectors defer), and every MERGE churns history that `VACUUM` (Delta's retention sweep — time travel's cost, u5l2's churn × retention pricing, same law) must eventually reclaim."
            },
            {
              "type": "example",
              "heading": "Worked example: the GDPR delete, replayed under Delta",
              "body": "Lesson 1 priced erasure on the plain lake at ~71% of files rewritten, non-atomically, unprovably. Replay under Delta with **deletion vectors** enabled. `DELETE FROM events WHERE user_id = 'U-88…'`: the engine consults per-file statistics — user_id min/max prune poorly on the time-clustered layout (uncorrelated, as lesson 1 computed), so it must *scan* the candidate files to find the user's rows (unavoidable reading) — but instead of rewriting ~71% of a 60 TB table, it writes a **bitmap sidecar per touched file** marking the dead row positions: kilobytes per file, one atomic commit, total write I/O in the *megabytes*. Readers henceforth apply the vectors (a masked scan — unit 4's selection bitmaps, persisted); a later `OPTIMIZE`/purge rewrites files at leisure to physically drop the rows within the compliance window.\n\nAudit falls out of the log itself: commit 415 records exactly which files gained vectors, when, by what operation, with what predicate (`DESCRIBE HISTORY` surfaces it) — the 'prove what you changed' requirement, satisfied by construction. And the concurrency story holds: a streaming append racing the delete commits disjoint files and both land (optimistic concurrency's happy path). Every one of lesson 1's six requirements is now demonstrably met — by ~200 lines of JSON convention over the same open Parquet in the same bucket. That economy of mechanism is why table formats conquered the lake in five years."
            },
            {
              "type": "text",
              "heading": "Table services: OPTIMIZE, clustering, VACUUM — the maintained lake",
              "body": "Requirements #6 (compaction and clustering as *maintained* services) becomes concrete now that writes are transactional. **OPTIMIZE** rewrites small files into target-size files (unit 2's 100 MB–1 GB rule) as an ordinary transaction — safe against readers by snapshot isolation, safe against writers by conflict checking, which is what makes it schedulable as a background duty rather than a maintenance window. **Z-ORDER / clustering** (Delta's liquid clustering, or explicit ZORDER BY) is unit 4's multi-column space-filling-curve layout, applied during OPTIMIZE and *maintained incrementally* — the overlap-depth repair loop, now on open files. **VACUUM** deletes data files unreferenced by any version within the retention window — the reference-counting reclamation of u5l2's proof, with the same churn × retention storage law and the same operational warning (aggressive VACUUM truncates time travel; a MERGE-heavy table's history is expensive). The composite picture deserves stating plainly: **Delta ≈ Snowflake's storage layer with the catalog turned inside out** — same immutable statistics-bearing files, same versioned-list-of-files table model, same copy-on-write DML, same time travel; the difference is *who holds the metadata* (your bucket + a catalog entry vs their multi-tenant service) and therefore who can read it (every engine vs one). What Snowflake's services layer still does better — always-on planning over global metadata, result caches, fine-grained governance — is exactly the gap Databricks' Unity Catalog and friends race to close; that competitive dynamic is lesson 4's subject."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Copy-on-write vs merge-on-read is a real dial, not a default.** COW (rewrite files on DML) makes *reads* pure and fast — no vectors to apply — but prices scattered updates at file-rewrite scale; MOR (deletion vectors / delta files) makes *writes* cheap but taxes every subsequent read with mask application and taxes the table with sidecar sprawl until compaction. The workload decides: BI-heavy tables with rare corrections → COW; CDC-heavy or erasure-heavy tables with hot write paths → MOR with scheduled purge. Iceberg exposes the same dial per-operation (copy-on-write vs merge-on-read modes); the vocabulary transfers."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The lake now has a database's spine: a numbered log whose put-if-absent commits give total-order history, snapshot-isolated readers, and conflict-checked optimistic writers (proved, not vibed); DML at file granularity with a COW/MOR dial; statistics-driven write pruning; table services running as ordinary transactions; and an audit trail as a side effect of the mechanism. Trellis's sessionization job changes one line — `.write.format(\"delta\")` — and the 06:10 dashboard can never again read 17/41ths of a write. What remains is perspective: Delta is one construction of the table-format idea. Iceberg builds the same guarantees from a different metadata geometry with different operational trade-offs — and above both sits the lakehouse argument proper, plus the decision Trellis has been postponing since unit 5. The closing lesson takes all three."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Two writers race on a Delta table at version 41: A is a streaming append (new files into dt=2026-08-27); B is OPTIMIZE compacting small files in dt=2026-08-20. Walk the commit protocol for the interleaving: both read snapshot 41; B wins commit 42; A attempts 42 and fails. What does A do next, why is it safe, and what would change if B had instead been a MERGE rewriting files in dt=2026-08-27?",
                  "solution": "A, having lost the race, reads B's commit 42 and conflict-checks: B removed/added files only in dt=08-20; A's transaction read nothing from those files and writes only new files in dt=08-27 — read/write sets disjoint ⇒ A rebases its identical actions onto version 42 and retries put-if-absent at 43, which succeeds. Safe because the final state equals the serial execution B-then-A (serializability from the proposition's case c). If B had been a MERGE touching dt=08-27: A's append still only *adds* new files (appends conflict with little), but if A were instead a job that had *read* dt=08-27 (e.g., computing sessionized output from files B rewrote), validation would find its snapshot stale in the overlap and abort/rerun — the protocol converts silent lost-updates into explicit retries or failures.",
                  "hint": "Loser re-validates: are my read-and-write file sets disjoint from the winner's changes?"
                },
                {
                  "prompt": "A table has 2,000 files of 100 MB. Nightly CDC merges touch 200 k rows. Price the merge's write I/O under: (a) updates uniformly scattered (every file's key range intersects); (b) updates clustered to the table's order (30 files intersect); (c) deletion-vector MOR for the delete-half of the merge with (a)'s scatter. State the u5l2 law this instantiates.",
                  "solution": "(a) COW must rewrite every intersecting file: ~2,000 × 100 MB = 200 GB written to change 200 k rows (~20 MB of logical data) — a full-table rewrite in effect. (b) 30 × 100 MB = 3 GB — 67× cheaper from clustering alone (write-side pruning via per-file stats). (c) MOR: dead rows marked in ~2,000 kilobyte-scale sidecars ≈ a few MB written now (+ new files for inserts), with the rewrite deferred to scheduled OPTIMIZE/purge — cheap tonight, paid later plus read-tax until purge. Law: DML cost tracks *files (partitions) touched × their size*, not rows changed — u5l2's spread rule, unchanged by the move from Snowflake's catalog to Delta's log.",
                  "hint": "Files intersected × file size; MOR converts rewrites into sidecar writes plus deferred compaction."
                },
                {
                  "prompt": "Explain the role of each premise in the atomicity proposition by constructing the failure that occurs when it is dropped: (i) files staged before being referenced; (ii) put-if-absent on the commit name; (iii) readers read only committed versions' lists.",
                  "solution": "Drop (i) — reference files before fully written: a reader of a committed version can fetch a file mid-upload (truncated/corrupt Parquet) — partial states return, atomicity of the *commit* no longer implies completeness of the *data*. Drop (ii) — plain PUT instead of put-if-absent: two writers both create '42' (last-writer-wins overwrite) — forked history; one writer's commit silently vanishes: lost update at the log level. Drop (iii) — readers LIST the data directory instead of reading the log: staged-but-uncommitted and removed-but-not-yet-vacuumed files become visible — the lesson-1 torn read returns despite a perfect log. The proposition is genuinely conjunctive: each premise closes a distinct hole.",
                  "hint": "Each premise forbids one specific observable anomaly — find it."
                },
                {
                  "prompt": "Design the maintenance policy for Trellis's sessions table (streaming appends every ~5 min, nightly batch rewrite of 3 days, occasional GDPR deletes via deletion vectors, BI reads all day): OPTIMIZE cadence and scope, clustering choice, VACUUM retention — each justified by a mechanism from this lesson, with the failure it prevents.",
                  "solution": "OPTIMIZE: hourly on the current day's partition only (streaming appends shred it into ~288 small files/day — unit 2's small-files tax on every BI read); scope-limiting keeps the transaction's file set disjoint from the nightly rewrite's (conflict-check friendliness) and bounds cost. Clustering: keep time as the primary order (BI is date-ranged; the nightly job rewrites recent days already sorted); add Z-order on user_id *only if* per-user reads become a real family — otherwise it buys nothing and churns files (unit 4's budget rule). VACUUM: retention ≥ 7 days — long enough for time-travel debugging of the nightly rewrite and for streaming-job recovery from checkpoints referencing recent versions (premature VACUUM breaks a restarted reader whose snapshot's files were deleted: the retention/consumer contract); schedule a monthly deletion-vector purge/rewrite to physically drop GDPR-marked rows within the compliance SLA (MOR's deferred debt, collected on schedule). Each choice is 'ordinary transaction + snapshot isolation makes it safe to run live' — the property that turned maintenance from a window into a service.",
                  "hint": "Small-files tax, conflict-set disjointness, churn × retention, and the MOR debt's due date."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u6l3-i1",
              "front": "What is a Delta table, structurally?",
              "back": "Immutable Parquet data files + _delta_log/: numbered commit files of add/remove actions (with per-file column stats), checkpointed every ~10 commits. Version N = replay of commits 0…N; readers read the log, then exactly that version's files."
            },
            {
              "id": "u6l3-i2",
              "front": "What single primitive makes a Delta commit atomic, and what does it exclude?",
              "back": "Put-if-absent on the next commit filename (N+1) — exactly one writer wins, so history is a total order (no forks) and a crash leaves only unreferenced staged files, never a visible partial table."
            },
            {
              "id": "u6l3-i3",
              "front": "Optimistic concurrency: what does a losing writer do?",
              "back": "Read the winning commit(s), conflict-check read/write file sets: disjoint → rebase actions and retry at the next version (serializable); overlapping → abort rather than lose an update silently."
            },
            {
              "id": "u6l3-i4",
              "front": "Copy-on-write vs merge-on-read (deletion vectors) — the dial",
              "back": "COW: rewrite touched files on DML — pure fast reads, expensive scattered writes. MOR: mark dead rows in bitmap sidecars — cheap writes, read-tax + compaction debt. BI-heavy → COW; CDC/erasure-heavy → MOR + scheduled purge."
            },
            {
              "id": "u6l3-i5",
              "front": "How does MERGE stay affordable, and what law prices it?",
              "back": "Per-file min/max stats prune the join to files whose key ranges intersect the updates (write-side pruning); cost = files touched × size, not rows changed — keep updates clustered with table order or defer via MOR."
            },
            {
              "id": "u6l3-i6",
              "front": "Delta vs Snowflake's storage layer — the one-line comparison",
              "back": "Same bones: immutable statistics-bearing files, versioned file-list tables, COW DML, time travel, churn×retention reclamation (VACUUM). Difference: metadata lives open in your bucket (any engine) vs inside a proprietary multi-tenant service."
            }
          ]
        },
        {
          "id": "u6l4",
          "title": "Iceberg, the Lakehouse Argument, and the Decision",
          "estMinutes": 29,
          "builds_on": [
            "u6l3",
            "u5l4"
          ],
          "content": [
            {
              "type": "text",
              "heading": "A second construction, to see the idea whole",
              "body": "One construction of a theorem is an artifact; two are an insight. **Apache Iceberg** — born at Netflix from the same Hive-table pathologies that motivated Delta — delivers the same six guarantees from a different metadata geometry, and the differences illuminate which choices are essential (immutability, atomic version switch, file statistics) versus contingent (log versus tree, filename protocol versus catalog pointer). Where Delta's state is *reconstructed by replaying a log*, Iceberg's state is *pointed at*: a *catalog* entry holds a pointer to the current `metadata.json`; that file lists **snapshots**; each snapshot owns a **manifest list**; each manifest lists data files with partition ranges and per-column statistics. A commit writes the new metadata tree bottom-up (all immutable), then **atomically swaps the catalog pointer** via compare-and-swap — mutual exclusion at the pointer instead of at a filename, the same proposition with one substitution in premise (ii). Readers descend the tree, pruning as they go: snapshot → manifest list (skip whole manifests by partition range) → manifests (skip files by column stats) → files — unit 4's zone maps arranged as a B-tree-shaped index over the lake."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Iceberg's metadata tree; hidden partitioning; partition evolution",
              "statement": "An **Iceberg table** = a catalog entry → current metadata file → snapshots → per-snapshot manifest lists → manifests → data files, every node immutable and statistics-bearing; commits build new tree paths and CAS the catalog pointer (optimistic concurrency as in Delta, with the same conflict-validation obligations).\n\n**Hidden partitioning**: the partition scheme is declared as *transforms* of columns — `days(event_ts)`, `bucket(64, user_id)`, `truncate(4, sku)` — and Iceberg derives and stores each file's partition values itself. Queries filter on the *source column* (`WHERE event_ts BETWEEN …`) and planning applies the transform to prune — users never name partition directories, so the unit-2 Hive-style failure mode (queries silently full-scanning because someone filtered on `event_ts` while the path key was `dt`) is structurally removed.\n\n**Partition evolution**: because partition values are metadata (not directory paths), the spec can *change over time* — e.g., from `days(ts)` to `hours(ts)` as volume grows; old files keep the old spec, new files the new, and the planner prunes each file under the spec it was written with. No rewrite of history to change the layout policy — the operation that on a Hive-style lake was a full-table migration becomes a metadata edit."
            },
            {
              "type": "example",
              "heading": "Worked example: the same three commits, Iceberg-shaped",
              "body": "Replay lesson 3's log day on Iceberg to see equivalence and difference. The streaming append: writes data files + a manifest, a new manifest list, new metadata.json, then CAS the catalog pointer from v411's metadata to v412's — one atomic pointer swap regardless of how many files landed. The compaction (`rewrite_data_files`): same shape — new manifests referencing 6 big files, dropping 214 small ones; readers on the old pointer are untouched (immutability); CAS publishes. The GDPR delete: Iceberg v2 writes **positional delete files** (its merge-on-read: files naming (data_file, row_position) pairs — same role as deletion vectors, different encoding), attached via the new snapshot.\n\nNow the differences that matter operationally. **Pruning shape**: Delta readers get file stats from the (checkpointed) log — a flat list; Iceberg readers prune *hierarchically* (manifest-list ranges exclude whole manifests before file stats are touched), which scales planning better on million-file tables. **Commit contention**: Delta serializes on the next-filename; Iceberg on a catalog CAS — same logical bottleneck, but the catalog (a database, a REST service) can queue/retry more gracefully than object-store filename races under very high commit rates. **Ecosystem**: Iceberg's spec-first, vendor-neutral genesis made it the *interchange* table format — Snowflake reads and writes Iceberg tables, BigQuery reads them (BigLake), Trino/Flink/Spark all first-class — while Delta remains deepest inside Databricks. The formats are converging in capability; the *political* difference (who governs the spec, who optimizes for it) is now the larger one, and both — this is the strategic fact — are open enough that the unit-5 lock-in asymmetry has genuinely narrowed."
            },
            {
              "type": "text",
              "heading": "The lakehouse argument, stated as its authors state it",
              "body": "The CIDR 2021 paper (Armbrust, Ghodsi, Xin, Zaharia) makes a three-part claim worth quoting in structure. **(1) Two-tier is the problem**: the common enterprise stack — a lake for raw/ML *plus* a warehouse for BI — pays for two copies, two security models, two governance regimes, and a perpetual ETL bridge whose lag and drift are unit 1's silent-failure factory; data staleness, reliability incidents, and 'which number is right?' live in the seam. **(2) The substrate is now sufficient**: table formats supply ACID, DML, schema management, and time travel over open files (lesson 3's proof); statistics-bearing metadata supplies warehouse-grade pruning (unit 4's math); and vectorized native engines (Photon — unit 4's lesson 1 in production C++) close the raw SQL performance gap, with published TPC-DS results as evidence. **(3) Therefore one tier can serve both**: BI dashboards and ML training against *the same copy* in an open format, with one governance layer. The honest caveats, also from within the ecosystem: highly concurrent, low-latency BI serving still favors warehouse-style always-on services (caches, serving layers — unit 5's strengths are real); the metadata/catalog layer becomes the new central dependency (Unity Catalog et al. — openness at the file layer, competition at the catalog layer); and operating a lakehouse well demands more platform engineering than swiping a Snowflake credit card. The claim to carry forward is not 'lakehouse wins' but *the fork is now a spectrum*: open formats + interchangeable engines mean the warehouse/lake boundary is a per-workload dial, not a religious schism."
            },
            {
              "type": "decision",
              "heading": "Warehouse or lakehouse — the workload-by-workload dial",
              "rows": [
                [
                  "High-concurrency BI on modeled, stable data (the star)",
                  "warehouse economics and caches win; or lakehouse + a serving-optimized SQL endpoint if openness/one-copy dominates"
                ],
                [
                  "Event-scale raw + ML training + feature pipelines",
                  "lakehouse: object-store economics, file access, schema tolerance — the warehouse would tax every training epoch"
                ],
                [
                  "CDC-heavy operational mirrors with row-level corrections",
                  "table format with MOR (deletion vectors / positional deletes) — either platform can host it; the mechanism is the same"
                ],
                [
                  "Small team, no platform engineers, < 1 TB modeled data",
                  "managed warehouse (or fully-managed lakehouse SKU): operational headcount is the binding constraint (u5l4's startup memo)"
                ],
                [
                  "Regulatory need for engine-independent, decade-durable data",
                  "open table format regardless of engine — the format outlives every vendor contract"
                ],
                [
                  "Both worlds needed (the common case)",
                  "two tiers with *governed seams* (one catalog, contracted ETL) — or one lakehouse tier if the team can operate it; measure the seam's cost honestly"
                ]
              ]
            },
            {
              "type": "example",
              "heading": "Worked example: Trellis decides",
              "body": "Trellis's fork, resolved with the dial rather than doctrine. **The modeled star stays in Snowflake** — for now: 40 concurrent BI users on 300 GB of stable dimensional data is the warehouse's home game (u5l4's enterprise memo), the team is two data engineers (operational headcount binds), and the u5 bill is understood and itemized. **The clickstream estate becomes a Delta lakehouse on Databricks**: events, sessions, and ML feature tables — 60 TB growing 20/year, schema-volatile, model-hungry — where lesson 3's mechanisms (streaming-append + OPTIMIZE + deletion vectors) replace the hand-rolled zone discipline, and notebooks/Photon serve the science team from the same copy the pipelines write. **The seam is contracted, not ad hoc**: sessions and daily aggregates land in *Iceberg-readable* form so Snowflake external/managed Iceberg tables can query them without a copy job — the interop that makes the two-tier tax mostly evaporate — and one catalog governs both sides' schemas and access (unit 9). **The exit clause is written down**: if BI concurrency migrates toward the lakehouse's SQL endpoint at acceptable latency, or Snowflake's Iceberg support makes the star itself portable, consolidation is a project, not a rescue — because every byte on both sides is already in (or exportable to) an open format. That last sentence is the unit's strategic payload: **the decision that matters most is not which platform, but whether your data's format leaves you free to re-decide.**"
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**The two-tier seam is where careers go to debug.** If you do run warehouse + lakehouse (most mid-size companies do), the failure budget concentrates in the bridge: the copy job that lags (BI reads yesterday's sessions), the schema change that lands on one side only (the discount incident, cross-platform edition), the security model that diverges (a column masked in Snowflake, naked in the lake). Treat the seam as a *product*: one catalog of record, contracted schemas on everything crossing (unit 9's data contracts), freshness SLOs monitored from the consuming side, and — where interop tables can replace copy jobs — prefer the pointer to the pipeline."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The lake's civilization is complete and the fork is closed with a framework instead of a slogan. Iceberg's tree shows which table-format choices are essential (immutability, atomic switch, statistics) versus stylistic (log vs tree, filename vs pointer); hidden partitioning and partition evolution remove two chronic Hive-era failure classes; the lakehouse argument — two-tier waste, sufficient substrate, one open copy — earns its caveats (concurrency serving, catalog centrality, platform headcount); and Trellis ships a two-platform architecture with contracted, interop-first seams and a written exit clause. Units 5 and 6 together deliver the course's analytical core. What neither unit built is the thing that *fills* these platforms day after day: the transformation layer that turns raw into modeled (with the idempotency this unit's transactions finally make cheap), the orchestration that sequences it, and the tests that catch the discount incident before the CFO does. That is unit 7."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Map each Delta mechanism to its Iceberg counterpart and name the one structural difference in each pair: (a) _delta_log numbered commits; (b) put-if-absent on the next log filename; (c) per-file stats in add actions / checkpoint; (d) deletion vectors.",
                  "solution": "(a) ↔ snapshot lineage in metadata.json: both are immutable version histories — Delta *replays* a log to build state, Iceberg *points* at a complete tree per snapshot (state materialized, not reconstructed). (b) ↔ catalog compare-and-swap of the metadata pointer: same mutual exclusion, moved from an object-store filename race to a catalog primitive (queueable, retry-friendly, but makes the catalog a required dependency). (c) ↔ manifest entries' per-file column stats under manifest-list partition ranges: same zone-map content, arranged hierarchically so planning prunes manifests before touching file stats (scales to million-file tables). (d) ↔ v2 positional delete files: same merge-on-read role; encoding differs (bitmap sidecar vs (file, position) delete lists), same read-tax-until-compaction economics.",
                  "hint": "Same guarantee each time; find where the mechanism physically lives."
                },
                {
                  "prompt": "Trellis's events table was partitioned days(event_ts) at 40 M events/day; volume grows to 400 M/day and hourly dashboards emerge. Describe the change under (a) Hive-style dt= paths (unit 2), and (b) Iceberg partition evolution — including what happens to historical queries spanning the boundary in each world.",
                  "solution": "(a) Hive-style: the partition key is baked into paths and every consumer's queries/pipelines; moving to hourly means rewriting the table into a new hh= layout (a full-history migration job), updating every reader's path assumptions, and a cutover window where old and new layouts coexist and queries must know which side a date lives on — weeks of coordinated work. (b) Iceberg: `ALTER TABLE … SET PARTITION SPEC (hours(event_ts))` — a metadata edit; old files retain the daily spec, new files get hourly; the planner prunes each file under its own spec, so a query spanning the boundary transparently prunes days on old data and hours on new. No rewrite, no consumer changes (hidden partitioning means nobody ever named dt= anyway). The exercise's moral: encoding physical layout into *paths and consumer knowledge* is what made layout changes migrations; moving it into metadata made them decisions.",
                  "hint": "Who knows about the partition scheme in each world, and what must change when it changes?"
                },
                {
                  "prompt": "Steelman then rebut, in ~4 sentences each: 'We should move Trellis's BI star out of Snowflake onto the lakehouse SQL endpoint to get to one copy and one platform.' Use unit 5's economics and this unit's caveats; end with the measurement that would settle it.",
                  "solution": "Steelman: one copy in Delta/Iceberg ends the seam — one governance model, no ETL bridge to lag or drift, ML and BI finally read identical data; open format ends the u5 lock-in exposure; Photon-class engines have closed most of the raw SQL gap, and consolidating platforms halves the operational surface for a two-person team. Rebuttal: the star's workload is 40 concurrent humans on 300 GB of stable data — precisely where u5's always-on caches, result reuse, and per-workload isolation earn their premium, and where lakehouse endpoints have historically paid cold-start and concurrency tax; the seam is already cheapened by Iceberg interop (pointer, not pipeline); and the migration itself consumes the scarce resource (engineer-months) to solve a problem (lock-in) the exit clause already bounds. Settling measurement: run the actual BI workload (query mix × concurrency curve, u5l4's benchmarketing rule) against the lakehouse endpoint for two weeks in shadow; compare p95 latency, cost per day, and cache-cold behavior against the Snowflake baseline — migrate if within budget on all three, otherwise keep the dial where it is and re-measure yearly.",
                  "hint": "Concurrency serving is the caveat that bites; interop is what already de-fanged the seam."
                },
                {
                  "prompt": "Your compliance team requires: (1) provable record of every change to the events table; (2) erasure completed within 30 days of request; (3) analytics downtime ≈ 0 during erasure. Design the mechanism stack on a table format (either), citing the specific feature satisfying each clause and the scheduled job that makes clause 2's deadline real.",
                  "solution": "(1) The commit history itself: every DELETE/MERGE is a numbered commit recording operation, predicate, and files touched (DESCRIBE HISTORY / snapshot metadata) — an audit log by construction, exportable for evidence. (2) Erasure via merge-on-read: DELETE writes deletion vectors / positional delete files in one cheap atomic commit (rows immediately invisible to all readers — arguably satisfying erasure-of-access instantly); a **scheduled monthly purge** (OPTIMIZE/rewrite + VACUUM past retention) physically removes marked rows and dead files, calendared so the physical deletion always lands < 30 days after the mark — the deadline is met by the *schedule*, not by hope. (3) Snapshot isolation: the delete and the purge are ordinary transactions — readers on prior versions proceed untouched; no maintenance window exists. Add the retention caveat: VACUUM must not outrun the compliance clock in the *other* direction — time-travel retention must be ≤ the erasure SLA for this table, else 'deleted' rows remain reachable via old versions; set retention ≤ 30 days on events, documented as a compliance control.",
                  "hint": "Mark fast (MOR), purge on a calendar, and check what time travel retains against what erasure promises."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u6l4-i1",
              "front": "Iceberg's metadata geometry (vs Delta's)",
              "back": "Catalog pointer → metadata.json → snapshots → manifest lists → manifests (per-file stats) → data files, all immutable; commit = CAS the catalog pointer. Delta replays a numbered log; Iceberg points at a materialized tree — same guarantees, different mechanism seat."
            },
            {
              "id": "u6l4-i2",
              "front": "Hidden partitioning — what failure class it removes",
              "back": "Partition scheme = declared transforms (days(ts), bucket(n,id)) applied by the planner; users filter source columns, never paths — so the Hive-era 'filtered the column, not the path key, silently full-scanned' bug is structurally impossible."
            },
            {
              "id": "u6l4-i3",
              "front": "Partition evolution",
              "back": "Because partition values live in metadata (not paths), the spec can change (days→hours) without rewriting history: old files prune under their old spec, new under new — layout policy becomes a metadata edit, not a migration."
            },
            {
              "id": "u6l4-i4",
              "front": "The lakehouse argument in three clauses",
              "back": "(1) Lake+warehouse two-tier costs two copies, two governance regimes, and a drifting ETL seam; (2) table formats + statistics metadata + vectorized native engines make the open substrate warehouse-capable; (3) therefore one open copy can serve BI and ML — with caveats: concurrency serving, catalog centrality, platform headcount."
            },
            {
              "id": "u6l4-i5",
              "front": "The strategic payload of open table formats",
              "back": "Interop (Snowflake/BigQuery reading Iceberg; engines interchangeable) turns platform choice into a per-workload dial with a written exit clause — the decisive property is whether your format leaves you free to re-decide."
            },
            {
              "id": "u6l4-i6",
              "front": "Running two tiers: how to keep the seam from becoming the failure budget",
              "back": "Treat it as a product: one catalog of record, data contracts on everything crossing, consumer-side freshness SLOs, and interop tables (pointers) preferred over copy pipelines wherever supported."
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
            "prompt": "A plain-Parquet lake stores events in files of n = 4 M rows; a user subject to erasure has events at rate f = 1 in 2 M rows (uniformly scattered). What percentage of files must be rewritten to erase them under copy-on-write with no table format? (Use 1 − e^{−fn}; answer as a percentage, one decimal.)",
            "answer": 86.5,
            "tolerance": 0.5,
            "explanation": "f·n = 4,000,000/2,000,000 = 2 ⇒ 1 − e^{−2} ≈ 0.8647 → 86.5% of files contain ≥ 1 target row and must be fully rewritten (immutability). The same math that governed pruning (unit 4) prices compliance; deletion vectors/positional deletes exist to replace these rewrites with kilobyte sidecars.",
            "points": 1
          },
          {
            "id": "u6q2",
            "type": "short",
            "prompt": "Name the atomic storage/catalog primitive that gives (a) Delta and (b) Iceberg their single-winner commits (a few words each, in order).",
            "accept": [
              "put-if-absent, compare-and-swap",
              "put-if-absent; catalog compare-and-swap",
              "put if absent, CAS",
              "put-if-absent on the commit filename, CAS of the catalog pointer",
              "conditional put, compare and swap",
              "put if absent and compare and swap"
            ],
            "explanation": "Delta: put-if-absent creation of the next numbered log file — exactly one writer can create '000…N+1.json'. Iceberg: compare-and-swap of the catalog's metadata pointer. Same mutual-exclusion role, different seat — which is why the atomicity proof transfers with one premise substituted.",
            "points": 1
          },
          {
            "id": "u6q3",
            "type": "mcq",
            "prompt": "A Spark job crashes after writing 17 of 41 output files. Under plain `.write.parquet(prefix)` versus Delta, what do concurrent readers see?",
            "options": [
              "Plain: readers listing the prefix can observe the 17 new files mixed with stale ones (silent wrong results); Delta: readers resolve the last committed version and see none of the 17 — the staged files are unreferenced garbage until a commit lists them",
              "Both cases are safe, because Parquet files are immutable and readers always skip files with invalid footers",
              "Plain: readers get an error because the write left a _temporary directory; Delta: readers block until the writer's lock is released",
              "Delta prevents the crash itself by writing files transactionally two-phase, so fewer than 41 files can never exist in the bucket"
            ],
            "answer": 0,
            "explanation": "The torn-read anatomy: object stores expose every intermediate PUT to LIST-based readers (silent mixture — no error, which is what makes it dangerous); Delta readers never LIST — they read a committed version's file list, and the crashed writer never committed, so its files are invisible (premise iii of the atomicity proposition). (b) footers are valid on the 17 completed files — immutability doesn't help; (c) no locking exists in either world, and _temporary conventions are engine-specific and non-atomic; (d) Delta doesn't prevent partial *uploads* — it prevents their *visibility*.",
            "points": 1
          },
          {
            "id": "u6q4",
            "type": "numeric",
            "prompt": "A Delta table has 3,000 files × 128 MB. A nightly MERGE upserts rows whose keys, thanks to clustering, intersect only 45 files' min/max ranges. How many GB does the copy-on-write merge write (new file versions only, 1 GB = 1,000 MB)?",
            "answer": 5.76,
            "tolerance": 0.1,
            "explanation": "Write-side pruning via per-file stats limits the rewrite to 45 files × 128 MB = 5,760 MB = 5.76 GB — versus 384 GB had the updates scattered across all 3,000 files. DML cost tracks files touched × size (the spread law); clustering the updates to the table's order is what kept 'touched' small.",
            "points": 1
          },
          {
            "id": "u6q5",
            "type": "proof",
            "points": 2,
            "prompt": "Prove that the table-format commit protocol provides snapshot isolation and no-lost-updates over an object store that has NO multi-object transactions. Premises: (i) data/metadata files are immutable and fully staged before being referenced; (ii) exactly one writer can win the version-switch primitive (put-if-absent or CAS); (iii) readers resolve a committed version once and read only its listed files; (iv) a losing writer validates its read/write sets against intervening commits before retrying. Show: (a) a reader's entire query sees one consistent table state; (b) two concurrent writers cannot silently overwrite each other's effects.",
            "rubric": [
              "(a) Argues from (iii) + (i): the reader's file list is fixed at resolution time and every listed file is complete (staged-before-referenced) and immutable — so all reads during the query reflect exactly version N regardless of concurrent commits (later versions change the pointer/log, never the resolved files)",
              "Notes explicitly why concurrent writers are invisible to the reader: staged-but-uncommitted files appear in no committed list; removed files still physically exist for old versions (immutability + deferred vacuum)",
              "(b) Uses (ii) for total order: both writers target the same next version; exactly one wins, so no forked histories — then (iv) for the loser: disjoint read/write sets ⇒ rebase+retry equals a serial execution; overlapping sets ⇒ abort, so neither outcome silently drops the winner's or loser's effects",
              "States the reduction cleanly: the only mutable, contended object in the whole system is the single version switch — everything else is immutable — which is how multi-file atomicity is built from a single-object primitive the store does offer"
            ],
            "solution": "(a) Snapshot isolation. At query start the reader resolves the current committed version N, obtaining a concrete list L of files (iii). Every file in L was completely written before the commit that first referenced it (i) and is immutable thereafter — so every byte the query reads, at any time during execution, is exactly the byte that was in version N: later commits create new files and a new list, but never mutate members of L; removed-in-later-versions files still exist physically until retention-based cleanup, so long-running queries don't lose their snapshot. Concurrent writers cannot leak in: their staged files are referenced by no committed list (invisible by iii), so the reader's view is the complete, unchanging state N — one consistent snapshot. (b) No lost updates. Writers A and B both read snapshot N and attempt the switch to N+1. By (ii) exactly one — say B — succeeds; history stays a single chain (a fork would need two winners of one switch). A, on losing, must validate (iv): it compares the files it read and intends to remove/replace against B's committed changes. If disjoint (A appends to today's partition; B compacted last week's), A re-targets N+2 and commits; the final state equals running B then A serially — serializable, both effects present. If overlapping (both rewrote file F), A's validation fails and A aborts (or reruns from the new snapshot): B's committed effect is never clobbered, and A's effect is never half-applied (its files remain unreferenced). In both branches no committed change is silently lost. The architecture's trick, stated once: reduce all mutability to a single switchable object (log entry name / catalog pointer) for which the store *does* provide atomicity, and make literally everything else immutable — multi-file transactions from a single-object primitive. ∎",
            "explanation": "The unit's central theorem, in the general form that covers both Delta and Iceberg: snapshot isolation from immutability + committed-list reads, serializability from single-winner switches + validation, and the design reduction (one mutable pointer, everything else frozen) that makes a database out of a bucket."
          },
          {
            "id": "u6q6",
            "type": "open",
            "points": 2,
            "prompt": "A 200-person e-commerce company runs: (1) a 400 GB modeled star serving 55 concurrent BI users; (2) 45 TB of clickstream/impression logs growing 25 TB/year, feeding four ML models retrained weekly; (3) a nightly CDC mirror of the operational DB requiring row-level upserts and GDPR erasure; (4) a 3-person data team. Recommend the platform architecture (warehouse, lakehouse, or split — and where each workload lands), the table-format/interop choices at any seam, the COW/MOR settings for workload 3, and the one written policy that keeps the architecture reversible. Quantify at least one decision.",
            "rubric": [
              "Places workloads by the dial with reasons: the star on a warehouse (or defends a lakehouse SQL endpoint against the concurrency caveat explicitly); the clickstream/ML estate on a lakehouse (economics + file access quantified, e.g. object-store $/TB-year vs warehouse storage/compute); CDC mirror on a table format with row-level DML",
              "Handles the seam concretely: open/interop table format (Iceberg-readable) for shared datasets so the warehouse queries lake tables by pointer rather than copy pipeline; one catalog governing both; contracts/freshness SLOs on crossing datasets",
              "Workload 3 mechanics: MOR (deletion vectors / positional deletes) for cheap scattered upserts + erasure marks, with a scheduled purge inside the compliance window and retention ≤ erasure SLA — the mark-fast/purge-on-calendar pattern; notes MERGE cost scales with files touched (clustering the mirror by key ranges or accepting MOR read-tax)",
              "Names the reversibility policy: all durable analytical data in (or exportable to) open formats with a documented exit/consolidation clause and periodic re-measurement (shadow benchmark of the BI workload) — and respects the 3-person constraint (managed services over self-operated where equivalent)"
            ],
            "solution": "Split architecture with contracted seams — the dial, not doctrine. (1) The star stays on a managed warehouse: 55 concurrent humans on 400 GB is caches-and-isolation territory (unit 5), and a 3-person team shouldn't operate a serving tier they can rent; cost is bounded and itemizable per unit 5's monitors. (2) Clickstream + ML on a lakehouse (Delta or Iceberg on object storage with a managed Spark/SQL service): 45 TB @ ~$276/TB-year object storage ≈ $12.4 k/year at rest versus multiples of that in warehouse storage-plus-scan economics, and the models want parallel file reads, not SQL cursors; weekly retrains scan bulk history — exactly the lake forces. (3) The CDC mirror lives on the lakehouse as a table-format table in MOR mode: nightly (→ hourly later) MERGE writes delete files/vectors instead of rewriting scattered files (upsert keys are uncorrelated with time order — COW would approach full rewrites per the spread law), with: a monthly OPTIMIZE purge to physically apply marks, table retention set ≤ 30-day erasure SLA (time travel must not outlive the right to be forgotten), and the audit trail = the commit history itself. (4) Seams: shared datasets (sessions, daily aggregates, the mirror's modeled extracts) written Iceberg-readable so the warehouse mounts them by pointer — no copy pipeline to lag or drift; one catalog of record for schema + access on both sides; freshness SLOs monitored from the consuming side. Reversibility policy, written down: every durable analytical dataset must be in an open table format or have a tested export path; re-benchmark the BI workload against the lakehouse endpoint annually (shadow run: p95 latency, $/day, cold behavior) and consolidate only on measured wins. The 3-person constraint threads everything: managed SKUs, background table services instead of hand-rolled maintenance, and pointers instead of pipelines wherever the ecosystem allows.",
            "explanation": "The full unit as one decision: lake forces and warehouse strengths priced per workload, table-format mechanics (MOR, purge schedules, retention-vs-erasure) applied where DML and compliance bite, interop as the seam-killer, and openness as the exit clause — with the team-size constraint doing the tie-breaking, as it does in real organizations."
          }
        ]
      }
    },
    {
      "id": "u7",
      "title": "Transformation: Pipelines as Software",
      "summary": "ELT layering and the transformation DAG, idempotency and incremental models (with the composition theorem), and testing + orchestration via write-audit-publish.",
      "intro": "The platforms are built; now comes the work that fills them every night. Units 5 and 6 gave Trellis transactional storage on both sides of its architecture, and unit 3 specified the destination — the star — but the road from raw zone to modeled layer is still v0's shell scripts wearing better storage. This unit rebuilds that road as software, because that is the discipline's actual claim: a transformation pipeline is a program with inputs, outputs, tests, and deployments, and it deserves version control, review, and engineering theorems — not a folder of scheduled SQL. The first lesson establishes the modern shape: ELT over ETL, the staging → intermediate → marts layering, and the dependency DAG that turns a thousand queries into one buildable artifact. The second lesson proves the property everything else leans on — idempotency — and engineers the incremental models that make nightly builds cost minutes instead of hours, late data included. The third lesson closes the loop that every incident since unit 1 has demanded: tests that make semantic failures loud, orchestration that sequences and retries, and the write-audit-publish pattern that guarantees — provably — that consumers never see data that failed its checks. The gate asks you to design a DAG, price an incremental strategy, and catch the discount incident before the CFO does.",
      "references": [
        "dbt Labs — 'The dbt Viewpoint' (2016) and dbt documentation (docs.getdbt.com) — analytics engineering as software",
        "Joe Reis & Matt Housley — Fundamentals of Data Engineering, chs. 8–9 (transformation; the DataOps undercurrent)",
        "Ralph Kimball & Margy Ross — The Data Warehouse Toolkit, 3rd ed., ch. 19 (ETL subsystems, modernized here as ELT)",
        "Maxime Beauchemin — 'Functional Data Engineering' (2018) — idempotency and reproducible partitions as the organizing principle"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u7l1",
          "title": "ELT, Layers, and the Transformation DAG",
          "estMinutes": 26,
          "builds_on": [
            "u3l2",
            "u5l1"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Why transformation moved into the warehouse",
              "body": "The acronym flip from ETL to ELT is a genuine architectural event, not vendor rebranding. Classic **ETL** transformed data *in flight* — a dedicated engine (Informatica, custom Spark) read from sources, reshaped in its own memory, and loaded finished tables — because 1990s warehouses were too expensive and too weak to host raw data or heavy reshaping. Units 5 and 6 deleted both premises: storage is object-store cheap, and the warehouse/lakehouse engine is the most powerful (and elastically billed) compute the team owns. **ELT** therefore loads raw data first — unit 2's raw zone, verbatim, into the platform — and transforms *inside* the platform with SQL, where the optimizer, the pruning, and the elasticity theorem all work for you. Three consequences define the modern practice. Raw history is *retained*, so transformations become **re-runnable against the past** — the replay insurance every incident runbook has invoked since unit 2. Transformation logic becomes **SQL SELECT statements** — declarative, reviewable, testable text — rather than opaque engine jobs. And because each transformation reads tables and produces a table, the whole layer forms a **dependency graph**: a DAG you can build, rebuild, test, and reason about as one artifact. That DAG is this lesson's object of study."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The transformation DAG; layers; materializations",
              "statement": "A **transformation DAG** is a directed acyclic graph whose nodes are *models* — each a versioned SELECT statement producing one relation — and whose edges are declared data dependencies (dbt's ref(): model B selects from model A ⇒ edge A → B). Acyclicity guarantees a topological build order; declared edges make the order *computable* rather than tribal.\n\nModels are conventionally organized in **layers**: **staging** — one model per source table: rename, type-cast, minimal cleaning, no joins (the airlock where source chaos becomes local convention); **intermediate** — reusable joins and business logic shared by several downstream models; **marts** — the consumer-facing layer: unit 3's dimensional star (facts, dimensions) plus unit 3's sanctioned OBT serving tables. The rule that keeps the graph sane: **dependencies point downstream only** (staging → intermediate → marts), and consumers read only marts.\n\nEach model declares a **materialization** — how its SELECT becomes a physical object: **view** (no storage; computed at query time), **table** (full rebuild each run), **incremental** (append/merge only new data — lesson 2's subject), or **ephemeral** (inlined into dependents). Materialization is a *performance decision per node*, changeable without touching the logic — the separation that lets the same SQL text serve a 10 MB dimension as a view and a 60 TB fact incrementally."
            },
            {
              "type": "example",
              "heading": "Worked example: Trellis's star as a DAG",
              "body": "The unit-3 star, expressed as buildable models. **Staging** (one per source, matching the raw zone): `stg_orders`, `stg_order_lines`, `stg_products`, `stg_customers`, `stg_promotions` — each a thin SELECT over its raw table: rename `o_ts` → `order_ts`, cast the cents-integer to decimal dollars, map status codes to labels, standardize null conventions. No joins, no business rules — the layer exists so that *every* downstream model inherits one spelling of every fact about the source.\n\n**Intermediate**: `int_order_lines_enriched` — the one join used by three marts (lines × orders for channel and timestamps); `int_customer_versions` — the SCD-2 versioning logic of unit 3 (compare incoming snapshots to current versions, emit new version rows), isolated here because it is the trickiest logic in the graph and deserves its own tests.\n\n**Marts**: `dim_customer`, `dim_product`, `dim_date` (generated), `fct_order_line` — the star, built from intermediates; plus `mart_exec_daily` — the OBT serving table for the executive dashboard, rebuilt from the star (unit 3's cache-not-model ruling, now enforced by graph position: it *depends on* the star and nothing depends on it).\n\nThe build: `run` executes ~14 models in topological order — staging in parallel (no interdependencies), then intermediates, then dims before the fact (the fact's surrogate-key lookups read them — unit 3's load mechanics as graph edges), then serving. Change `stg_orders`' timezone handling and the tool rebuilds it *and its 9 descendants*, nothing else — the DAG converts 'what does this change break?' from archaeology into `dbt ls --select stg_orders+`."
            },
            {
              "type": "code",
              "heading": "Two models, so the shape is concrete",
              "lang": "sql",
              "code": "-- models/staging/stg_order_lines.sql  (materialized: view)\nSELECT\n  order_line_id,\n  order_id,\n  product_id,\n  quantity,\n  unit_price_cents / 100.0        AS unit_price,\n  discount_cents   / 100.0        AS discount_amount,   -- ONE place converts cents\n  CONVERT_TIMEZONE('UTC', ordered_at) AS order_ts       -- ONE place fixes timezones\nFROM {{ source('shop_db', 'order_lines') }}\n\n-- models/marts/fct_order_line.sql  (materialized: incremental, unique_key = order_line_id)\nSELECT\n  l.order_line_id,\n  d.date_key, c.customer_key, p.product_key, pr.promo_key, ch.channel_key,\n  l.quantity,\n  l.quantity * l.unit_price       AS gross_amount,\n  l.discount_amount,\n  l.quantity * l.unit_price - l.discount_amount AS net_amount\nFROM {{ ref('int_order_lines_enriched') }} l\nJOIN {{ ref('dim_date') }}     d  ON d.date       = l.order_ts::date\nJOIN {{ ref('dim_customer') }} c  ON c.natural_key = l.customer_id\n  AND l.order_ts >= c.effective_from AND (l.order_ts < c.effective_to OR c.effective_to IS NULL)\nJOIN {{ ref('dim_product') }}  p  ON ...\n-- ref() declares the DAG edges; the SCD-2 join is unit 3's event-time predicate,\n-- written once here instead of in every analyst's query."
            },
            {
              "type": "text",
              "heading": "The viewpoint underneath the tooling",
              "body": "The dbt project's founding essay called this stance 'analytics is a subfield of software engineering', and the claim cashes out in five practices worth naming independently of any tool, because they — not the tool — are what interviews and design reviews probe. **Version control**: every model is a file in a repository; the warehouse's transformation layer has a diff, a blame, and a revert. **Code review**: a changed revenue definition is a pull request a human approves, not a Tuesday surprise (the discount incident's organizational fix, at last: the change would have been a *visible diff* against `stg_order_lines`). **Environments**: the same DAG builds into dev/staging/prod schemas; unit 5's zero-copy clones make dev environments production-shaped for free. **Documentation as code**: model and column descriptions live beside the SQL and render into the lineage-aware catalog unit 9 will govern with. **DRY via layering**: the cents-to-dollars conversion, the timezone fix, the SCD-2 join each exist in *exactly one model*; unit 3's 'institutionalized vocabulary' argument, now applied to logic. The anti-pattern the viewpoint names is equally durable: a thousand-line query duplicated across four dashboards with three subtle divergences — which is not a style problem but a *correctness* problem, because divergent copies are how two dashboards disagree about revenue (unit 1's founding complaint, root-caused at last)."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**Views, tables, and the price of freshness-by-laziness.** New teams over-use views (always fresh! no storage!) until the marts are view-on-view-on-view stacks where every dashboard query re-executes the whole lineage — unit 4's engine doing the same joins thousands of times a day. The working defaults: staging = views (thin, rarely queried directly); intermediates = views or ephemeral unless heavy; marts = tables or incremental (queried constantly, must be cheap to read). The general law: **materialize where reads outnumber builds**; a mart read 5,000×/day and built 1×/day has a 5,000:1 argument for being a table — the same read/write asymmetry arithmetic as unit 1's caching logic."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Transformation now has a shape: ELT (raw in, reshape inside the platform), a layered DAG (staging airlocks, intermediate logic, consumer marts) whose declared edges yield build order and change-impact analysis, per-node materializations separating logic from cost, and the software practices — versioning, review, environments, DRY — that make the layer maintainable by teams rather than heroes. Trellis's star is fourteen reviewable files that build in one command. But one word in the materialization list is carrying enormous weight: *incremental*. A full nightly rebuild of a 60 TB fact is not a plan, and an incremental build that double-loads on rerun is worse than slow — it is wrong. The property that makes incremental safe — idempotency — and the theorem that lets a whole DAG inherit it are the next lesson."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Assign each responsibility to its layer (staging / intermediate / mart) and justify with the layer's rule: (a) mapping source status integers to labels; (b) the SCD-2 version-comparison logic for dim_customer; (c) the exec dashboard's pre-joined OBT; (d) deduplicating the raw events feed's replayed batches; (e) the revenue-recognition rule shared by three marts.",
                  "solution": "(a) Staging — a per-source convention with no joins; every downstream model inherits one mapping. (b) Intermediate — multi-step business logic feeding a mart (dim_customer); isolating it makes the graph's trickiest node independently testable. (c) Mart (serving) — consumer-facing, depends on the star, nothing depends on it (cache-not-model). (d) Staging — source-shaped cleaning (dedup by natural key + arrival metadata) so no downstream model ever meets the duplicates; if the dedup requires cross-batch state it may warrant an intermediate, but it must complete before business logic. (e) Intermediate — shared logic referenced by all three marts; duplicating it in each mart is the divergent-copies correctness bug.",
                  "hint": "Staging: one source, no joins. Intermediate: shared/complex logic. Mart: what consumers read."
                },
                {
                  "prompt": "A dashboard team complains their query is slow; investigation shows it hits a view that joins two views that each join staging views — a 6-view stack re-executed per query, ~40×/hour. The stack's underlying data changes once nightly. Apply the materialize-where-reads-outnumber-builds law: what changes, where, and what is the new nightly cost versus the saved hourly cost (qualitatively but concretely)?",
                  "solution": "Materialize the top of the stack (the mart the dashboard reads) as a table (or incremental) built nightly after its parents; optionally materialize the heaviest intermediate if other consumers hit it too. Reads:builds ≈ (40×24):(1) ≈ 960:1 — overwhelming. New nightly cost: one execution of the 6-view lineage (minutes on the ELT warehouse, elasticity-theorem priced); saved cost: ~960 daily executions of the same joins on the BI warehouse, plus the latency the humans felt. The staging views stay views (thin, rarely read directly). The general reflex: freshness-by-laziness (views) is correct only when data changes as often as it is read.",
                  "hint": "Count reads per build; move the materialization boundary up the stack."
                },
                {
                  "prompt": "Your teammate edits `stg_orders` to fix a timezone bug. Using the DAG, describe exactly what must rebuild and in what order (use the Trellis graph from this lesson), what can rebuild in parallel, and which models are provably untouched — then state the command-shaped selector that expresses 'this node and everything downstream'.",
                  "solution": "Rebuild set: stg_orders, then its descendants in topological order: int_order_lines_enriched (depends on stg_orders + stg_order_lines), then fct_order_line (after dim_date/dim_customer/dim_product — which do NOT rebuild unless they depend on stg_orders; dim_customer depends on stg_customers, so it is untouched), then mart_exec_daily. Parallelism: nothing else at staging level rebuilds; int_customer_versions and all product/promotion staging are provably untouched (no path from stg_orders). Selector: `stg_orders+` (the node and its descendants). The point: impact analysis is graph reachability, not memory — the DAG answers 'what breaks?' mechanically.",
                  "hint": "Follow edges from the changed node; anything without a path from it is safe."
                },
                {
                  "prompt": "Argue the ETL→ELT flip from unit 5's economics in four sentences: which two cost assumptions of classic ETL did the cloud invalidate, what new capability does retained raw enable, and name the one scenario where transform-before-load (ETL-shaped) is still correct.",
                  "solution": "Classic ETL assumed warehouse storage was too expensive to hold raw data and warehouse compute too weak/contended for heavy reshaping — so a separate engine transformed in flight. Object-store storage (unit 2) made raw retention nearly free, and elastic warehouse/lakehouse compute (units 5–6) made in-platform SQL the *cheapest and most optimized* transform engine available (pruning, vectorization, elasticity all apply). Retained raw enables replay: any transformation bug is repairable by rebuilding from history — the property every incident runbook since unit 2 has leaned on, impossible when raw was discarded in flight. ETL-shaped transformation remains correct when data legally or practically cannot land raw: PII that must be masked/tokenized before persistence, or edge/streaming reshaping where the source format is unusable at rest (unit 8's stream processing is, in this sense, ETL by necessity).",
                  "hint": "Two dead premises, one new superpower, one compliance-shaped exception."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u7l1-i1",
              "front": "ELT vs ETL — the flip and the two economics that drove it",
              "back": "ETL: transform in flight in a separate engine (storage/compute scarcity era). ELT: load raw first, transform inside the warehouse/lakehouse — cheap object storage makes raw retention free; elastic in-platform SQL is the strongest transform engine. Bonus: replay from retained raw."
            },
            {
              "id": "u7l1-i2",
              "front": "The three transformation layers and each one's rule",
              "back": "Staging: one model per source table — rename/cast/clean, no joins (the airlock). Intermediate: shared joins and business logic. Marts: consumer-facing star + serving OBTs. Dependencies point downstream only; consumers read marts only."
            },
            {
              "id": "u7l1-i3",
              "front": "What does ref()/the declared dependency give you beyond style?",
              "back": "A computable DAG: topological build order, parallelism, and mechanical change-impact analysis (`node+` = the node and all descendants) — 'what breaks?' becomes graph reachability."
            },
            {
              "id": "u7l1-i4",
              "front": "The four materializations and the law for choosing",
              "back": "View (compute at read), table (full rebuild), incremental (merge new data), ephemeral (inlined). Law: materialize where reads outnumber builds — a mart read 5,000×/day and built 1×/day is a table, not a view stack."
            },
            {
              "id": "u7l1-i5",
              "front": "Why is duplicated transformation logic a correctness bug, not a style issue?",
              "back": "Divergent copies are how two dashboards disagree about revenue — each copy drifts independently. The fix is structural: each rule lives in exactly one model (staging convention, intermediate logic), and everything downstream inherits it."
            }
          ]
        },
        {
          "id": "u7l2",
          "title": "Idempotency and Incremental Models",
          "estMinutes": 28,
          "builds_on": [
            "u7l1",
            "u6l3"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The property everything leans on",
              "body": "*ELT, Layers, and the Transformation DAG* ended with a warning: incremental builds are mandatory at scale and dangerous by default. The danger has a precise shape, met three times already in this course: v0's TRUNCATE-and-reload that a crash leaves empty; the exercise where a rerun after failure doubled Tuesday's revenue; the orchestrator that retries a half-finished job into corruption. All are the same missing property. A transformation is safe to run *again* — after a crash, a retry, a backfill, an orchestrator hiccup, a nervous engineer's manual rerun at 2 a.m. — exactly when running it again cannot change the outcome beyond what running it once would have produced. That property is **idempotency**, and this lesson does three things with it: defines it precisely alongside its sibling determinism; proves the composition theorem that lets an entire DAG inherit safety from its nodes; and engineers the two workhorse implementations — atomic full replacement and keyed incremental MERGE with a late-data lookback — that satisfy it in practice. The tone shift is deliberate: this is the unit's theory lesson, because reruns are not an edge case in production data engineering. They are Tuesday."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Idempotent and deterministic transformations",
              "statement": "Model a transformation node as a write operation w that maps the current state of its output table, given the committed state I of its inputs, to a new output state: O′ = w(O; I).\n\nw is **idempotent** iff applying it twice (with the same committed inputs) equals applying it once: w(w(O; I); I) = w(O; I) for all O. It is **deterministic** iff its result depends only on (O, I) — not on wall-clock time, random choices, row order, or run count.\n\nThe two workhorse idempotent write patterns: **(1) Full replacement** — O′ = f(I), computed to a staging object and atomically swapped in (units 5–6's atomic publish): the output is a pure function of inputs; prior output state is irrelevant, so a second run rebuilds the identical table. **(2) Keyed merge** — O′ = O ⊎ₖ f(I_window): MERGE the recomputed rows for a bounded input window into O by unique key k (update if present, insert if absent). Applying the same keyed rows twice is a no-op the second time — provided f's window is derived from *input* state (event dates, source watermarks), not from run history.\n\nThe canonical **non**-idempotent patterns, for contrast: blind INSERT-append (each run adds rows: w(w(O)) ≠ w(O)); DELETE-then-INSERT without a transaction (a crash between them is observable); any f referencing CURRENT_TIMESTAMP, sequence numbers, or 'rows since my last run' bookkeeping stored outside the inputs."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The composition theorem: idempotent nodes make a rerunnable DAG",
              "statement": "Let a transformation DAG have nodes whose writes are idempotent and deterministic (per the definition), with raw sources fixed for the build period. Then: (a) rerunning any node — once or many times — leaves the DAG's final state identical to a single clean topological run; (b) rerunning any *subset* of nodes, in any order consistent with dependencies (each node running after any of its rerun ancestors), converges to that same state; (c) consequently crash recovery is trivial — rerun everything downstream of (and including) the failed node — and backfills are the same operation as daily runs, pointed at older windows.",
              "proof": "(a) Fix the raw sources. Proceed by induction over topological order. Base: a source-reading node n₁'s inputs I are fixed; determinism gives the same computed rows every run, and idempotency gives w(w(O;I);I) = w(O;I) — so after its last rerun, n₁'s output equals its single-clean-run output, regardless of how many times or from what prior state it ran. Inductive step: assume every ancestor of node n has settled to its clean-run state after its final rerun. n's final run reads exactly those settled inputs I*; determinism computes the clean-run rows; idempotency makes n's final state w(O_whatever; I*) = the clean-run output, independent of O_whatever (full replacement ignores it; keyed merge over the same recomputed keyed rows produces the same table). (b) A subset rerun consistent with dependencies is a sequence in which each node's *final* execution follows its ancestors' final executions — the induction above only used that property, so it applies verbatim; nodes not rerun already hold their clean-run state by assumption of a previously completed build. (c) Crash recovery: the failed node's partial work is invisible (atomic publish) or harmlessly re-mergeable (keyed merge), and rerunning it plus descendants is a subset rerun per (b). Backfill: pointing the window parameter at an older range changes I, not the algebra — the same theorem applies to the historical window. Note what the theorem does *not* survive: a non-deterministic node (CURRENT_TIMESTAMP, unordered ROW_NUMBER dedup) breaks the induction at its first appearance, and every descendant inherits the breakage — one impure node poisons the subtree. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: fct_order_line as an incremental model with a lookback",
              "body": "The fact table's incremental build, engineered clause by clause. Daily new volume: ~60 k order lines against a 40 M-row table — a full rebuild would re-scan and re-join two years to refresh 0.15% of it. The incremental form: **(1) Window from input state**: process rows where `order_ts >= (SELECT MAX(order_ts) FROM fct_order_line) - INTERVAL '3 days'` — the high-water mark read from the *output's own committed data* (a function of prior committed state, which the theorem permits: it is determined by I of prior runs... operationally: derived from data, not from a run-log). Why minus 3 days? **Late data**: unit 8's ingestion can deliver stragglers — an order captured at a store kiosk syncing late, a CDC batch replayed. If p99.9 of arrival lateness is < 72 h, a 3-day lookback re-processes the window where stragglers can land. **(2) Recompute the window deterministically**: joins to dims use the event-time SCD-2 predicate (unit 3) — late rows joining *old* dimension versions correctly, the late-arriving-fact bug pre-fixed by construction. **(3) Write by keyed MERGE** on order_line_id: rows already loaded are overwritten with identical values (no-op), stragglers insert, corrections update. Rerun the job five times: the theorem says — and the MERGE mechanics deliver — byte-identical results.\n\nThe cost ledger (unit 5 pricing): full rebuild ≈ scan/join ~20 GB nightly, ~15 min on an L warehouse; incremental ≈ 3 days ≈ 180 k rows ≈ tens of MB, seconds on an XS — **two orders of magnitude**, nightly, forever. Incremental is not an optimization; at fact-table scale it is the difference between a pipeline and a bonfire."
            },
            {
              "type": "example",
              "heading": "Worked example: three reruns, one diagnosis each",
              "body": "Rerun forensics — the skill the theorem trains. **Case A**: nightly job crashes at 02:40; on-call reruns at 06:00; Tuesday's revenue doubles. Diagnosis: the load was `INSERT INTO fct … SELECT … WHERE order_ts::date = CURRENT_DATE - 1` — blind append (non-idempotent write) *and* a window computed from wall-clock (non-deterministic across the midnight boundary, a second latent bug). Fix: keyed MERGE + data-derived watermark; the rerun becomes a no-op over already-loaded keys.\n\n**Case B**: a backfill of March reruns cleanly, but April's numbers *change slightly*. Diagnosis: a dedup step used `ROW_NUMBER() OVER (PARTITION BY natural_key ORDER BY loaded_at)` where loaded_at ties were broken arbitrarily — non-deterministic choice among duplicates; March's rebuild picked different winners, and an SCD-2 intermediate propagated the difference forward. Fix: total ordering (`ORDER BY loaded_at, source_seq, natural_key`) — determinism restored, the theorem's induction repaired.\n\n**Case C**: reruns are clean, but each run of a 'cheap' incremental takes 40 minutes. Diagnosis: the MERGE's join touched the whole target (no pruning) because the merge condition lacked the partition predicate — unit 6's write-side pruning lesson: `MERGE … ON t.order_line_id = s.order_line_id AND t.order_ts >= DATEADD(day, -3, CURRENT_… )` (or the platform's incremental predicate feature) restricts the scan to recent partitions. Idempotency made the reruns *safe*; this fix makes them *cheap* — the two properties are independent, and production needs both."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**The lookback window is a contract with ingestion, not a folk remedy.** 'Minus 3 days' is correct only if arrival lateness beyond 72 h is genuinely negligible — a fact about unit 8's sources that must be *measured* (the lateness distribution of event_ts vs loaded_at) and *monitored* (alert when late fraction beyond the window rises). Data later than the lookback is silently never loaded — the failure is invisible by construction, which is exactly the class of failure this course keeps teaching you to make loud. Pair every lookback with a freshness/completeness check (lesson 3), and revisit the window when sources change. The alternative pattern for genuinely unbounded lateness — reprocess-by-affected-partition, where late rows trigger a rebuild of the partitions they touch — trades bounded windows for event-driven correctness."
            },
            {
              "type": "text",
              "heading": "Functional data engineering: the same theorem in partition clothes",
              "body": "The composition theorem has a widely-used special case worth naming, associated with Maxime Beauchemin's 'functional data engineering' essays: make the unit of work the **partition**, and make every task an idempotent pure function that *overwrites exactly one partition* — `INSERT OVERWRITE PARTITION (dt='2026-08-27') SELECT … FROM sources WHERE dt='2026-08-27'`. Each (task, partition) pair is a full-replacement write (workhorse #1) whose inputs are that partition's slice of the sources: pure, deterministic, idempotent by construction — and the orchestrator's mental model collapses into a grid of (day × table) cells, each rebuildable independently. Backfilling June = rerunning June's cells; a late-data day = rerun that day's cell; no MERGE machinery, no watermark subtleties. Its limits mark where the general theorem is still needed: cross-partition logic (SCD-2 versioning that compares against *current* state; sessionization windows straddling midnight) cannot be a per-partition pure function, and very large partitions rebuilt for tiny changes waste the u5/u6 write-pruning that MERGE exploits. The mature stance: partition-overwrite as the default idiom for time-partitioned facts and aggregates; keyed MERGE where corrections and cross-partition state force it; and in both cases the theorem — not tribal caution — is why reruns are boring."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Idempotency is now a definition (w(w(O;I);I) = w(O;I)), a theorem (idempotent + deterministic nodes compose into a DAG where any rerun of any subset converges — and one impure node poisons its subtree), and a toolkit (atomic full replacement; keyed MERGE with a measured lookback; partition-overwrite as the functional special case), with the cost arithmetic showing incremental as a 100×-class necessity rather than a nicety. Trellis's nightly build is now safe to rerun and cheap to run. What it is not yet is *trustworthy*: a build that runs perfectly can still publish garbage perfectly — the discount incident ran green from end to end. Tests that interrogate the data, orchestration that sequences and retries, and the write-audit-publish gate that provably keeps failures out of consumers' sight close the unit next."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Classify each write pattern as idempotent or not, and repair the broken ones minimally: (a) DELETE FROM t WHERE dt = '2026-08-26'; INSERT INTO t SELECT … (two statements, no transaction); (b) MERGE INTO t USING s ON t.id = s.id WHEN MATCHED UPDATE WHEN NOT MATCHED INSERT; (c) INSERT INTO t SELECT …, CURRENT_TIMESTAMP AS loaded_at FROM …; (d) INSERT OVERWRITE PARTITION (dt='2026-08-26') SELECT … WHERE dt='2026-08-26'.",
                  "solution": "(a) Not idempotent as written — a crash between DELETE and INSERT leaves the day missing, and concurrent readers see the gap; wrap in a transaction / use the platform's atomic partition overwrite so the pair is one atomic replacement (then it becomes pattern d, idempotent). (b) Idempotent — keyed merge: same source rows applied twice produce the same table (second application is a no-op). (c) Not idempotent in effect *and* non-deterministic: reruns produce rows differing in loaded_at (breaking byte-equality and any downstream logic reading it), and if id isn't enforced, duplicates too; repair: derive loaded_at from input metadata (batch id / source watermark) or exclude it from difference-sensitive logic, and write via keyed merge or overwrite. (d) Idempotent — the functional partition pattern: pure function of the partition's inputs, atomic replacement of exactly that partition.",
                  "hint": "Ask of each: what does the second run do? What does a crash mid-run leave visible?"
                },
                {
                  "prompt": "Measurement shows arrival lateness for order events: p95 = 40 min, p99.9 = 31 h, worst observed = 9 days (one kiosk outage). Choose the incremental lookback for the nightly fact build, quantify what your choice silently misses, and design the compensating control for the tail — cost each option qualitatively.",
                  "solution": "Lookback = 2 days (48 h) covers p99.9 = 31 h with margin: nightly reprocessing ≈ 2 days × 60 k ≈ 120 k rows — trivial cost. Silently missed: the >48 h tail (≲ 0.1% of rows, but *correlated* — outages arrive in clumps, like the 9-day kiosk, so 'p99.9' understates event risk). Compensating controls, in preference order: (1) completeness reconciliation — daily count of source rows vs loaded rows per event-date over a trailing 14 days; a gap triggers a targeted backfill of the affected dates (rerun those partitions/windows — safe by the composition theorem); cost: one cheap audit query. (2) Event-driven reprocess: ingestion flags batches containing events older than the lookback and enqueues partition rebuilds; cost: orchestration plumbing, but the tail becomes structurally covered. Extending the lookback to 10 days 'to be safe' is the weakest option: 5× nightly cost forever to cover a tail that reconciliation catches for pennies — windows handle the distribution's body; controls handle its tail.",
                  "hint": "Cover p99.9 with the window; cover the correlated tail with a reconciliation that triggers targeted reruns."
                },
                {
                  "prompt": "Prove the 'poisoned subtree' corollary from the composition theorem: if one node n is non-deterministic (two clean runs can produce different committed outputs from identical inputs), then even with every other node idempotent and deterministic, a rerun of n's subtree need not converge to the original build's state — and name the two production symptoms this manifests as.",
                  "solution": "Proof sketch: the theorem's induction requires that a node's final run, reading settled inputs I*, produces the clean-run output — which relied on determinism (same I* ⇒ same computed rows). For non-deterministic n, two executions with identical I* may commit different outputs O₁ ≠ O₂ (e.g., different tie-break winners). Every descendant d reads n's output as input: d's determinism now faithfully propagates whichever Oᵢ occurred — determinism downstream preserves differences, it doesn't erase them. Hence a rerun (crash recovery, backfill) can settle the subtree at a state differing from the original build wherever the outputs diverge, and no further rerunning converges them (each rerun may re-roll the dice). ∎ Symptoms: (1) 'the backfill changed months it shouldn't have touched' — historical rebuilds pick different non-deterministic winners and SCD/intermediate state carries it forward (Case B); (2) 'dev and prod disagree on identical inputs' — environment rebuilds settle on different states, burning trust and debugging time on a phantom diff.",
                  "hint": "Where exactly does the induction use determinism? Then follow one changed row through deterministic descendants."
                },
                {
                  "prompt": "A teammate proposes tracking incremental progress in an etl_runs bookkeeping table ('last successful run processed through 02:00') instead of deriving the watermark from the data. Give the two failure modes this invites that data-derived watermarks avoid, and the one scenario where an external run-log is nonetheless necessary.",
                  "solution": "(1) Divergence: the bookkeeping can lie — a run marked successful after a partial commit (or marked failed after a full one) makes the next window skip or re-cover the wrong range; the data-derived watermark (MAX(event_ts) in the committed output) cannot disagree with the output because it *is* the output — the invariant travels with the state it describes. (2) Rerun/backfill fragility: restoring a table to a past version (u5/u6 time travel) or rebuilding an environment desynchronizes the external log from the actual table state — every clone/restore now needs log surgery; data-derived watermarks are automatically correct after any restore. Necessary external log: when the source is a *consumed stream* whose read position isn't reconstructible from the output (unit 8's consumer offsets — e.g., exactly-once sinks storing offsets transactionally *with* the data, which is the disciplined version: the 'log' commits atomically with the output, restoring the invariant).",
                  "hint": "What happens when the note about the state and the state itself disagree? Which commit makes them unable to?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u7l2-i1",
              "front": "Idempotent transformation — definition and the two workhorse patterns",
              "back": "w(w(O;I);I) = w(O;I): rerunning with the same committed inputs changes nothing. Patterns: atomic full replacement (O′ = f(I), staged + swapped) and keyed MERGE of a recomputed window (second application is a no-op)."
            },
            {
              "id": "u7l2-i2",
              "front": "The composition theorem (and its poison clause)",
              "back": "Idempotent + deterministic nodes ⇒ any rerun of any subset of the DAG converges to the single-clean-run state (crash recovery = rerun downstream; backfill = same op, older window). One non-deterministic node poisons its whole subtree."
            },
            {
              "id": "u7l2-i3",
              "front": "The canonical non-idempotent patterns to hunt in review",
              "back": "Blind INSERT-append; untransacted DELETE-then-INSERT; CURRENT_TIMESTAMP/sequence values in outputs; windows from wall-clock or external run-logs; unordered ROW_NUMBER dedup (non-determinism)."
            },
            {
              "id": "u7l2-i4",
              "front": "Incremental lookback window — what sets it and what pairs with it",
              "back": "The measured arrival-lateness distribution (cover ~p99.9); beyond-window data is silently never loaded, so pair it with a completeness reconciliation that triggers targeted backfills for the correlated tail."
            },
            {
              "id": "u7l2-i5",
              "front": "Functional data engineering (partition-overwrite) — the idiom and its limits",
              "back": "Each task = pure function overwriting exactly one partition from that partition's inputs: idempotent by construction, backfill = rerun cells. Limits: cross-partition state (SCD-2, sessions over midnight) and tiny changes to huge partitions (MERGE's write-pruning wins there)."
            },
            {
              "id": "u7l2-i6",
              "front": "Why derive watermarks from the data rather than a run-log?",
              "back": "MAX(event_ts) of committed output can't disagree with the output — correct after crashes, restores, clones. External bookkeeping can lie (partial commits, restored tables) unless committed atomically with the data (the stream-offset discipline)."
            }
          ]
        },
        {
          "id": "u7l3",
          "title": "Testing, Orchestration, and Write-Audit-Publish",
          "estMinutes": 28,
          "builds_on": [
            "u7l2",
            "u1l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Green pipelines, wrong numbers",
              "body": "*Idempotency and Incremental Models* made the build safe to rerun; nothing yet makes it *right*. The discount incident — this course's recurring ghost since unit 1 — ran a fully green pipeline: every job exited zero, every load committed, and revenue was wrong by 12% for two days. Unit 2's schema-embedded formats made *structural* drift loud; what remains silent is *semantic* and *statistical* drift: the column that still parses but means something new, the join that fans out, the feed that delivers half its usual rows, the duplicate natural keys a source replay smuggled in. The last line of defense is to interrogate the data itself, every run, with declared expectations — and to arrange the pipeline so that data failing interrogation **cannot reach consumers**. This lesson builds that arrangement: the test taxonomy (cheap, declarative, run-every-build), the orchestration layer that sequences, retries, and alerts, and the write-audit-publish pattern whose guarantee — consumers never observe unaudited data — we prove from the atomic-publish machinery of units 5 and 6."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "The test taxonomy; write-audit-publish",
              "statement": "**Schema/constraint tests** (declared per column or model, executed as queries every build): **unique** (no duplicate keys — catches replays and fan-out), **not_null** (required fields present), **relationships** (referential integrity: every fact FK resolves to a dimension row — catches late-arriving-dimension gaps), **accepted_values / accepted_range** (domain checks: status ∈ {…}, discount_rate ∈ [0, 0.9] — the discount incident's tripwire). **Data (logic) tests**: arbitrary SQL asserting business invariants, passing when they return zero rows ('no order line where net > gross'; 'drill-across: SUM(fct_order_line.net) = SUM(stg_order_lines.net) for the window' — reconciliation between layers). **Operational monitors**: **freshness** (MAX(loaded_at) recent enough per source SLO) and **volume/anomaly** (today's row count within an expected band of history — the check that catches the half-empty feed and the 12% overnight shift).\n\n**Write-audit-publish (WAP)**: every build writes to a **staging object invisible to consumers** (a staging schema/table, a Delta/Iceberg branch or unpublished version, a clone); the **audit** suite runs against that staged object; **publish** is a single atomic operation (swap/rename/pointer-commit — u5's SWAP, u6's version publish) executed *only if* all blocking audits pass. On failure: no publish — consumers continue reading the last published (and previously audited) state; the on-call gets the staged evidence intact."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "WAP's guarantee: consumers never observe unaudited data",
              "statement": "Under three premises — (i) consumers read only the published object, and every build writes exclusively to staging objects invisible to them; (ii) publication is atomic (readers see the pre-publish or post-publish state, never a mixture — the u5/u6 swap primitives); (iii) publish executes only after the audit suite passes on the exact staged state being published — every state a consumer can ever observe has passed the audit suite, and a failing or crashing build leaves consumers on the last audited state with zero downtime.",
              "proof": "By induction on published states. Base: the initial published state is audited (bootstrap audit at first publish). Step: suppose every state published so far passed audits, and consider any moment a consumer reads. By (i) the read resolves against the published object — staged writes are invisible, so no build in progress, failed, or abandoned can leak into the read. The published object changes only via publish events; by (iii) any such event was preceded by a passing audit of *exactly* the staged state being swapped in (not a lookalike — the audited object is the published object, which is why WAP audits staging rather than re-checking after publish); by (ii) the change is atomic, so the reader sees either the previous published state (audited, by induction) or the new one (audited, by iii) — never a blend, and never a partially-swapped hybrid. A build that fails audits or crashes performs no publish event, so the published object is untouched: consumers experience continuity on the last audited state, and the staged failure remains available for forensics. Hence every observable state is audit-passed. ∎ Note the load-bearing premise in practice is (i): one consumer with permissions to read staging schemas — a dashboard pointed at stg_, a data scientist querying the branch — voids the guarantee silently; WAP is an access-control discipline as much as a sequencing one."
            },
            {
              "type": "example",
              "heading": "Worked example: the discount incident, killed four ways",
              "body": "Replay unit 1's incident against the finished pipeline, and count the tripwires it must now cross. The app team ships discount-as-percentage; the nightly build runs.\n\n**Tripwire 1 — staging range test**: `accepted_range: discount_amount between 0 and 500` on stg_order_lines. Percentages (0–90) *overlap* dollar ranges — this tripwire alone might pass. This is deliberate in the retelling: single tests have blind spots; suites catch what members miss.\n\n**Tripwire 2 — logic test**: 'zero rows where discount_amount > gross_amount' — still passes for most rows. **Tripwire 3 — statistical monitor**: AVG(discount_amount) falls from ~$4.10 to ~0.31 overnight — a 13× shift, far outside the trailing-28-day band: **fails, blocking**. **Tripwire 4 — reconciliation**: mart revenue vs staging revenue diverges 12% from yesterday's ratio: **fails**.\n\nBecause the build is WAP, the failing audits mean *no publish*: dashboards at 08:00 show yesterday's (correct) data with a freshness banner, not today's corruption. The on-call reads the audit report — two failures, both pointing at discount_amount, staged data intact for diffing against yesterday — and the fix (unit 2's schema-contract conversation with the app team, plus a recompute) ships before any executive sees a wrong number. Total consumer damage: one day of staleness, loudly labeled. Compare the original timeline: two days of silent corruption, CFO discovery, forensic spreadsheet archaeology, and a trust deficit that outlived the fix by quarters. The delta is the entire argument for this lesson — and note that *idempotency is what made the recovery boring*: rerun the corrected build, MERGE converges, publish."
            },
            {
              "type": "text",
              "heading": "Orchestration: the DAG meets the clock and the failures",
              "body": "Someone must run all this — in order, on time, retrying transient failures, alerting on real ones, and coordinating backfills. That is the **orchestrator** (Airflow and its descendants; dbt Cloud's scheduler for pure-SQL DAGs; Databricks workflows on the lakehouse), and its responsibilities partition cleanly. **Sequencing**: execute lesson 1's DAG in dependency order — including *cross-system* edges the transformation tool can't see: 'fct_order_line builds only after tonight's CDC batch lands' is a sensor/trigger on unit 8's ingestion, not a ref(). **Retry policy**: transient faults (warehouse restart, cloud hiccup) retry automatically with backoff — *safe because the nodes are idempotent*; the composition theorem is what licenses the orchestrator to retry anything, anytime, without human judgment about 'did the first attempt half-commit?'. **Failure semantics**: a genuinely failing node halts its *descendants* (building marts on failed staging is corruption-by-schedule) while unrelated subtrees proceed; the blast radius is the reachability set, mechanically derived from the DAG. **Backfills**: 'rebuild June for the discount fix' becomes a parameterized run over June's windows/partitions — again the theorem doing the work: backfill = daily run, older inputs. **Observability**: run history, durations, and audit outcomes per node — the operational memory that turns 'the pipeline is flaky' into 'stg_payments' p95 build time doubled on the 14th', which is a diagnosis. The failure mode to design against is orchestration *sprawl*: business logic leaking into DAG glue (a transformation hidden in an Airflow PythonOperator escapes review, tests, and lineage). The discipline: transformations live in the modeled DAG; the orchestrator sequences, senses, retries, and reports — it never computes."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Blocking versus warning tests is a severity decision you must make explicitly.** Block publish on: uniqueness of keys, referential integrity of the star, reconciliation between layers, and statistical monitors on money-bearing columns — wrong numbers must not ship. Warn (publish, but page or ticket) on: freshness slightly past SLO, volume drift in low-stakes tables, new enum values in descriptive fields. Two failure patterns to avoid: everything-blocks (one flaky warning test holds all of Monday's data hostage and teaches the team to bypass the gate — bypass culture is how WAP dies) and nothing-blocks (the gate is theater). Review severity quarterly with consumers: a test's blocking status is a product decision about *their* tolerance for staleness versus wrongness."
            },
            {
              "type": "example",
              "heading": "Worked example: a night in the life, end to end",
              "body": "The finished Trellis nightly, as the orchestrator sees it. **01:30** — sensors confirm: CDC batch for orders landed (unit 8), clickstream compaction complete (unit 6). **01:35** — ELT warehouse resumes (unit 5); staging models build in parallel; staging audits run (uniqueness, not_null, freshness per source). stg_payments' source is 40 min late → its sensor holds that subtree; orders/products/customers proceed (partial-graph progress: the DAG's reachability doing triage). **01:50** — intermediates; the SCD-2 versioner emits 1,204 new customer versions; its invariant test ('exactly one is_current per natural_key') passes. **02:05** — marts build incrementally (2-day lookback MERGEs); payments subtree resumes on arrival, 02:20. **02:30** — the audit suite on staged marts: 34 tests, 33 pass; the volume monitor on fct_order_line flags +9% versus band — *warning* severity (a real promo ran yesterday; the monitor's job is to make someone look, and the run-log shows a linked marketing calendar annotation). **02:35** — publish: atomic swaps of the staged marts; the exec OBT rebuilds from the published star; result caches invalidate (unit 5's versioning, doing its correctness job). **02:38** — warehouse auto-suspends; total compute: 63 minutes across two warehouses; the run report — durations, audit outcomes, rows merged per model — posts to the team channel. No human touched anything. That sentence, which would have been fantasy against v0, is the unit's deliverable — and every clause of it was purchased by a specific mechanism with a specific proof or price tag."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The transformation layer is finished as an engineered system: a layered, version-controlled DAG (lesson 1) whose nodes are idempotent and therefore retryable, backfillable, and convergent (lesson 2), interrogated every run by a test taxonomy that makes semantic drift loud, sequenced by an orchestrator that owns time, retries, and blast radius, and gated by write-audit-publish — with the proof that consumers can only ever see audited states. The discount incident is, at last, structurally impossible to ship silently. What the pipeline still takes on faith is its *inputs*: everything downstream of the raw zone is now rigorous, but the raw zone itself fills by mechanisms this course has hand-waved as 'the nightly export' and 'the CDC batch' since unit 1. How data actually moves from operational systems into the platform — batch extraction, change data capture, the log, streaming semantics, and the exactly-once question — is unit 8."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "For each failure, name the cheapest test/monitor from the taxonomy that catches it and whether it should block or warn: (a) a source replay loads Tuesday's order batch twice into staging; (b) the customer feed delivers 3% of its usual rows after a partner API change; (c) a new fulfillment status 'RELABELED' appears and breaks a downstream CASE; (d) fct rows whose promo_key matches no dim_promotion row after a promo launched at midnight; (e) the exec OBT silently diverges from the star after a manual hotfix to the OBT.",
                  "solution": "(a) unique test on staging natural key (order_line_id) — block: doubled revenue must not publish. (b) volume/anomaly monitor on stg_customers row count vs trailing band — block (money-adjacent dimension) or high-severity warn with freshness hold, per consumer agreement. (c) accepted_values on status — warn is usually right (new enum values are often legitimate; the test's job is to force a human to map it), escalating to block for status fields that gate revenue logic. (d) relationships test fct.promo_key → dim_promotion — block; also the late-arriving-dimension placeholder pattern (unit 3) is the *fix*, and the test verifies it ran. (e) reconciliation data test: SUM(net) OBT vs star for the window — block; and the deeper fix is organizational: the OBT is a derived cache (unit 3's ruling) — manual writes to it should be impossible, which is an access-control change the test failure motivates.",
                  "hint": "Match the failure's signature (duplicates, volume, domain, referential, cross-layer drift) to the test family."
                },
                {
                  "prompt": "Prove the corollary: in a WAP pipeline meeting the proposition's premises, a bug that corrupts *every* build for a week causes zero consumer-visible corruption — then state what the consumers *do* experience, and why that experience is itself a designed feature rather than collateral damage.",
                  "solution": "Each night's build writes corrupt data to staging; the audit suite (assuming it detects the corruption — premise iii's suite must actually cover the failure, the honest caveat) fails; no publish event occurs. By the proposition's induction, the published object still holds the last audited state from before the bug; every consumer read all week resolves to that state (premise i) — zero corrupted reads. ∎ Consumers experience *staleness*: a week-old dataset, with freshness monitors and banners saying so loudly. That is designed: the pipeline converts 'silently wrong' into 'loudly stale', and staleness is the strictly better failure — it is visible, bounded, explainable, and preserves trust (a consumer who knows data is delayed makes different decisions than one deceived by wrong data). The corollary also exposes WAP's dependency: the guarantee is only as strong as the audit suite's coverage — which is why monitors on money columns and reconciliations exist even when no one can name the bug they'll catch.",
                  "hint": "No pass ⇒ no publish ⇒ published state frozen; then ask what 'frozen' looks like from a dashboard."
                },
                {
                  "prompt": "An orchestrator retries a failed model three times with backoff. Explain (a) which lesson-2 property makes automatic retry safe and what specifically goes wrong retrying without it; (b) why the orchestrator must halt the failed node's descendants but should keep independent subtrees running; (c) what a 'sensor' edge is and why cross-system dependencies can't be ref() edges.",
                  "solution": "(a) Idempotency: a retry after a partial/ambiguous failure re-applies the write, and w(w(O)) = w(O) guarantees convergence; without it, retries double-append or re-delete — the orchestrator would need human judgment per failure ('did attempt 1 commit?'), which is operationally equivalent to having no retries. (b) Descendants read the failed node's output: building them on stale/absent input publishes corruption-by-schedule (the blast radius is the reachability set); independent subtrees share no path, so halting them trades availability for nothing — partial-graph progress is why one late source doesn't hold the whole warehouse hostage. (c) A sensor is a dependency on an *external* condition (CDC batch landed, file arrived, upstream system's flag) — polled or event-triggered; ref() edges are visible only within the transformation tool's graph, but the true DAG spans systems (ingestion → transformation → serving), and the orchestrator is precisely the layer that owns those cross-system edges.",
                  "hint": "Idempotency licenses retries; reachability bounds blast radius; the real DAG is bigger than the SQL DAG."
                },
                {
                  "prompt": "Design the WAP implementation for Trellis on each platform, naming the exact publish primitive: (a) Snowflake marts; (b) a Delta lakehouse table; (c) and answer the governance question both share: what access-control rule makes premise (i) hold, and what routine practice most often breaks it?",
                  "solution": "(a) Snowflake: build into an audit schema (or a zero-copy clone-based staging), run audits there, publish via ALTER TABLE … SWAP WITH (atomic object swap; u5's primitive) — or build the new table and swap names in one transaction; consumers read only the analytics schema, never audit_. (b) Delta: write to the table via a staged commit pattern — either a separate staging table with a final atomic overwrite/CTAS-swap, or (cleaner where supported) write to an unpublished branch/version and make the audited version current in one commit (u6's put-if-absent publish); the audit reads the staged version by version-pin. (c) Premise (i) holds iff consumer roles have no read grants on staging schemas/branches — enforced by role design, not convention. The routine breaker: a data scientist or dashboard granted broad read access 'temporarily' who points a persistent artifact at stg_/the branch — from then on, failed builds are silently visible to that consumer. The countermeasure is structural: staging lives in schemas whose grants are owned by the platform team and audited (unit 9's governance), and every consumer-facing object lives behind the published boundary.",
                  "hint": "Find each platform's atomic swap; then ask who can read the thing that isn't published yet."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u7l3-i1",
              "front": "The test taxonomy, by family",
              "back": "Schema/constraint: unique, not_null, relationships (referential), accepted_values/range. Logic/data tests: zero-row SQL invariants + cross-layer reconciliations. Operational monitors: freshness (SLO) and volume/statistical anomaly bands."
            },
            {
              "id": "u7l3-i2",
              "front": "Write-audit-publish — the three steps and the guarantee",
              "back": "Write to consumer-invisible staging; audit that exact staged state; publish via one atomic swap only on pass. Guarantee (provable): every consumer-observable state passed audits; failures leave consumers on the last audited state — loudly stale, never silently wrong."
            },
            {
              "id": "u7l3-i3",
              "front": "The practically load-bearing premise of WAP",
              "back": "Consumer invisibility of staging — one dashboard or scientist with staging read grants voids the guarantee silently. WAP is an access-control discipline as much as a sequencing pattern."
            },
            {
              "id": "u7l3-i4",
              "front": "Which failures did statistical monitors catch that schema tests missed?",
              "back": "Semantic drift with plausible values: the discount unit change (13× mean shift), the half-empty feed (volume band). Ranges and types overlap; distributions don't — money-bearing columns deserve anomaly bands."
            },
            {
              "id": "u7l3-i5",
              "front": "What the orchestrator owns — and the sprawl anti-pattern",
              "back": "Cross-system sequencing (sensors), retries (licensed by idempotency), failure blast-radius = DAG reachability, backfills as parameterized reruns, run observability. Anti-pattern: business logic hiding in orchestrator glue — transformations belong in the reviewed, tested DAG; the orchestrator never computes."
            },
            {
              "id": "u7l3-i6",
              "front": "Blocking vs warning severity — the rule and the two death modes",
              "back": "Block what must never ship wrong (keys, referential integrity, reconciliations, money-column anomalies); warn where staleness is worse than the drift. Death modes: everything-blocks (bypass culture kills the gate) and nothing-blocks (theater)."
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
            "prompt": "A fact table holds 900 days of history at ~2 GB/day scanned cost for a full rebuild (1.8 TB). The incremental build processes a 3-day lookback window instead. Ignoring fixed overheads, by what factor does the incremental build reduce nightly bytes processed?",
            "answer": 300,
            "tolerance": 5,
            "explanation": "Full rebuild: 900 days; incremental: 3 days — 900/3 = 300×. This is why incremental materialization is a necessity at fact scale, and why its safety property (idempotent keyed MERGE with a measured lookback) gets a theorem rather than a footnote.",
            "points": 1
          },
          {
            "id": "u7q2",
            "type": "short",
            "prompt": "One word: the property of a transformation's write operation that makes orchestrator retries, crash recovery, and backfills safe by construction (w applied twice equals w applied once).",
            "accept": [
              "idempotency",
              "idempotence",
              "idempotent"
            ],
            "explanation": "Idempotency — w(w(O;I);I) = w(O;I). With determinism, the composition theorem extends it from nodes to the whole DAG: any rerun of any subset converges to the clean-run state, which is what licenses automatic retries and makes backfills the same operation as daily runs.",
            "points": 1
          },
          {
            "id": "u7q3",
            "type": "mcq",
            "prompt": "A pipeline's nightly job is `INSERT INTO fct SELECT … WHERE order_date = CURRENT_DATE - 1`. It crashed at 02:10 and was rerun at 06:00; separately, a backfill of last March ran it 31 times with modified dates. Which statement identifies BOTH defects?",
            "options": [
              "The blind INSERT is non-idempotent (the 06:00 rerun double-loads any rows the crashed run committed), and the CURRENT_DATE-derived window is non-deterministic run-to-run (the same logical job selects different data depending on when it executes)",
              "The job is fine for reruns because the WHERE clause restricts it to one day, but the backfill is unsafe because 31 runs exceed warehouse concurrency limits",
              "The only defect is performance: INSERT without a MERGE cannot use write-side pruning, so each run scans the full target table",
              "The job is idempotent because inserting the same day twice is prevented by the date filter; the defect is purely that CURRENT_DATE fails on the exact midnight boundary"
            ],
            "answer": 0,
            "explanation": "Two independent violations of the lesson-2 definition: the write is a blind append (w(w(O)) ≠ w(O) — a partial first commit plus a full rerun doubles those rows; the date filter restricts what is *selected*, not what is *already in the target*), and the window depends on wall-clock, not input state (a 06:00 rerun of 'yesterday' after midnight shifts would select a different day than the 02:00 attempt — and the backfill had to hand-modify dates precisely because the window isn't parameterized from data). (b) invents a concurrency issue; (c) is a real but secondary concern that doesn't address correctness; (d) misreads the filter as an idempotency guard — it guards selection, not the target's prior contents.",
            "points": 1
          },
          {
            "id": "u7q4",
            "type": "numeric",
            "prompt": "Arrival lateness for a source measures: p95 = 2 h, p99 = 9 h, p99.9 = 41 h, max observed = 12 days. The team sets the incremental lookback to cover p99.9 with 7 hours of margin. How many hours is the lookback window?",
            "answer": 48,
            "tolerance": 0,
            "explanation": "41 h (p99.9) + 7 h margin = 48 h — a 2-day lookback. The >48 h tail (≤ 0.1%, but correlated — outages clump) is covered not by extending the window but by a completeness reconciliation that triggers targeted backfills: windows handle the distribution's body, controls handle its tail.",
            "points": 1
          },
          {
            "id": "u7q5",
            "type": "proof",
            "points": 2,
            "prompt": "Prove the WAP guarantee: given (i) consumers read only the published object and builds write only to consumer-invisible staging, (ii) publication is an atomic swap, (iii) publish executes only after the audit suite passes on the exact staged state — show that every state a consumer can observe has passed audits, and that a failed or crashed build yields staleness, never corruption. Then identify the premise most often broken in practice and the failure that results.",
            "rubric": [
              "Inducts over published states: base (first publish audited), step (published object changes only via publish events, each preceded by a passing audit of exactly the state swapped in)",
              "Uses atomicity (ii) to exclude blended/partial states from any read, and invisibility (i) to exclude staged, failed, or in-progress writes from any read",
              "Handles the failure path: no audit pass ⇒ no publish event ⇒ published object unchanged ⇒ consumers continue on the last audited state (staleness, loudly monitorable) with staged evidence preserved",
              "Names premise (i) — staging invisibility — as the one most often broken (grants leaking to dashboards/scientists) and states the resulting failure: those consumers silently read unaudited or failed builds, voiding the guarantee without any signal"
            ],
            "solution": "Induction over the sequence of published states. Base: the first published state is audited at bootstrap. Inductive step: assume all states published so far passed audits. Consider any consumer read. By (i) it resolves against the published object: staged writes — in-progress, failed, or abandoned — are invisible, so no unpublished data can appear in the read. The published object changes only through publish events; by (iii), any publish was preceded by the full audit suite passing on precisely the staged state being published (the audited object *is* the object swapped in — no re-derivation between audit and publish); by (ii) the swap is atomic, so the reader observes either the prior published state (audited by induction) or the new state (audited by iii), never a mixture or partial swap. Hence every observable state is audit-passed. Failure path: a build whose audits fail (or that crashes anywhere before publish) executes no publish event; the published object is untouched, so consumers continue reading the last audited state — the failure manifests as staleness, which freshness monitors surface loudly, while the staged corrupt state persists for forensics. ∎ The fragile premise is (i): read grants on staging schemas/branches leak to consumers ('temporary' scientist access, a dashboard built against stg_ during development) — those readers thereafter observe unaudited and failed states with no signal that the guarantee no longer covers them. The countermeasure is structural access control on the staging boundary, owned and audited by the platform team — WAP is a permissions discipline wearing a sequencing pattern's name.",
            "explanation": "The unit's capstone guarantee: with atomic publish primitives (u5's SWAP, u6's version commit) plus audit gating, 'silently wrong' is converted to 'loudly stale' — and the proof pinpoints why the discipline lives or dies on who can read the staging layer."
          },
          {
            "id": "u7q6",
            "type": "open",
            "points": 2,
            "prompt": "Design the complete transformation layer for a subscription-billing analytics domain: sources are a CDC mirror of the billing DB (invoices, payments, subscriptions — upserts with corrections) and a daily payment-processor settlement file (arrives 06:00–09:00, occasionally 24 h late). Consumers: finance dashboards (must never show unreconciled revenue) and a churn model retrained weekly. Specify: the layer/DAG structure with 6–10 named models; materialization + idempotent write pattern per model (with lookback/window choices justified from the arrival behavior); the test suite with blocking/warning severities; and the WAP + orchestration arrangement including the cross-system sensors. Quantify or justify each non-obvious choice.",
            "rubric": [
              "DAG structure: staging models per source (stg_invoices, stg_payments, stg_subscriptions, stg_settlements) with per-source cleaning; intermediates for reconciliation (int_payments_reconciled matching processor settlements to internal payments) and subscription versioning (SCD-2); marts: fct_invoice_line / fct_payment, dim_subscription/dim_customer, and a serving mart for finance — dependencies pointing downstream only",
              "Materializations + idempotency: incremental keyed MERGE for CDC-fed facts (corrections require upserts; lookback sized to CDC replay behavior), full-replacement or partition-overwrite for the daily settlement partition (pure function of the day's file), views/ephemeral for thin staging; watermarks derived from data, not run-logs; late settlement handled by sensor + window covering the 24 h tail",
              "Tests with severities: blocking — unique invoice/payment keys, relationships fct→dims, reconciliation test (settled amounts vs internal payments within tolerance) gating the finance mart, anomaly bands on revenue columns; warning — freshness within SLO for the churn-model inputs, accepted_values on new payment states; explicit argument for why reconciliation blocks finance but not the churn subtree",
              "WAP + orchestration: staged builds audited then atomically published (named primitive); sensors on CDC batch arrival and settlement-file landing; retry policy licensed by idempotency; partial-graph progress (late settlement holds finance marts, churn subtree proceeds on CDC data); backfill story for corrected settlements = rerun affected partitions, safe by the composition theorem"
            ],
            "solution": "Layers/DAG. Staging: stg_invoices, stg_payments, stg_subscriptions (from CDC — rename/cast, map processor codes), stg_settlements (from the daily file — parsed, typed, quarantining malformed rows). Intermediates: int_subscription_versions (SCD-2 over subscription state changes: plan, status — churn analysis needs history as it was), int_payments_reconciled (match stg_payments to stg_settlements by processor ref within a matching window; emit match status + variance). Marts: dim_customer, dim_subscription (from versions), fct_invoice_line (incremental), fct_payment (incremental, carrying reconciliation status), mart_finance_daily (serving OBT for dashboards — reads only reconciled payments), mart_churn_features (weekly feature build for the model). Materializations/idempotency: CDC-fed facts = incremental MERGE keyed on invoice_line_id/payment_id — CDC delivers corrections, so upsert semantics are required; lookback = 3 days covering measured CDC replay/redelivery behavior (and the SCD-2 event-time join prevents late rows mis-versioning). stg_settlements + its downstream reconciliation = partition-overwrite by settlement_date (each day's file is a pure input: INSERT OVERWRITE that date's partition — idempotent full replacement; a re-sent corrected file reruns one partition). Watermarks from MAX(event_ts) of committed output. Thin staging = views; int_payments_reconciled = table (read by tests, finance mart, and audits — reads ≫ builds). Tests: BLOCKING — unique keys on all staging naturals (CDC replays), relationships fct→dim (late-arriving subscription placeholder verified), the reconciliation gate: |settled − internal| ≤ 0.5% of daily volume AND unmatched payments < threshold, gating mart_finance_daily specifically; anomaly bands on gross/net revenue (trailing 28-day). WARNING — settlement freshness (expected by 09:00; warn 09:30, escalate 12:00 — the known 24 h tail means finance sees 'settlements pending' status, not silence), accepted_values on payment_state (new processor states get mapped, not dropped). Severity argument: finance's stated contract is never-unreconciled — staleness beats wrongness there, so reconciliation blocks its mart; the churn model tolerates a late settlement day (features are weekly aggregates), so its subtree proceeds on CDC-fed data with a warning — one gate, two consumer contracts, differentiated by subtree. WAP/orchestration: all marts build into an audit schema; audits run there; publish = atomic SWAP (Snowflake) / version commit (Delta) per mart, finance mart last and only behind its gate. Sensors: CDC batch completion (from unit 8's ingestion) gates staging; settlement-file landing gates the reconciliation subtree — on a late file, the orchestrator holds only that subtree (reachability = blast radius), retries transient failures with backoff (safe: every node idempotent), and pages on the 12:00 escalation. Corrected settlement files (processor re-sends) = rerun that date's partition + descendants: the composition theorem makes it indistinguishable from a normal run. The run report posts per-model durations, rows merged, and audit outcomes — the observability unit 9 will roll into platform SLOs.",
            "explanation": "Synthesizes the whole unit against a domain with the two hard features — corrections (forcing MERGE-based idempotency) and a late, reconciliation-critical external file (forcing sensors, partition-overwrite purity, and consumer-differentiated gating). The rubric rewards derived choices: windows from measured arrival behavior, severities from consumer contracts, and safety claims traced to the two theorems."
          }
        ]
      }
    },
    {
      "id": "u8",
      "title": "Ingestion and Streaming",
      "summary": "Snapshot, incremental, and log-based CDC extraction; Kafka and the log abstraction with delivery semantics; stream processing, watermarks, and exactly-once into the lakehouse.",
      "intro": "Every unit since the second has trusted a hand-wave: 'the nightly export lands in the raw zone.' This unit replaces the hand-wave with engineering. The problem is deceptively hard: operational databases exist to serve applications, not pipelines (unit 1's generation stage), and getting their data out — completely, correctly, without hammering them, and increasingly within seconds — is where a large fraction of real-world data incidents originate. The first lesson climbs the extraction ladder: full snapshots, incremental cursors, and change data capture, with a small impossibility proof for why the middle rung silently loses deletes — the bug that ships in most homegrown ingestion. The second lesson studies the infrastructure that CDC and events flow through: the log — Kafka's topics, partitions, offsets, and consumer groups — and confronts delivery semantics honestly: exactly-once *delivery* is impossible, exactly-once *effect* is engineering, and unit 7's idempotency theorem turns out to be the bridge. The third lesson processes the streams: event time versus processing time, watermarks and their unavoidable latency/completeness trade-off, windows (Trellis's sessionization, now continuous), and the transactional path by which streams land in Delta tables with exactly-once results — closing the Lambda-vs-Kappa argument the table formats settled. The gate asks you to pick extraction patterns per source, reason about semantics under failure, and design a freshness-justified streaming path.",
      "references": [
        "Jay Kreps — 'The Log: What every software engineer should know about real-time data's unifying abstraction' (LinkedIn Engineering, 2013)",
        "Kreps, Narkhede & Rao — Kafka: a Distributed Messaging System for Log Processing (NetDB 2011)",
        "Akidau et al. — The Dataflow Model (VLDB 2015)",
        "Martin Kleppmann — Designing Data-Intensive Applications, ch. 11 (stream processing; CDC)",
        "Joe Reis & Matt Housley — Fundamentals of Data Engineering, ch. 7 (ingestion)"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u8l1",
          "title": "Extraction: Snapshots, Cursors, and Change Data Capture",
          "estMinutes": 27,
          "builds_on": [
            "u1l2",
            "u7l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The ladder of extraction patterns",
              "body": "Getting data out of an operational database is a negotiation between four constraints: **completeness** (every insert, update, and delete must eventually reach the platform), **source load** (the register must not notice you — unit 1's interference argument applies to extraction exactly as it did to analytics), **freshness** (how stale the platform may run), and **complexity** (what you must build and operate). The industry's three patterns are rungs on a ladder, each trading complexity for the other three. **Full snapshot**: SELECT the whole table on a schedule — v0's pattern; trivially complete *as of each snapshot*, brutally heavy, and blind between snapshots. **Incremental (cursor-based) extraction**: SELECT rows WHERE updated_at > :last_cursor — light and simple, and silently *incomplete* in ways this lesson proves. **Change data capture (CDC)**: read the database's own write-ahead log — the append-only record of every committed change that replication is built on — and receive every insert, update, and delete, in commit order, with near-zero source impact. The ladder is not a maturity scale to climb blindly: each rung is *correct for some sources*, and the lesson's deliverable is the decision procedure — but the middle rung's failure modes are the ones that ship silently, so they get the proof."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Snapshot, incremental extraction, and CDC",
              "statement": "**Full snapshot**: periodically read the entire table; the platform's copy is correct as of each snapshot instant; changes between snapshots are invisible (a row inserted and deleted within one interval never existed, and intermediate update states are lost).\n\n**Incremental (cursor) extraction**: maintain a cursor c (typically max(updated_at) seen); each run reads rows with updated_at > c and upserts them. Requires a trustworthy, monotonic, indexed change-timestamp maintained on *every* write path.\n\n**Change data capture**: consume the database's transaction log (Postgres WAL via logical decoding/replication slots; MySQL binlog) through a connector (Debezium and kin), emitting one **change event** per row-change: (operation ∈ {insert, update, delete}, before-image, after-image, transaction id, log position). Log-based CDC is **complete** (every committed change, deletes included, appears exactly as committed), **ordered** (per the log's commit order), and **low-impact** (reading the log competes with replication, not with queries). Its costs: operating a connector, an initial snapshot to bootstrap, schema-change handling, and the obligation to *consume promptly* (an unconsumed replication slot forces the source to retain WAL — an ingestion outage becomes a source-disk incident).\n\n(**Query-based 'CDC'** — polling with cursors and comparing — is incremental extraction wearing CDC's name; the distinction that matters is *log-based or not*.)"
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Cursor extraction cannot see deletes (or untimestamped writes)",
              "statement": "Any extractor whose only access to the source is queries of the form 'rows with updated_at > c' cannot distinguish a hard-deleted row from an unchanged row — deletion is invisible in principle, not merely in practice. Moreover its correctness for updates depends entirely on the updated_at discipline: any write path that fails to advance the timestamp (bulk fixes, ORM bypasses, manual UPDATEs) produces changes the extractor never sees, and clock skew or long transactions can commit rows with timestamps *behind* an already-advanced cursor, which are then permanently skipped.",
              "proof": "Deletes: consider two source histories — (a) row r is untouched since before cursor c; (b) row r is DELETEd after c. In both, every query 'WHERE updated_at > c' returns result sets containing no version of r: in (a) because r's timestamp precedes c, in (b) because r no longer exists to be returned. The extractor's entire observable input is identical under (a) and (b), so no extractor logic, however clever, can decide between them — the platform's copy retains r forever under (b). (Detecting deletes would require *negative* information — 'r is absent' — which requires reading rows NOT matching the predicate, i.e., a full scan: the snapshot pattern smuggled back in.) Untimestamped writes: the extractor's predicate partitions rows by updated_at alone; a change that does not move updated_at leaves its row outside every future result set — invisible by the same argument. Skipped-behind writes: a transaction that computes updated_at = T, then commits after the extractor has already run with cursor ≥ T, leaves a row whose timestamp is ≤ every future cursor — permanently unread (mitigable by overlapping windows: re-read updated_at > c − Δ and rely on u7's idempotent MERGE to absorb the overlap; Δ must cover max transaction duration + clock skew). ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: Trellis's orders table, three ways",
              "body": "The orders/order_lines tables: ~12 GB, ~0.8% of rows changed per day (new orders + status updates + rare corrections), and — the detail that decides everything — order *cancellations before shipment* are implemented as hard DELETEs of reservation rows in one table and status updates in another.\n\n**Snapshot nightly**: moves 12 GB against the replica every night to convey ~100 MB of change — 120× waste (and the u1 interference tax during the dump window). Correct as of 02:00; blind to everything intraday; the platform never sees rows that lived and died within a day (flash reservations — which inventory analytics *wants*).\n\n**Incremental on updated_at**: moves ~100 MB. But: the reservation DELETEs are invisible (the proposition — the platform's reservation copy grows forever, silently overstating demand); an early bulk backfill that set discount values via raw SQL without touching updated_at never arrived (the untimestamped-write clause — discovered months later as a reconciliation discrepancy); and one order written by a long-running transaction landed behind the cursor and was skipped until the lookback-Δ fix. Three real bug classes, all structural.\n\n**Log-based CDC**: the connector snapshots once to bootstrap, then streams every commit — inserts, updates, *and the reservation deletes*, each with before/after images, in order — as events into a topic (next lesson), landing in the raw zone minutes behind the source. Source load: the replica reads its own WAL — no query pressure. This is why CDC is the default answer for *owned, high-value operational databases*: the two lower rungs stay correct only under disciplines (no hard deletes, perfect timestamps) that the source team never promised you."
            },
            {
              "type": "example",
              "heading": "Worked example: the decision procedure across Trellis's sources",
              "body": "The ladder applied source by source — the pattern is chosen per source, not per company. **Orders/inventory (owned Postgres, deletes matter, freshness wanted)**: log-based CDC, as above. **The logistics partner's weekly CSV drop**: full snapshot *by nature* — you receive whatever they send; ingest as-received into raw (unit 2's quarantine), diff against the previous drop in staging to synthesize insert/update/delete events if downstream needs change history (a snapshot-diff is how you *manufacture* CDC when you only have snapshots — complete as of each drop, at the cost of the diff computation). **The SaaS email platform's API**: incremental on their updated_since parameter — you have no log access, and their API contract is the cursor; mitigate the proposition's holes deliberately: their docs say deletes are soft (deleted_at field — visible to the cursor: fine), and a weekly full re-pull reconciles drift (bounded snapshot as a *control*, not a pipeline). **Clickstream events**: none of the above — events are *born as events* (the app emits them); there is no state to extract, only a stream to receive (next lesson). The general procedure: (1) does the source hand you a log or event stream? Use it. (2) If not, do deletes/untimestamped writes matter? If yes, snapshot (+ diff); if no, cursor incremental with an overlap window and a scheduled reconciliation. (3) Size the freshness requirement honestly (unit 1's dial) — CDC's minutes, incremental's hours, snapshot's days."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**CDC is a running system, not a checkbox — three operational teeth.** (1) The replication slot: if your connector stops consuming, the source database *cannot discard WAL* — days-long ingestion outages have filled production disks and taken down registers; monitor slot lag as a source-side pager, not a pipeline dashboard curiosity. (2) Initial snapshot + stream handoff: bootstrapping must stitch the snapshot and the log at a consistent position or you double/miss the boundary (connectors do this; verify, don't assume). (3) Schema changes: an ALTER TABLE flows through the log too — your pipeline meets unit 2's evolution rules in real time, and an unhandled type change stalls the stream. None of these are reasons to avoid CDC; all are reasons it is the *third* rung, adopted with operational budget."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Extraction is now a decision procedure instead of a habit: snapshots (complete-as-of, heavy, interval-blind), cursor incrementals (cheap, and provably blind to deletes and undisciplined writes — mitigated by overlap windows, soft-delete contracts, and scheduled reconciliations), and log-based CDC (complete, ordered, low-impact, operationally toothed) — assigned per source by log availability, delete semantics, and the freshness the consumers actually need. Trellis's orders now flow as change events minutes behind the register. But 'flow as events into a topic' presumed infrastructure this lesson waved at: something durable, ordered, and replayable that decouples the register's write rate from the platform's read rate, holds events until every consumer has them, and preserves order where order matters. That something is the log as first-class infrastructure — Kafka — and its semantics under failure are subtle enough to deserve their own lesson."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A table is 40 GB with 0.5% daily change. Compute the daily bytes moved by (a) nightly snapshot and (b) idealized change-only extraction, and the waste factor. Then name the two change classes that pattern (b) implemented as an updated_at cursor would miss on this table if it has hard deletes and occasional maintenance SQL.",
                  "solution": "(a) 40 GB/night. (b) 0.005 × 40 GB = 200 MB/night — waste factor 200×. Cursor misses: (1) hard deletes — invisible in principle (the proposition: absence is not a queryable event); (2) untimestamped writes — maintenance SQL/bulk fixes that don't advance updated_at (plus the skipped-behind-cursor case from long transactions/clock skew, mitigable with an overlap window Δ + idempotent MERGE).",
                  "hint": "Bytes: rate × size. Then re-read the proposition's two clauses."
                },
                {
                  "prompt": "Prove the snapshot-diff claim: given consecutive full snapshots S₁ (at t₁) and S₂ (at t₂) keyed by primary key, the diff reconstructs a complete set of net changes — and state precisely what within-interval information is unrecoverable, with a concrete Trellis case where that loss matters.",
                  "solution": "Partition keys: k ∈ S₂∖S₁ ⇒ net insert; k ∈ S₁∖S₂ ⇒ net delete (this is how snapshots *do* see deletes — by owning the negative information a cursor lacks); k in both with differing attributes ⇒ net update; identical ⇒ no net change. This covers every key, so the net state transition t₁→t₂ is fully reconstructed. ∎ Unrecoverable: the *path* within the interval — a row inserted and deleted between snapshots appears in neither and is wholly invisible; multiple updates collapse to endpoints (intermediate states lost); ordering and timestamps of changes are gone. Trellis case: flash reservations created and released within a day never reach inventory-demand analytics under weekly snapshots — the demand signal is systematically undercounted, invisibly.",
                  "hint": "Set operations on keys give net changes; ask what 'net' erases."
                },
                {
                  "prompt": "Your CDC connector for the orders database has been down for 14 hours. List, in priority order, the three things you check/do, and explain why the first one is a *source-side* emergency rather than a data-freshness annoyance.",
                  "solution": "(1) Replication-slot lag / WAL retention on the source: an unconsumed slot forces Postgres to retain 14 h of WAL — check disk headroom and growth rate; if the disk is at risk, the register itself goes down (a full pg_wal is a production outage, not a pipeline delay). Escalate/expand disk or, in extremis, drop the slot (accepting a re-bootstrap) before the source falls over. (2) Restart/repair the connector and confirm it resumes from its stored log position — CDC's replayability means 14 h of changes stream in automatically; verify ordering/dedup downstream (idempotent MERGE absorbs any redelivery). (3) Downstream freshness contracts: notify consumers per unit 7's monitors (dashboards show staleness banners, not wrong data), and check whether any incremental lookbacks/watermarks downstream need a nudge for the catch-up burst. The priority inversion is the lesson: CDC couples your outage to the *source's* disk — the one pager that outranks data staleness.",
                  "hint": "Who retains what while the consumer is away?"
                },
                {
                  "prompt": "Design the extraction plan (pattern + freshness + controls) for each: (a) an owned MySQL orders DB with soft deletes only and a reliable updated_at maintained by triggers; (b) a vendor's Postgres you can only query, hard deletes common, 2 M rows; (c) a partner SFTP dropping full CSVs daily; (d) your own app's user-interaction events. Justify each against the ladder's decision procedure.",
                  "solution": "(a) Cursor incremental is *defensible*: soft deletes are cursor-visible (deleted_at advances updated_at via trigger) and the timestamp discipline is enforced at the DB layer; add an overlap window Δ (transactions + skew) with idempotent MERGE, and a monthly full-count reconciliation as the control; upgrade to binlog CDC when freshness demands minutes or trigger discipline weakens. (b) Query-only + hard deletes ⇒ cursors are structurally wrong (the proposition); at 2 M rows a daily snapshot is trivial (tens of MB) — snapshot + key-diff to synthesize inserts/updates/deletes; freshness = daily, honestly stated. (c) Snapshot by nature: land as-received in raw (quarantine + typed conversion per unit 2), diff for change history if needed; controls: file-level checksums/row counts vs their manifest. (d) No extraction — events are born as events: emit to the event stream (topic) directly from the app with a schema contract (unit 2's Avro + registry discipline); the ladder applies only to *stateful stores*, and forcing eventful data through state-extraction is the anti-pattern.",
                  "hint": "Log available? Deletes visible? How big is 'everything'? Is there even state to extract?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u8l1-i1",
              "front": "The extraction ladder and what each rung trades",
              "back": "Full snapshot (complete-as-of, heavy, interval-blind) → cursor incremental (cheap; blind to deletes/untimestamped writes) → log-based CDC (complete, ordered, low-impact; operationally toothed). Chosen per source, not per company."
            },
            {
              "id": "u8l1-i2",
              "front": "Why can't cursor extraction see hard deletes — in principle?",
              "back": "A deleted row and an unchanged old row produce identical query results under 'updated_at > c' (no version returned): the extractor's observable input can't distinguish the histories. Absence is negative information only full reads (snapshots/diffs) own."
            },
            {
              "id": "u8l1-i3",
              "front": "The overlap-window mitigation for cursor extraction",
              "back": "Re-read updated_at > cursor − Δ (Δ ≥ max transaction duration + clock skew) and absorb the overlap with idempotent keyed MERGE — closes the skipped-behind-cursor hole; does nothing for deletes or untimestamped writes."
            },
            {
              "id": "u8l1-i4",
              "front": "What log-based CDC emits and why it's low-impact",
              "back": "One event per committed row-change: (op, before, after, txn, log position), in commit order, deletes included — read from the WAL/binlog like a replica, competing with replication rather than with queries."
            },
            {
              "id": "u8l1-i5",
              "front": "CDC's three operational teeth",
              "back": "Replication-slot lag forces source WAL retention (ingestion outage → source disk emergency); snapshot-to-stream bootstrap must stitch at a consistent position; schema changes flow through the log and must be handled, not ignored."
            },
            {
              "id": "u8l1-i6",
              "front": "Snapshot-diff: what it recovers and what it can't",
              "back": "Keyed diff of consecutive snapshots yields complete *net* changes (including deletes — S₁∖S₂). Unrecoverable: within-interval lifecycles (insert+delete), intermediate update states, ordering/timestamps."
            }
          ]
        },
        {
          "id": "u8l2",
          "title": "The Log: Kafka, Offsets, and Delivery Semantics",
          "estMinutes": 28,
          "builds_on": [
            "u8l1",
            "u7l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "One data structure, promoted to infrastructure",
              "body": "*Extraction* ended needing a place for change events to flow — and the shape of that place matters more than its brand. Jay Kreps's 2013 essay made the canonical argument: the **append-only log** — the structure already inside every database (WAL), every replication protocol, and unit 6's Delta commit history — deserves to be *first-class infrastructure* between systems. A log is a sequence of records, appended at one end, immutable once written, addressed by position. That austerity buys exactly what integration needs: **producers and consumers decouple in time** (the register writes at its pace; the warehouse reads at its own, hours behind if it likes); **many consumers share one feed** (the same order events serve the raw zone, the fraud service, and the inventory dashboard — each at its own position, none aware of the others); **replay is built in** (a consumer with a bug rewinds to an earlier position and reprocesses — unit 7's idempotency making the rerun safe); and **order is preserved** where the log preserves it. Kafka is this structure operationalized: sharded, replicated, retained. The N×M integration mess — every source wired to every destination with bespoke glue — collapses to N producers + M consumers around one log. That is the architectural content; the rest of the lesson is the precise mechanics and the one question that separates engineers from users: *what exactly is guaranteed when things fail?*"
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Topics, partitions, offsets, consumer groups",
              "statement": "A Kafka **topic** is a named log, physically split into P **partitions**. Each partition is an independent append-only log; a record's position in its partition is its **offset** (a dense integer). **Ordering is guaranteed within a partition only** — there is no cross-partition order. Producers assign records to partitions by **key**: hash(key) → partition, so all records with one key (one order_id, one user_id) share a partition and are consumed in production order — *choosing the key is choosing what stays ordered*. Records are retained by time/size policy (or **compacted**: retain the latest record per key — a log that converges to a table), independent of consumption: reading does not remove.\n\nA **consumer group** is a set of cooperating consumers sharing a group id: Kafka assigns each partition to exactly one member, so the group collectively reads everything, partitions split among members (parallelism ≤ P), and a member's failure triggers **rebalance** — its partitions reassign to survivors, who resume from the group's last **committed offsets**. Different groups are independent (each has its own offsets): the fraud service and the lake ingester both read everything, at their own pace. The committed offset is the group's durable bookmark — *when* it is committed, relative to the processing of the records it covers, is precisely where delivery semantics live."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Exactly-once delivery is impossible; exactly-once effect is engineering",
              "statement": "(a) Between a sender and receiver over a channel that can lose messages (including acknowledgments), no protocol guarantees each record is *delivered and processed exactly once*: after a timeout, the sender cannot distinguish 'record lost' from 'record processed, ack lost', and must choose — resend (risking duplicate processing: **at-least-once**) or not (risking loss: **at-most-once**).\n\n(b) Nevertheless, a consumer can achieve **exactly-once effect** (processing whose *outcome* equals one-processing-per-record) on top of at-least-once delivery, by either: (i) **idempotent processing** — the effect of applying a record twice equals once (unit 7's w(w(O)) = w(O): keyed MERGE, keyed puts); or (ii) **transactional offset+output commit** — the consumer writes its outputs and its input offsets in one atomic transaction against the same store, so a crash either persists both (record counted, never re-processed after resume) or neither (record re-processed from the uncommitted offset, its prior partial output invisible).",
              "proof": "(a) Adversary argument. Suppose a protocol claims exactly-once. Run it where the final acknowledgment is lost. The sender's observations are identical to a run where the record itself was lost before processing (silence either way). If the protocol's rule is 'resend on silence', then in the ack-lost run the receiver gets the record twice — the protocol must deduplicate to avoid double *processing*, but dedup state is itself an effect that must survive receiver crashes atomically with processing, which is case (b)(ii), not pure delivery; if the rule is 'do not resend', the record-lost run loses data. No third observation exists on which to branch. Hence pure delivery semantics offer only at-least-once or at-most-once. (b)(i) Under at-least-once, each record is processed n ≥ 1 times; idempotency gives effect(n applications) = effect(1) — the outcome is as if exactly once, by unit 7's algebra. (b)(ii) Let the transaction T = {write outputs for records [o₁..o₂], set committed offset = o₂} be atomic. Crash before T commits: resume at o₁; prior partial outputs were part of uncommitted T, hence invisible (atomicity); records reprocessed once, effects applied once. Crash after: offset o₂ durable; records never reread; outputs durable. In both branches each record's effect is applied exactly once. ∎ (Kafka's own transactions — producer idempotence + atomic consume-transform-produce — are implementation (b)(ii) inside the log ecosystem; Delta's txn/batch-id sink commits are (b)(ii) against the table, next lesson.)"
            },
            {
              "type": "example",
              "heading": "Worked example: designing Trellis's order-events topic",
              "body": "The CDC connector from lesson 1 publishes the orders stream; design the topic. **Key**: order_id — every change to one order (created → paid → packed → shipped) lands in one partition, so consumers see each order's lifecycle *in order*; keying by, say, warehouse would preserve an ordering nobody needs while interleaving each order's states across partitions (a fraud consumer seeing 'shipped' before 'paid' is a bug you built at design time). **Partition count**: throughput is trivial (peak ~200 events/s against partitions that handle tens of MB/s), so P is set by *consumer parallelism headroom*: P = 12 lets the heaviest consumer group scale to 12 members before hitting the parallelism ≤ P wall — and since raising P later re-maps keys (hash(key) mod P changes: per-key order breaks across the boundary), you over-provision partitions at creation. **Retention**: 7 days time-based on the raw stream — enough to rewind past any plausible consumer outage (lesson 1's 14-hour incident replays for free) — plus a **compacted** companion topic holding the latest state per order_id where consumers want a table, not a history (the log-to-table duality made physical). **Consumers**: the lake ingester (group `lake-writer`) micro-batches into raw Delta; the fraud scorer (group `fraud`) reads the same partitions independently; ops' inventory projector (group `inventory`) keeps its own offsets. Three consumers, zero coordination among them, one source of truth for what happened and in what order — the N×M collapse, delivered."
            },
            {
              "type": "example",
              "heading": "Worked example: one crash, three semantics",
              "body": "The lake-writer consumer reads records 4,000–4,999 of partition 3, writes them to storage, and must commit offset 5,000. Interleave a crash and watch each strategy. **Commit-then-write (at-most-once)**: offset 5,000 committed first; crash before the write lands → resume at 5,000; records 4,000–4,999 are *never written* — a silent 1,000-record hole in the lake, unfindable until a reconciliation (unit 7's completeness check) trips. **Write-then-commit (at-least-once)**: write lands; crash before the offset commit → resume at 4,000; records rewritten → duplicates in the raw zone. This is the correct default — *if* downstream absorbs duplicates: raw-zone dedup by (topic, partition, offset) key, or unit 7's keyed MERGE in staging: idempotency converting at-least-once into exactly-once effect, clause (b)(i). **Transactional (exactly-once effect, (b)(ii))**: the write to the Delta table and the offset advance commit atomically (the sink records the batch's identity in the table's own transaction log — next lesson's mechanism); crash anywhere → either both happened or neither; replay produces no duplicate and no hole. The moral, stated as the operating rule of the whole streaming world: **choose at-least-once delivery, then make effects idempotent or transactional** — at-most-once is the only truly unrecoverable choice, because the other two can always be repaired by replay, and replay is the log's native gift."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Rebalances and skew are the log's operational weather.** A consumer group rebalance (member joins, dies, or stalls past its heartbeat) pauses consumption while partitions reassign — a deploy that restarts all members carelessly can stack rebalances into minutes of lag; use cooperative/incremental assignment and roll members gradually. And partitioning inherits unit 4's skew law verbatim: hash(key) balances only if key frequencies do — one whale key (the guest-checkout pseudo-user, again) makes one partition a tower, and *consumer* parallelism can't help because ordering pins the key to one member. The fixes rhyme with unit 4: fix the key's modeling, or salt with an order-preserving sub-key where per-key order isn't truly needed."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "The log is now infrastructure with precise semantics: topics sharded into ordered partitions addressed by offsets; keys choosing what stays ordered; retention and compaction decoupling producers from consumers and making replay a first-class operation; consumer groups delivering scale-out with committed offsets as the bookmark; and the delivery-semantics theorem — exactly-once delivery impossible, at-least-once + idempotent-or-transactional effects as the engineering answer, with unit 7's algebra doing the heavy lifting. Trellis's changes and events now flow through topics that three independent consumers read without coordinating. What no lesson has yet done is *compute* on the moving stream: the inventory dashboard wants counts per 5-minute window, sessionization wants gap-based windows over event time, and both must answer the question that batch never faced — *when is a window finished, given that events arrive late?* Watermarks, windows, and the transactional landing into Delta close the unit."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "A payments topic must guarantee that all events for one payment are consumed in order, needs ~50 MB/s peak throughput (a partition sustains ~10 MB/s comfortably here), and its heaviest consumer group wants room to scale to ~24 members. Choose the key and partition count, and explain what breaks (and for which records) if partitions are later raised from 24 to 36.",
                  "solution": "Key: payment_id (per-payment order is the requirement; ordering is per-partition, and key→partition pins each payment to one partition). Partitions: throughput floor = 50/10 = 5; parallelism target = 24 ⇒ P ≥ 24; choose P = 24–48 with headroom (say 36–48 up front). Raising P later changes hash(key) mod P: a payment whose earlier events went to partition 7 may send later events to partition 31 — cross-partition, hence unordered relative to its history; consumers can see refund-before-charge for exactly the keys whose assignment moved, during and after the transition. Hence: over-provision at creation, or migrate via a new topic with re-keyed backfill rather than resizing in place.",
                  "hint": "Order lives in the key→partition mapping; what happens to that mapping when P changes?"
                },
                {
                  "prompt": "Using the impossibility proposition, explain why 'we use a message broker with exactly-once delivery' is an underspecified claim, and rewrite it as the two-part claim an engineer should make instead — naming where each part is implemented in a Kafka → Delta pipeline.",
                  "solution": "Delivery alone cannot be exactly-once: on ack loss the system must resend (at-least-once) or not (at-most-once) — any 'exactly-once' claim is really about *effects*, which requires cooperation from the processing/storage side (dedup or atomic offset+output), not the broker alone. The engineer's claim: (1) 'transport is at-least-once' — producer retries with idempotent-producer sequencing, consumer commits offsets after processing; (2) 'effects are exactly-once' — the sink applies records idempotently (keyed MERGE / offset-keyed dedup) or commits outputs+offsets atomically (Delta sink recording batch identity in the table's transaction log; Kafka transactions for consume-transform-produce chains). Part 1 lives in broker/client config; part 2 lives in the sink's write pattern — and part 2 is the one code review must verify.",
                  "hint": "Split 'delivered' from 'took effect'; the theorem says only one of them can be promised by the transport."
                },
                {
                  "prompt": "The fraud team reports they briefly saw an order's 'shipped' event before its 'paid' event after last week's incident. Ingestion swears every event was delivered. From this unit's mechanics, list the two design-time causes and the one operational cause that produce exactly this symptom, and the check that identifies which occurred.",
                  "solution": "Design-time: (1) wrong key — events keyed by something other than order_id (or unkeyed round-robin), so one order's lifecycle spans partitions with no cross-partition order; check the producer's key configuration. (2) Partition-count change — P was raised, re-mapping hash(order_id) mod P mid-lifecycle for affected orders; check broker config history / topic metadata against the incident date. Operational: (3) a consumer-side reorder — the fraud service consumed correctly per partition but processed asynchronously (parallel workers per partition without per-key serialization), reordering effects internally; check their worker model and whether the inversion correlates with their scaling event rather than with specific keys' partition moves. Distinguishing evidence: per-record (partition, offset) pairs — if 'paid' has a lower offset in the same partition than 'shipped', the log was ordered and cause (3) is internal; different partitions for one order_id indicts (1) or (2).",
                  "hint": "Ordering has exactly one home: the partition. Who moved the order's events out of one, or reordered after reading?"
                },
                {
                  "prompt": "A compacted topic retains the latest record per key. Explain (a) why this converges to 'a table, distributed as a log'; (b) which lesson-1 extraction artifact it exactly reproduces and one thing it loses relative to the full topic; (c) why a new consumer bootstrapping from a compacted topic + then reading the live tail is equivalent to CDC's snapshot-then-stream handoff.",
                  "solution": "(a) Compaction keeps, for each key, only the most recent value: reading the whole topic yields exactly one latest value per key — a materialized key→value state, i.e., a table; but it remains a log (ordered, appendable, consumable), so state is *distributed by replay*. (b) It reproduces the current-state snapshot (lesson 1's full extract) continuously maintained; it loses history — intermediate states per key are compacted away (the same information the snapshot-diff proof showed snapshots lose), so consumers needing lifecycles read the uncompacted topic. (c) Bootstrap = read compacted topic to end (a consistent-ish snapshot of latest state per key), then continue on the live tail from that position — the same stitch CDC connectors perform (initial snapshot, then log from the snapshot's position), with the log's offsets providing the consistent handoff point that lesson 1's callout warned must exist.",
                  "hint": "Latest-per-key = state; the tail = changes; snapshot+changes is a pattern you've met twice already."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u8l2-i1",
              "front": "What does the log buy as integration infrastructure (Kreps's argument)?",
              "back": "Time-decoupling of producers/consumers, many independent consumers at their own offsets, built-in replay (rewind + idempotent reprocess), and per-partition ordering — collapsing N×M bespoke integrations into N producers + M consumers."
            },
            {
              "id": "u8l2-i2",
              "front": "Where exactly does Kafka guarantee ordering, and what controls it?",
              "back": "Within one partition only. The record key pins all of a key's records to one partition (hash(key) mod P) — choosing the key is choosing what stays ordered; changing P re-maps keys and breaks per-key order across the boundary."
            },
            {
              "id": "u8l2-i3",
              "front": "Consumer groups and committed offsets",
              "back": "Each partition → exactly one member of a group (parallelism ≤ P); groups are independent (own offsets); failures trigger rebalance and survivors resume from the group's last committed offset — the bookmark whose commit timing defines delivery semantics."
            },
            {
              "id": "u8l2-i4",
              "front": "Why is exactly-once *delivery* impossible?",
              "back": "On silence, a sender can't distinguish 'record lost' from 'ack lost': resend ⇒ at-least-once (duplicates), don't ⇒ at-most-once (loss). 'Exactly-once' claims are always about *effects*, which need the sink's cooperation."
            },
            {
              "id": "u8l2-i5",
              "front": "The two constructions of exactly-once effect over at-least-once delivery",
              "back": "(i) Idempotent processing — w(w(O)) = w(O): keyed MERGE / offset-keyed dedup (unit 7's algebra). (ii) Transactional offset+output commit — outputs and input offsets persist atomically, so crash-replay neither duplicates nor drops."
            },
            {
              "id": "u8l2-i6",
              "front": "The operating rule for delivery semantics in pipelines",
              "back": "Choose at-least-once transport, then make effects idempotent or transactional. At-most-once is the unrecoverable choice — holes can't be replayed away; duplicates can."
            }
          ]
        },
        {
          "id": "u8l3",
          "title": "Stream Processing: Time, Watermarks, and Landing in the Lakehouse",
          "estMinutes": 29,
          "builds_on": [
            "u8l2",
            "u6l3",
            "u7l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The question batch never had to ask",
              "body": "A batch job enjoys a luxury so ingrained it goes unnoticed: when it runs, its input is *finished*. The nightly build processes 'yesterday' after yesterday has entirely arrived (lookbacks patching the stragglers). A stream processor loses that luxury — it must emit answers *while the input is still arriving*, which forces a question with no batch analogue: **when is a window of time complete enough to answer for?** Everything distinctive about stream processing radiates from that question, and it is sharpened by a distinction unit 7's lookback already brushed against: **event time** (when the thing happened, stamped at the source) versus **processing time** (when the record reaches the processor). The two diverge whenever anything buffers — a phone offline in a subway emits events hours old; lesson 1's CDC catch-up burst delivers a day of commits in minutes. Any computation that groups by *when things happened* — sessionization, per-hour revenue, fraud velocity — must be computed in event time, and event time arrives **out of order**. The Dataflow model (Akidau et al., VLDB 2015) organized the field's answer into four questions — *what* is computed, *where* in event time (windows), *when* results are emitted (watermarks/triggers), *how* corrections refine them — and this lesson takes them in order, then lands the results transactionally in Delta, where unit 6's machinery makes the stream's output a table you can trust."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Event/processing time; windows; watermarks",
              "statement": "**Event time** tₑ: the timestamp assigned where the event occurred. **Processing time** tₚ: the wall-clock time at which a processor observes it. Skew tₚ − tₑ is unbounded in principle (offline devices, outages, replays).\n\n**Windows** partition event time so unbounded streams admit finite aggregates: **tumbling** (fixed, disjoint: [12:00, 12:05)); **sliding/hopping** (fixed length, overlapping starts: last 10 min, every 1 min); **session** (data-driven: a window per key that extends while events arrive within a gap g and closes after g of silence — unit 6's sessionization, now defined *on the stream*).\n\nA **watermark** W(t) is the processor's evolving claim: 'no further events with tₑ < W will arrive.' When the watermark passes a window's end, the window is *complete* by the system's estimate and may be finalized. A **perfect** watermark is available only when sources guarantee ordering/completeness (rare); real systems use **heuristic** watermarks (e.g., max observed tₑ − allowed lateness δ), which can be wrong: events with tₑ < W arriving after W are **late data**, handled by a declared policy — drop, or emit corrections/updates to already-finalized results (which unit 6's MERGE-capable tables make cheap downstream)."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "The watermark trilemma: latency, completeness, state — pick two",
              "statement": "For any stream whose event-time skew is unbounded (no a-priori bound on how late events may arrive), no processor can simultaneously guarantee (1) **bounded result latency** — every window finalizes within bounded time of its end; (2) **completeness** — finalized results reflect all events of the window; (3) **bounded state** — memory does not grow without bound waiting on stragglers. Any two are achievable: finalize on a heuristic watermark (1 + 3, sacrificing completeness — late events are dropped or force corrections); wait indefinitely (2 + 3 in the limit is unachievable while (1) fails — practically, 2 requires either unbounded waiting, violating (1), or retaining window state indefinitely to absorb stragglers, violating (3)).",
              "proof": "Suppose (1) and (2) both hold: window w ending at time E finalizes at some bounded tₚ = F, and its result reflects all events with tₑ ∈ w. Unbounded skew means an adversary (or a subway tunnel) can deliver an event e with tₑ ∈ w at processing time F + 1. Either e is incorporated — but w was finalized at F, so incorporating e means revising a finalized result, i.e., the 'final' answer was not complete at F, contradicting (2) as a property of the finalized emission — or e is dropped, contradicting (2) outright. Hence (1) ∧ (2) is impossible under unbounded skew *for finalized-once results*. The escape hatches map exactly to real designs: bound the skew by fiat (allowed lateness δ: events later than δ are dropped by policy — completeness redefined as 'complete up to δ', the honest small print); or give up single finalization — emit early results and **corrections** as stragglers arrive, which preserves eventual completeness and bounded latency for *provisional* answers at the cost of downstream consumers handling updates (and state retained for the correction horizon: the (3) budget, now explicit). Unit 7's lookback window is this same theorem in batch clothing: the lookback is δ, and the completeness reconciliation is the correction channel. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: the inventory dashboard, end to end",
              "body": "Ops wants shelf-level stock freshness in minutes — a genuine streaming requirement (unit 1's dial, honestly measured: they intervene on stockouts within the hour). Build it. **Source**: the CDC topic for inventory movements (lesson 1) + the order-events topic (lesson 2), both keyed appropriately. **What**: net stock change per (SKU, warehouse). **Where**: tumbling 5-minute event-time windows. **When**: heuristic watermark = max observed tₑ − 2 minutes (measured: 99.9% of events arrive within 90 s; the CDC connector's hiccups dominate the tail). **How**: emit on watermark passage; late stragglers (the 0.1%, plus outage catch-ups) flow as *corrections* — and here the architecture earns its keep: the streaming job MERGEs window results into a Delta table keyed by (sku, warehouse, window_start), so a correction is just an idempotent upsert (unit 7's algebra), and the dashboard reads a table that is always internally consistent (unit 6's snapshot isolation) rather than a fragile in-memory materialization.\n\n**The exactly-once landing** (the proposition of lesson 2, clause b-ii, made concrete): Structured-Streaming-style engines checkpoint consumed offsets *and* stamp each micro-batch's identity into the Delta commit (a txn/batch-id action in the log). On crash and restart, the engine replays from checkpointed offsets; a batch already committed to the table is recognized by its identity and **skipped** — offsets and outputs advance atomically in effect, so the stock table shows neither holes nor double-counted movements, through arbitrary crashes. Count what this stack replaced: a bespoke consumer, a dedup store, a cache layer, and a reconciliation job — all subsumed by log + watermark + idempotent transactional sink."
            },
            {
              "type": "example",
              "heading": "Worked example: sessionization, now continuous — and the Lambda question",
              "body": "Unit 6 sessionized yesterday's clickstream in batch; product now wants same-hour funnel visibility. **Session windows on the stream**: per user_id (the topic key — order preserved where it matters), a session extends while events arrive within gap g = 30 min of the session's latest event time and closes when the watermark passes last_event + g. State: every open session (potentially millions) lives in the processor's checkpointed state store — the proposition's clause (3) made tangible; allowed lateness δ = 1 h bounds how long closed sessions linger for stragglers, and a late event within δ *reopens/merges* its session, emitting a correction (two sessions may merge into one — downstream must upsert by session key, which the Delta MERGE sink does).\n\nNow the architectural question this setup historically forced. **Lambda**: run the streaming job for freshness *and* the nightly batch job for correctness, serving from two systems and reconciling their disagreements — double logic, double bugs, and the seams unit 6 warned about. **Kappa** (Kreps's rejoinder): one streaming path; recompute by replaying the log. The table-format era's resolution, which Trellis adopts: **one logic, incremental, landing in one table** — the streaming sessionizer MERGEs provisional and corrected sessions into the Delta sessions table continuously; there is no separate batch truth to reconcile because corrections flow through the same keyed-upsert path (the trilemma's correction branch), and a true logic change is handled by replaying the topic through the *same* code into a fresh table (Kappa's replay, made cheap by unit 6's cloning for cutover). Lambda survives only where a genuinely different batch computation is wanted; as a freshness workaround, the log + table format retired it."
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Streaming is a standing cost — re-run unit 1's dial before every adoption.** A streaming pipeline is a 24/7 process with state, checkpoints, watermarks, rebalances, and an on-call surface; a micro-batch every 10 minutes through the same Delta MERGE path delivers 10-minute freshness with unit 7's operational simplicity. The honest sequence: measure the consuming decision's real staleness tolerance (unit 1); if minutes matter, stream *that path only* — Trellis streams inventory and sessions while orders BI remains nightly; if 'real-time' is a vibe rather than a decision latency, the 10-minute micro-batch wins on total cost of correctness. The most expensive words in this unit are 'while we're at it, let's stream everything.'"
            },
            {
              "type": "text",
              "heading": "What is now established — and the unit closed",
              "body": "Stream processing now has its full conceptual kit: event time versus processing time (and why the distinction is forced by physics, not fashion); windows — tumbling, sliding, session — as event-time partitions of unbounded input; watermarks as evolving completeness claims, with the trilemma proving that bounded latency, completeness, and bounded state cannot all be guaranteed — resolved in practice by allowed-lateness policies and correction flows; and the transactional landing into table formats that makes exactly-once *effect* a checkbox-shaped reality (offsets + batch identity committed atomically, unit 7's idempotent MERGE absorbing corrections). Ingestion is thereby complete end to end: extraction chose its rung per source (lesson 1), the log decoupled and ordered the flow with honest delivery semantics (lesson 2), and stream processing computed on the flow and landed it in governed tables (this lesson) — with Lambda's double-bookkeeping retired by one incremental logic over one table. The platform now fills itself: raw arrives in minutes, transformations run on tested DAGs, marts publish behind audits. What remains is the last mile — the layer where all of it meets people and money: serving, governance, and the cost engineering that decides whether the platform thrives or gets rebuilt in anger. Unit 9 closes the course there."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Events arrive with measured lateness: 95% within 20 s, 99.9% within 4 min, 99.99% within 3 h (device offline tails). For a 5-minute tumbling revenue window feeding (a) an ops wallboard (glance-and-react) and (b) the finance mart (must reconcile to the penny), choose watermark/lateness policies per consumer and state which trilemma corner each sacrifices.",
                  "solution": "(a) Wallboard: watermark = max tₑ − 4 min (covers 99.9%), finalize on passage, drop later stragglers — corners kept: bounded latency + bounded state; sacrificed: completeness (0.1%, acceptable for a glanceable trend; label it 'provisional'). (b) Finance: emit provisional results on the same watermark but declare allowed lateness = 24 h with corrections — late events MERGE updates into the window's row; corners kept: (eventual) completeness + bounded latency for provisional answers; paid: state/correction horizon (24 h of window state retained) and downstream consumers must handle updates — which the mart does anyway via keyed upsert, and unit 7's reconciliation confirms closure before month-end lock. Same stream, two policies: the trilemma is resolved per consumer contract, not per pipeline.",
                  "hint": "Each consumer picks its own two corners; the correction channel is what lets finance have completeness without unbounded waiting."
                },
                {
                  "prompt": "Prove the batch connection claimed in the trilemma proof: unit 7's incremental lookback window is a watermark policy. Map each element (lookback Δ, the MERGE, the completeness reconciliation, data later than Δ) to its streaming counterpart, and state what the batch formulation gives up relative to streaming.",
                  "solution": "Mapping: the nightly run's implicit claim 'all events for day D have arrived by tonight − Δ' is a heuristic watermark W = now − Δ; the lookback re-processing of [W, now] is the allowed-lateness reprocessing zone; the keyed MERGE is the correction channel (late rows upsert, converging by idempotency — same operator as the streaming sink); data later than Δ is post-watermark late data under a 'drop by default' policy; and the completeness reconciliation that triggers targeted backfills is the out-of-band correction path for the dropped tail. Given up relative to streaming: latency granularity — corrections apply on the batch cadence (nightly) rather than continuously, and provisional results simply don't exist between runs (the window's answer is absent, not early). The theorem is identical; only the emission cadence differs — which is why the micro-batch-vs-streaming choice is an operational, not conceptual, decision.",
                  "hint": "Watermark = arrival-completeness claim; MERGE = corrections; the tail control = the drop policy's escape hatch."
                },
                {
                  "prompt": "A streaming job MERGEs 5-minute aggregates into a Delta table with checkpointed offsets and batch-id stamping. Walk the crash-recovery for: crash (a) after reading offsets 10,000–12,000 but before the Delta commit; (b) after the Delta commit but before the engine's checkpoint update; (c) explain why scenario (b) does not double-count, naming the exact mechanism and the unit-6 primitive it rides on.",
                  "solution": "(a) Restart reads the checkpoint (last completed batch through offset 10,000), replays 10,000–12,000, recomputes, commits — the crashed attempt's writes never committed (staged files unreferenced — unit 6's invisibility), so no partial state exists: clean exactly-once effect. (b) Restart's checkpoint still points at 10,000; the engine re-forms the batch for 10,000–12,000 and attempts to commit — but the sink first checks the table's transaction log for its (streaming-query-id, batch-id) txn action, finds the batch already committed, and *skips the write*, then advances its checkpoint. (c) The mechanism is idempotent commit via recorded batch identity: the table itself durably remembers which batch ids have applied (a txn action in the Delta log), and that record was written *atomically with the data* in one commit — unit 6's single atomic version publish (put-if-absent) is the primitive; because the dedup state lives inside the same transaction as the outputs, the lesson-2 proposition's clause (b)(ii) is satisfied and replay cannot double-apply.",
                  "hint": "Where does the system remember 'batch N already happened', and in whose transaction was that memory written?"
                },
                {
                  "prompt": "A product manager asks for 'real-time everything: orders, revenue, inventory, sessions'. Using unit 1's freshness dial and this lesson's cost callout, produce the four-line triage: for each domain, the consuming decision, its honest staleness tolerance, and the resulting architecture (streaming / micro-batch / nightly). One domain must end up streaming, one nightly.",
                  "solution": "Inventory: ops intervenes on stockouts within the hour → minutes matter → **streaming** (the CDC-fed 5-min windows into Delta, as built). Sessions/funnels: product reviews same-day experiment behavior → sub-hour useful → **micro-batch or streaming** — 10-min micro-batch through the same MERGE path unless live funnels demonstrably change decisions (then stream). Revenue dashboards: leadership reviews daily/weekly; finance requires reconciled numbers (unit 7's gates) → **nightly** behind WAP — streaming provisional revenue would surface unreconciled figures to exactly the audience that must never see them. Orders operational lookup ('where is order X?'): that is an *application* query against the register or a serving copy — not an analytics freshness problem at all; route it out of the warehouse (unit 4's serving-copy lesson). The pattern: freshness is purchased per consuming decision, and 'real-time' requests usually decompose into one genuine streaming need plus several dashboards that wanted better nightly pipelines.",
                  "hint": "Name the decision, then its tolerance, then pay for exactly that."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u8l3-i1",
              "front": "Event time vs processing time — and why the gap is unbounded",
              "back": "tₑ = when it happened (source-stamped); tₚ = when the processor sees it. Buffering (offline devices, outages, CDC catch-up) makes skew unbounded — so event-time computations must handle out-of-order arrival structurally."
            },
            {
              "id": "u8l3-i2",
              "front": "The three window families",
              "back": "Tumbling (fixed, disjoint), sliding/hopping (fixed length, overlapping starts), session (data-driven per key: extends within gap g, closes after g of silence — clickstream sessionization's native form)."
            },
            {
              "id": "u8l3-i3",
              "front": "Watermark — definition and the honest caveat",
              "back": "An evolving claim 'no events with tₑ < W will still arrive'; windows finalize when W passes their end. Real watermarks are heuristic (max tₑ − δ) and can be wrong — late data needs a declared policy: drop, or corrections."
            },
            {
              "id": "u8l3-i4",
              "front": "The watermark trilemma",
              "back": "Under unbounded skew, bounded latency + completeness + bounded state cannot all hold for finalize-once results. Escapes: allowed-lateness δ (completeness 'up to δ'), or provisional results + corrections (eventual completeness, consumers handle upserts)."
            },
            {
              "id": "u8l3-i5",
              "front": "How does a stream land exactly-once in a Delta table?",
              "back": "The sink commits each micro-batch's outputs *and* its batch identity (txn action) in one atomic table commit; checkpointed offsets replay after crashes, and already-committed batch ids are recognized and skipped — offsets+outputs atomic in effect (lesson 2's clause b-ii on unit 6's publish primitive)."
            },
            {
              "id": "u8l3-i6",
              "front": "Lambda vs Kappa — and the table-format-era resolution",
              "back": "Lambda: parallel batch+stream systems, double logic, reconciliation seams. Kappa: one streaming path, recompute by log replay. Modern resolution: one incremental logic MERGEing provisional + corrected results into one governed table; full replay reserved for logic changes."
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
            "prompt": "A 25 GB source table has 0.6% of rows changed daily. What is the waste factor of nightly full snapshots versus idealized change-only extraction (bytes moved ratio)?",
            "answer": 167,
            "tolerance": 3,
            "explanation": "Snapshot: 25 GB; changes: 0.006 × 25 GB = 150 MB; ratio ≈ 25,000/150 ≈ 167×. This is CDC's economic case — before its correctness case (deletes, ordering, intraday lifecycles), which is usually the decisive one.",
            "points": 1
          },
          {
            "id": "u8q2",
            "type": "short",
            "prompt": "Which extraction pattern is the only one on the ladder that observes hard deletes *as they happen* (not merely as net absences between periodic reads)? Two or three words.",
            "accept": [
              "log-based cdc",
              "cdc",
              "change data capture",
              "log-based change data capture",
              "log based cdc"
            ],
            "explanation": "Log-based CDC reads the database's own commit log, where a DELETE is a first-class event with a before-image. Cursor extraction provably cannot see deletes (absence isn't queryable); snapshots see them only as net differences between reads, losing timing and intra-interval lifecycles.",
            "points": 1
          },
          {
            "id": "u8q3",
            "type": "mcq",
            "prompt": "A consumer commits its offset immediately after fetching a batch, then processes the records. It crashes mid-processing and resumes. What semantics did this consumer implement, and what is the observable damage?",
            "options": [
              "At-most-once: the committed offset advanced past unprocessed records, so on resume they are never re-read — the batch's unprocessed remainder is silently lost (a hole no replay will fill unless offsets are manually rewound)",
              "At-least-once: the records will be redelivered on resume, producing duplicates downstream",
              "Exactly-once: committing the offset first is what prevents duplicate processing after resume",
              "The semantics depend on the broker's replication factor, which determines whether the fetched records survive the crash"
            ],
            "answer": 0,
            "explanation": "Commit-then-process = at-most-once: the bookmark moved before the work was done, so a crash strands the unprocessed tail beyond the committed offset — silent loss, the one unrecoverable choice (holes can't be replayed away; the data still sits in the log, but nothing will ever read it at the group's offsets). (b) describes process-then-commit; (c) inverts the logic — early commit *causes* loss, not exactly-once; (d) replication protects the log's durability, which was never in question — the failure is the consumer's bookmark discipline.",
            "points": 1
          },
          {
            "id": "u8q4",
            "type": "numeric",
            "prompt": "A topic must sustain 80 MB/s peak (a partition comfortably sustains 10 MB/s in this setup) and its largest consumer group needs to scale to 20 parallel members. What is the minimum partition count that satisfies both constraints?",
            "answer": 20,
            "tolerance": 0,
            "explanation": "Throughput floor: 80/10 = 8 partitions. Parallelism floor: consumer-group parallelism ≤ P, so P ≥ 20. Minimum satisfying both: max(8, 20) = 20 — and since raising P later re-maps keys and breaks per-key ordering across the change, real deployments provision headroom above this minimum at creation.",
            "points": 1
          },
          {
            "id": "u8q5",
            "type": "proof",
            "points": 2,
            "prompt": "Prove both halves of the delivery-semantics theorem: (a) no protocol over a lossy channel guarantees exactly-once delivery-and-processing (the sender's dilemma); (b) a consumer that writes its outputs and its input offsets in one atomic transaction achieves exactly-once effect over at-least-once delivery (analyze both crash positions). State explicitly why half (b) does not contradict half (a).",
            "rubric": [
              "(a) Constructs the indistinguishability: after sending, silence is consistent with both 'record lost' and 'processed, ack lost'; resend ⇒ possible duplicate processing, no-resend ⇒ possible loss; notes that receiver-side dedup is an *effect-layer* mechanism requiring durable state atomic with processing, not a delivery guarantee",
              "(b) Case crash-before-commit: transaction unfinished ⇒ neither outputs nor offset advance persist (atomicity) ⇒ resume re-reads from the old offset, reprocesses, effects applied once",
              "(b) Case crash-after-commit: both outputs and offset durable ⇒ records never re-read, effects already applied once; concludes each record's effect occurs exactly once in every interleaving",
              "Resolves the apparent contradiction: (a) is about the transport's promises (delivery count), (b) is about outcome equivalence at a cooperating stateful sink — delivery may still be n ≥ 1 times; the transaction makes n applications indistinguishable from one"
            ],
            "solution": "(a) Consider sender S transmitting record r to receiver R over a channel that can drop any message. Suppose a protocol claims exactly-once delivery-and-processing. Run 1: r is lost en route — S observes silence. Run 2: r arrives, R processes it, and R's acknowledgment is lost — S observes silence. S's observations are identical, so its next action is the same in both runs. If the protocol resends on silence: in Run 2, R receives r twice; to avoid processing twice, R must consult durable memory of having processed r — but maintaining that memory correctly across R's own crashes requires recording it atomically with the processing effect, which is precisely an effect-layer transaction (half b), not a property of delivery; without it, R double-processes. If the protocol does not resend: Run 1 loses r. Either way, pure delivery offers only at-least-once or at-most-once. ∎ (b) Let the consumer's step be transaction T: {write outputs for records (o_prev, o]; set committed offset := o} against one atomic store. Crash before T commits: atomicity discards both writes; on resume, the committed offset is still o_prev, the records are re-read (at-least-once transport delivers them again), reprocessing writes the same outputs, and T commits once — the effect of the records is applied exactly once. Crash after T commits: offset o is durable, so the records are never re-read; their outputs are durable in the same commit. In every interleaving, each record's effect is applied exactly once. ∎ No contradiction: (a) bounds what the *channel* can promise about delivery counts — and indeed in (b) records may be delivered multiple times; (b) is a statement about *outcomes* at a sink that couples its progress bookmark to its effects atomically, making n ≥ 1 deliveries produce the state of exactly one. The theorem's practical reading: buy at-least-once from the transport, and manufacture exactly-once at the sink — by this transaction or by unit 7's idempotency.",
            "explanation": "The unit's central theorem pair — the impossibility that kills marketing claims, and the construction that pipelines actually rely on (Kafka transactions, Delta batch-id sinks). The resolution clause is what separates engineers who can design recovery from those who quote brochures."
          },
          {
            "id": "u8q6",
            "type": "open",
            "points": 2,
            "prompt": "Design complete ingestion for a food-delivery startup: (1) an owned Postgres orders DB (hard deletes on cart abandonment, corrections common, couriers' apps sync offline data up to 6 h late); (2) courier GPS pings (~3,000 events/s, born as events); (3) a payments provider webhook feed (at-least-once, occasional duplicates and out-of-order); (4) a restaurant-partner nightly SFTP CSV. For each: extraction/transport pattern, topic design where applicable (key, why), delivery-semantics handling at the sink, and event-time considerations. Then name the one place you would introduce stream processing first, with the freshness justification.",
            "rubric": [
              "Orders DB: log-based CDC (hard deletes + corrections make cursors structurally wrong; cites the proposition), keyed by order_id for per-order lifecycle ordering; sink = idempotent MERGE into raw/staging Delta; notes slot-lag monitoring as source-side pager",
              "GPS pings: direct event production to a topic (no extraction — born as events), keyed by courier_id (per-courier ordering for trajectory logic), high partition headroom for throughput/parallelism; sink at-least-once + offset-keyed dedup or transactional batch-id landing; event-time stamped at device with large skew tolerance (offline sync up to 6 h → watermark/lateness policy stated)",
              "Webhooks: treat as at-least-once out-of-order stream — dedup by provider event id (idempotent keyed upsert), order by event time not arrival, reconcile against provider statements (the unit-7 reconciliation control); SFTP CSV: snapshot-by-nature, quarantine + typed conversion, key-diff if change history needed",
              "Streaming first at the consumer-facing freshness need (courier location / order status tracking or dispatch ops) with an explicit decision-latency justification, while analytics domains without minute-level decisions stay micro-batch/nightly — demonstrates the freshness dial rather than streaming everything"
            ],
            "solution": "(1) Orders: log-based CDC (Debezium-class) — cart-abandonment hard deletes are invisible to cursors (the impossibility proposition) and corrections demand before/after images; publish to topic `orders.changes` keyed by order_id (per-order lifecycle ordering: created→paid→delivered must never invert for the dispatch and analytics consumers). Sink: micro-batch MERGE into the raw/staging Delta tables keyed on primary key + op metadata — at-least-once transport absorbed by idempotent upsert (exactly-once effect). Ops: replication-slot lag alarms paged as a *source* emergency; connector schema-change handling tested. Courier-app offline sync arrives through this same CDC flow up to 6 h late — downstream event-time logic must not assume arrival order. (2) GPS pings: no extraction — the apps produce directly to `courier.pings` (schema-registered Avro per unit 2), keyed by courier_id so each courier's trajectory is ordered; P sized for 3,000 ev/s with parallelism headroom (e.g., 48+). Sink: streaming or frequent micro-batch into Delta with batch-id transactional commits (clause b-ii); event time = device timestamp with measured skew — offline couriers imply a long tail, so the analytics watermark uses δ ≈ 6 h with corrections, while any live-ops view runs a short-δ provisional policy (the trilemma resolved per consumer). (3) Payments webhooks: land every delivery immediately (append-only raw with provider_event_id), then staging dedups by provider_event_id via keyed MERGE (their at-least-once + our idempotency = exactly-once effect) and orders by the provider's event timestamp; a daily reconciliation against provider statements is the completeness control (unit 7) — webhooks are a stream you don't operate, so you trust arithmetic, not promises. (4) Restaurant SFTP: snapshot by nature — preserve as-received in dated raw paths (auditability), typed conversion with loud failure, key-diff against the prior drop to synthesize change events if menus/prices need history. First streaming investment: courier location + order-status tracking for dispatch ops and customer ETA — decisions there have seconds-to-minutes latency value (reassignment, customer comms), a genuine streaming case; revenue/funnel analytics stays micro-batch (10-min) and finance stays nightly behind WAP — freshness purchased exactly where a decision consumes it.",
            "explanation": "Runs the whole unit as one design: the extraction ladder chosen by source properties (with the deletes proposition doing real work), topic keys chosen as ordering contracts, every sink built to the at-least-once + idempotent/transactional rule, event-time policies set from measured skew per consumer, and streaming adopted only where a decision's latency justifies the standing cost."
          }
        ]
      }
    },
    {
      "id": "u9",
      "title": "Serving, Governance, and Cost",
      "summary": "The semantic layer and serving patterns, catalogs, lineage, and data contracts, and the FinOps discipline that keeps the platform alive — the last mile, closed.",
      "intro": "Eight units built a platform that fills itself: extraction chosen per source, streams landing transactionally, tested DAGs publishing audited marts into warehouse and lakehouse. This closing unit is about the layer where all of it meets people, organizations, and invoices — the layer that decides whether the platform is *used, trusted, and affordable*, which is to say whether it survives. The first lesson finishes the serving stage properly: the semantic layer that finally makes 'revenue' mean one thing (the course's oldest complaint, structurally resolved), the serving patterns that match each consumer's access shape, and the approximation machinery that makes expensive questions cheap. The second lesson builds governance as engineering rather than bureaucracy: catalogs and lineage as queryable graphs, data contracts that move the discount incident's fix to the producer's CI, and access control as the load-bearing premise it already was in unit 7's WAP proof. The third lesson closes the course with the discipline that funds it: cost attribution, the pathology catalogue every reader of units 2–8 can now diagnose on sight, and a small optimality theorem for where to spend optimization effort. The gate is a synthesis: govern a metric end to end, autopsy a bill, and defend the platform's economics the way you have defended every other design in this course — with arithmetic.",
      "references": [
        "Joe Reis & Matt Housley — Fundamentals of Data Engineering, chs. 9, 11 (serving; the future of the lifecycle) and the security/data-management undercurrents",
        "dbt Labs — the semantic layer / MetricFlow documentation (metrics as governed definitions)",
        "Flajolet et al. — HyperLogLog: the analysis of a near-optimal cardinality estimation algorithm (AofA 2007)",
        "Google — Site Reliability Engineering, ch. 4 (SLOs — applied here to data freshness and quality)",
        "Zhamak Dehghani — Data Mesh (O'Reilly, 2022), read critically alongside centralized-platform practice"
      ],
      "masteryThreshold": 0.85,
      "lessons": [
        {
          "id": "u9l1",
          "title": "Serving: Semantic Layers, Access Shapes, and Approximation",
          "estMinutes": 27,
          "builds_on": [
            "u3l4",
            "u7l1",
            "u8l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The last mile is where trust is won or lost",
              "body": "A platform's consumers never see the elegant machinery — the pruned scans, the idempotent MERGEs, the atomic publishes. They see a dashboard number, a query latency, an API response — and they judge the entire edifice by three questions: *is it right, is it fast, do two of them agree?* Unit 1 opened this course with the pathology of the third question — every report computed from a different extract, no two dashboards agreeing — and the intervening units fixed its data-layer causes: one modeled star (unit 3), one transformation of each rule (unit 7), audited publishes (unit 7). But one cause survives all of that: even against a perfect star, two analysts can *aggregate differently* — one computes revenue net of refunds, the other gross; one joins the SCD-2 dimension at event time, the other at current; both queries are individually defensible, and their dashboards disagree by 4% forever. The data was one thing; the *computation over it* was not. The *semantic layer* exists to close exactly this gap: it does for metrics what unit 3 did for data and unit 7 did for transformations — one definition, in one governed place, that every consumer's query is compiled from."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Semantic layer; metric; serving pattern",
              "statement": "A **semantic layer** is a governed, version-controlled definition layer sitting between the modeled warehouse and its consumers, declaring: **entities** (the dimensions and their join paths — the star, described once), **metrics** — each a named quantity with an exact formula over the model (measure expression, aggregation, grain, allowed dimensions, filters: `revenue_net = SUM(fct_order_line.net_amount) − SUM(refunds.amount)`, joinable by date/product/customer/channel), and **policies** (who may query what, at what grain). Consumers — BI tools, notebooks, APIs — request *metric × dimensions* (\"revenue_net by fiscal_week by channel\"), and the layer **compiles** the SQL: the join paths, the SCD-2 event-time predicates, the non-additivity guards (unit 3's ratio and semi-additive rules, encoded so the wrong query is ungenerable).\n\nA **serving pattern** is the delivery mechanism matched to a consumer's access shape: **interactive BI** (dashboards on marts/OBTs through the semantic layer); **ad-hoc SQL** (analysts on the star, semantic layer optional but definitions authoritative); **operational serving** (applications needing single-key millisecond lookups — served from a keyed store fed by the pipeline, never from the warehouse: unit 4's crossover in reverse); **ML feature serving** (offline: point-in-time-correct training sets from the lakehouse; online: the same features in a low-latency store, kept consistent by sharing one definition); **reverse ETL** (pushing modeled aggregates back into operational tools — the CRM gets each customer's lifetime value, computed once in the warehouse, not re-derived in the CRM)."
            },
            {
              "type": "example",
              "heading": "Worked example: 'revenue' becomes a governed metric",
              "body": "Trellis's finance and growth teams have disagreed 3–5% on 'revenue' for two years. The forensic diff (now trivial — both queries are in version control per unit 7): finance's query subtracts refunds and joins dim_customer at event time; growth's counts gross and joins at current version (restating history — unit 3's Type-2 lesson, violated downstream of a perfect dimension). Neither is wrong; they are *different metrics wearing one name*.\n\nThe fix, mechanically: the semantic layer declares two metrics — `revenue_net` (SUM(net_amount) − refunds, event-time joins, the board metric) and `revenue_gross` (SUM(gross_amount), for take-rate analyses) — each with owner, description, allowed dimensions, and tests (the metric's own reconciliation: revenue_net by month must tie to the finance mart within 0.1%). The BI tool's measure picker now shows those two names *and nothing else*; both dashboards rebuild against the layer; the compiled SQL is identical wherever the metric appears. The forward-looking payoff is larger than the fix: when the definition legitimately changes (finance decides gift-card breakage joins revenue_net next quarter), it changes *in one reviewed pull request* with lineage showing every affected dashboard (next lesson) — versus the old world's quarter-long whack-a-mole across forty queries. The pattern deserves its name: this is unit 7's DRY argument promoted from transformations to *aggregations*, and it is the last structural cause of dashboard disagreement — data, transformation, and now computation each defined exactly once."
            },
            {
              "type": "example",
              "heading": "Worked example: the order-status lookup leaves the warehouse",
              "body": "Support tooling needs 'where is order X?' at p99 < 50 ms, 30 requests/second. Unit 4's arithmetic said this is not an analytical query — single-key, all columns, latency-bound: the register's shape (unit 1) — and unit 5's warehouses are the wrong tool (per-query overhead, credit burn for a workload that never scans). The serving pattern: a **keyed serving copy** — the order-events topic (unit 8) already carries every status change in order per order_id; a small consumer projects it into a key-value store (or the compacted topic *is* the store, lesson u8l2's log-to-table duality): current status per order, updated within seconds, read in single-digit milliseconds, at commodity cost.\n\nGeneralize the example into the discipline: **the warehouse serves questions about many rows; keyed stores serve questions about one key; the pipeline feeds both from the same log** — one source of truth, several physical projections, each shaped to its access pattern. This resolves the course-long tension about 'per-customer queries' (u4l2, u5l2's exercises) without layout contortions: analytical layouts stay optimized for scans, and genuinely operational access gets its own projection. The rule of recognition for when to reach for it: a latency SLO below ~1 s, single-entity access, high request rate — any two of the three means you are building an application feature, not a report, and it should exit the analytical stack through a serving copy."
            },
            {
              "type": "text",
              "heading": "Approximation: trading exactness you don't need for speed you do",
              "body": "Unit 4 proved two-phase aggregation needs *decomposable* aggregates, and flagged the holdouts: COUNT(DISTINCT) and exact percentiles, whose states are as big as their inputs. The serving layer is where the practical resolution lives: **mergeable sketches** — small, fixed-size summaries that absorb streams and merge across partitions, answering within provable error. **HyperLogLog** for distinct counts: m registers estimate cardinality with standard error ≈ 1.04/√m — at m = 16,384 (16 KB), ±0.8%: 'weekly unique visitors' over billions of events computes as a two-phase aggregate of 16 KB states instead of a shuffle of every visitor id, and *pre-aggregated sketches compose*: store daily HLL states per (page, day) and any date-range × page rollup is a merge, not a rescan. **t-digest/KLL** for percentiles: p99 latency dashboards from mergeable digests instead of full sorts. The engineering judgment is about *which consumers may be approximate*: marketing dashboards and capacity planning, yes (±1% changes no decision — say it in the tooltip); finance and billing, never (exactness is the contract). The semantic layer is again the enforcement point: `unique_visitors` is *declared* as an HLL metric with its error bar, so nobody innocently swaps in an exact COUNT(DISTINCT) that costs 40× more, and nobody bills a customer from a sketch."
            },
            {
              "type": "decision",
              "heading": "Serving patterns, by consumer shape",
              "rows": [
                [
                  "Dashboards, 10s of concurrent humans, seconds tolerable",
                  "marts/OBTs through the semantic layer on the warehouse (u5's caches doing the repeat work)"
                ],
                [
                  "Analysts exploring, unpredictable SQL",
                  "the star directly; semantic layer definitions authoritative for any number that leaves the notebook"
                ],
                [
                  "An application needing one entity in milliseconds",
                  "keyed serving copy fed from the log — never the warehouse (crossover in reverse)"
                ],
                [
                  "ML training (historical) + inference (live) features",
                  "offline from the lakehouse with point-in-time joins; online mirror of the same definitions in a low-latency store"
                ],
                [
                  "Operational tools wanting warehouse-computed fields (LTV in the CRM)",
                  "reverse ETL on a schedule, pushing modeled aggregates — compute once, syndicate"
                ],
                [
                  "Distinct counts / percentiles over huge streams, tolerance ≥ ~1%",
                  "sketch-backed metrics (HLL, t-digest) declared as approximate in the semantic layer"
                ]
              ]
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Point-in-time correctness is serving's sharpest edge — for ML above all.** A churn model trained on features computed *as of today* about customers who churned *last year* has leaked the future into training (today's activity counts include post-churn silence), and its offline metrics will be a lie the online deployment exposes. Feature serving must join *facts as of the label's time* — exactly unit 3's SCD-2 event-time predicate and unit 7's event-time surrogate lookups, now applied to features. This is why feature stores obsess over 'time travel' joins, and why the modeled layer's discipline — immutable facts, versioned dimensions — turns out to be the ML platform's foundation too, not just BI's."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Serving is now an engineered layer rather than an afterthought: metrics defined once in a semantic layer that compiles correct SQL (non-additivity, SCD-2 time joins, and approximation policies encoded, the last cause of dashboard disagreement removed); consumers routed by access shape — warehouse for many-row questions, keyed projections off the log for single-key operational reads, point-in-time feature serving for ML, reverse ETL for syndication; and sketches trading declared error for order-of-magnitude cost where consumers can afford it. Trellis's oldest bug — two revenue numbers — is structurally dead. What now protects all of this from entropy — schema drift at the borders, definitions decaying, access sprawling, PII leaking — is not more machinery but *governance*: the catalog, lineage, and contracts that keep a hundred humans coordinated around one platform. That is the next lesson."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Two dashboards disagree on 'average order value' by 11%. Dashboard A: AVG(order_total) over orders. Dashboard B: SUM(net_amount)/COUNT(DISTINCT order_id) over fct_order_line, net of refunds. Diagnose all the definitional forks, then write the semantic-layer resolution (metric name(s), formula, grain guards) that makes the disagreement unrepresentable.",
                  "solution": "Forks: (1) gross vs net of refunds; (2) order_total (order grain, includes shipping?) vs summed line net_amount (excludes shipping per unit 3's grain discipline); (3) AVG over orders weights each order equally — correct for AOV — while a careless SUM/COUNT on lines could weight by lines if the DISTINCT were dropped; (4) possibly different date/population filters. Resolution: declare `aov_net = revenue_net / order_count` where revenue_net = SUM(net_amount) − refunds (line grain, shipping excluded by definition, stated) and order_count = COUNT(DISTINCT order_id); optionally `aov_gross` if a gross variant is genuinely needed, named as such. The layer compiles the ratio-of-sums (unit 3's non-additivity rule — never AVG of per-order ratios beyond the correct AVG semantics chosen deliberately), pins the population filters, and the BI pickers expose only the named metrics — the forks become impossible to re-introduce silently.",
                  "hint": "Every disagreement is a definitional fork; enumerate them, then give each surviving variant its own honest name."
                },
                {
                  "prompt": "Compute the HLL trade for 'monthly unique visitors': 2.6 B events/month, ~180 M uniques. Exact COUNT(DISTINCT) requires shuffling distinct ids (~180 M × 16 B ≈ 2.9 GB of state through the exchange, unit 4's non-decomposable case). HLL with m = 65,536 registers: what is the standard error, the per-group state size, and the state shuffled for a 31-day × 20-country pre-aggregated rollup? Would you certify this metric for (a) marketing dashboards, (b) contractual ad billing?",
                  "solution": "Standard error ≈ 1.04/√65,536 = 1.04/256 ≈ 0.41% (±~730 k on 180 M at one sigma). State: 64 KB per sketch (roughly; register width a few bits–1 B). Rollup: 31 × 20 = 620 sketches × 64 KB ≈ 40 MB merged — versus multi-GB re-shuffles of raw ids per query, and any date-range/country combination is a merge of stored daily sketches (composability). (a) Marketing: yes — ±0.4% changes no decision; declare the error in the metric's description. (b) Ad billing: no — billing is a contract requiring exactness (and auditability); compute exact counts on the billing grain in a scheduled job where the cost is bounded, or negotiate the contract to a defined measurement methodology. The semantic layer enforces the split by naming: unique_visitors (HLL) vs billable_uniques (exact, scheduled).",
                  "hint": "1.04/√m; then ask which consumer's decisions move at that error size."
                },
                {
                  "prompt": "A growth engineer builds a churn-model training set: for each customer who churned in month M, features = orders_last_90d, support_tickets_last_30d, avg_session_gap — all computed from the *current* marts at training time. The model's offline AUC is 0.94; deployed, it performs near-random. Explain the leak precisely, and give the corrected feature computation naming the unit-3/unit-7 machinery it reuses.",
                  "solution": "The leak: features were computed as of *now*, not as of each customer's churn-decision time — a churned customer's orders_last_90d measured today is ~0 *because they churned* (the label leaked into the feature); the model learned 'low recent activity ⇒ churned', which is the label restated, hence 0.94 offline and uselessness online (where features are genuinely pre-outcome). Correction: point-in-time features — for a customer with label date d, compute every feature over data with event_ts < d (orders in [d−90, d), tickets in [d−30, d)), joining dimensions at their version effective at d (unit 3's SCD-2 event-time predicate) — i.e., reconstruct the world as it was at prediction time. The machinery already exists: immutable event-grain facts (unit 3), event-time surrogate lookups (unit 7's fact load), and the lakehouse's history (unit 6) make 'as of d' an ordinary query; the feature pipeline is one more incremental model with d as its watermark. Offline metrics computed this way will drop — to the model's true value.",
                  "hint": "When was each feature knowable? Compare with when the label was determined."
                },
                {
                  "prompt": "Classify each request into a serving pattern (and name what you would NOT use): (a) the mobile app shows each user their own order history; (b) the CFO's Monday deck; (c) the CRM should display each account's warehouse-computed health score; (d) a fraud model needs each transaction scored in 80 ms using 30-day aggregates; (e) an analyst wants to explore why conversion dipped in the Southwest.",
                  "solution": "(a) Operational serving: keyed store (or the register's own DB — it IS the application's data); never the warehouse (single-key, millisecond, high-rate = crossover in reverse). (b) BI through the semantic layer on published marts — governed metrics, WAP-protected freshness. (c) Reverse ETL: compute health score once in the modeled layer, push to the CRM on schedule; not a live warehouse query from the CRM (latency, cost, coupling). (d) Online feature serving: 30-day aggregates precomputed by the pipeline into a low-latency feature store, point-in-time consistent with training; not a warehouse query per transaction (80 ms SLO) and not features computed ad hoc in the scoring service (training/serving skew). (e) Ad-hoc SQL on the star — exploration needs the full dimensional surface; the semantic layer's definitions remain authoritative for any number that escapes the notebook into a decision.",
                  "hint": "Access shape first: one key or many rows? Human seconds or machine milliseconds? Explore or report?"
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u9l1-i1",
              "front": "Semantic layer — what it defines and what failure it kills",
              "back": "Governed, versioned definitions of entities (join paths), metrics (formula + aggregation + grain + allowed dimensions), and policies; consumers request metric × dimensions and SQL is compiled. Kills the last cause of dashboard disagreement: divergent aggregation over identical data."
            },
            {
              "id": "u9l1-i2",
              "front": "The serving-pattern rule for operational lookups",
              "back": "Single-entity access + sub-second SLO + high rate = an application feature, not a report: serve from a keyed projection fed by the log (compacted topic / KV store), never from the warehouse — unit 4's crossover, in reverse."
            },
            {
              "id": "u9l1-i3",
              "front": "HyperLogLog — error formula and why it composes",
              "back": "Standard error ≈ 1.04/√m for m registers (16 KB ⇒ ±0.8%); sketches are mergeable, so stored per-grain states roll up by merge — distinct counts become decomposable two-phase aggregates (unit 4's holdout, resolved approximately)."
            },
            {
              "id": "u9l1-i4",
              "front": "Where may approximation be served, and where never?",
              "back": "Approximate (with declared error): marketing dashboards, capacity planning, trend monitoring. Never: finance, billing, anything contractual — the semantic layer encodes the split by naming metrics as approximate or exact."
            },
            {
              "id": "u9l1-i5",
              "front": "Point-in-time correctness for ML features",
              "back": "Features must be computed over data knowable *before* each label's time (event_ts < d, dimensions at their d-effective version) — else the label leaks into features (great offline AUC, random online). Reuses SCD-2 event-time joins and immutable event-grain facts."
            },
            {
              "id": "u9l1-i6",
              "front": "Reverse ETL — the pattern and its rule",
              "back": "Push warehouse-computed aggregates (LTV, health scores) into operational tools on a schedule: compute once in the governed layer, syndicate — never let each tool re-derive its own copy of a metric."
            }
          ]
        },
        {
          "id": "u9l2",
          "title": "Governance: Catalogs, Lineage, and Data Contracts",
          "estMinutes": 28,
          "builds_on": [
            "u9l1",
            "u7l3",
            "u1l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "Governance is the engineering of agreement",
              "body": "'Governance' has a deserved reputation as the word that precedes committees. This lesson reclaims it as engineering: governance is the set of *queryable structures and enforced checkpoints* that keep hundreds of humans coordinated around one platform as it — and they — change. The claim that it is engineering rests on a course-long pattern: every catastrophic incident we have studied was, at root, an *agreement failure*. The discount incident: producer and pipeline disagreed about a column's meaning, and nothing enforced the agreement. The dashboard wars: consumers disagreed about a metric, and nothing owned the definition. The swamp (unit 6): nobody agreed who owned what, and the physics collected. Unit 7's WAP proof itself rested on an access-control premise — 'consumers cannot read staging' — that is pure governance. The machinery of this lesson — catalogs (what exists, who owns it), lineage (what depends on what), contracts (what producers promise), and access control (who may see what) — is the load-bearing structure under everything already built, made explicit and enforceable."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Catalog, lineage, data contract",
              "statement": "A **data catalog** is the queryable inventory of the platform's assets: every table, topic, model, metric, and dashboard, with schema, description, **owner** (a person/team, not a department name), tags (PII, finance-critical, deprecated), freshness/quality status, and usage statistics. Its population must be substantially **automated** (harvested from the warehouse's information schema, the DAG's documentation-as-code, query logs) — hand-maintained catalogs are stale by construction.\n\n**Lineage** is the directed graph of data dependencies — asset → asset, ideally column → column — assembled from unit 7's declared DAG plus parsed query/job logs for what the DAG can't see. It answers, mechanically, the two questions that dominate incident response and change management: **impact analysis** (downstream reachability: 'what breaks if I change this?' — unit 7's `node+`, extended across the whole platform to dashboards and models) and **root-cause analysis** (upstream reachability: 'this dashboard is wrong — which upstream change did it?').\n\nA **data contract** is an explicit, versioned, machine-checkable agreement attached to a data interface (a source table's export, a topic, a published mart), specifying: **schema** (fields, types, nullability — unit 2's discipline), **semantics** (units, meanings, enumerations: 'discount is per-line USD, never a percentage'), **SLOs** (freshness, completeness, availability), and **change policy** (what changes are allowed, with what notice; breaking changes require a new version). Its teeth are **enforcement checkpoints**: the producer's CI validates proposed schema/semantic changes against registered contracts *before deploy*, and the consumer's ingestion validates arriving data against the same contract at runtime."
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Contract enforcement moves failure to the cheapest point",
              "statement": "Order the places a producer's breaking change can surface, by cost: (1) producer CI (pre-deploy), (2) consumer ingestion (runtime, data quarantined), (3) consumer transformation/audit (unit 7's gates — publish blocked), (4) consumer dashboards (silent wrongness). With no contract, structural breaks surface at (2)–(3) and semantic breaks at (4). With a registered, CI-enforced contract: any change *expressible in the contract's vocabulary* (schema, declared semantics, enumerations) surfaces at (1) — before any wrong data exists — and the residue of undeclared semantic drift is bounded by (2)–(3) via runtime validation and unit 7's statistical audits. Moreover the blame boundary becomes objective: data violating a contract is the producer's incident; data satisfying the contract but breaking a consumer is the consumer's (or the contract's — trigger a renegotiation), ending the cross-team forensic wars that unowned incidents produce.",
              "proof": "Cost ordering: at (1) no artifact exists but a failed build — fix cost is a code change; at (2) wrong data exists but is quarantined pre-merge — cost adds triage + backfill of the delayed batch; at (3) wrong data reached staging but WAP blocked publish — cost adds pipeline-wide delay (unit 7's staleness); at (4) consumers acted on wrong numbers — cost is unbounded (decisions, trust, restatements). Each later stage strictly contains the earlier stages' costs plus new irreversible exposure, establishing monotonicity. Contract effect: producer CI checks the proposed artifact (schema diff, enum diff, declared-unit metadata) against the registered contract — a breaking change *in the contract's vocabulary* cannot deploy, so no violating data is ever produced: the failure class surfaces at (1) by construction. Changes outside the vocabulary (an undeclared meaning shift that type-checks — the residual discount-style risk) pass (1) but meet the consumer-side validations: runtime contract checks at (2) catch declared-but-violated semantics; statistical audits at (3) catch distribution shifts (unit 7's monitors). Hence the surfacing point of every failure class is pulled to the earliest stage capable of expressing it, and expanding the contract's vocabulary (declaring units, ranges, distributions) monotonically moves more classes to (1)/(2). Blame objectivity follows from the contract's decidability: violation is machine-checkable, so ownership of each incident is a lookup, not a negotiation. ∎"
            },
            {
              "type": "example",
              "heading": "Worked example: the discount incident's final form",
              "body": "Run the course's ghost one last time, through the finished stack. The app team's PR changes the export: `discount` (decimal USD) → `discount_pct` (double, percent). **Producer CI**: the orders export has a registered contract (schema + semantics: 'discount: per-line USD amount; range [0, 500]'). The CI contract check diffs the proposed schema against it: field removed + field added = **breaking change → build fails** with a message naming the contract, its consumers (from lineage: 3 pipelines, 14 marts, 31 dashboards, 2 ML features), and the change-policy options: (a) revert; (b) additive evolution — emit *both* fields for a deprecation window (contract minor version); (c) new contract major version with a migration plan and consumer sign-off.\n\nThe team picks (b): the export adds discount_pct alongside discount, consumers migrate on their own schedules against a deprecation deadline, lineage tracks who still reads the old field, and the field is removed when its consumer count hits zero. Total incident cost: one failed CI run and a two-line Slack thread — versus unit 1's two days of silent corruption, or unit 2's 2 a.m. page (the schema-embedded format caught it at runtime — stage 2 — which was a triumph *then*; the contract catches it pre-deploy — stage 1 — which is the end state). The arc of this single example across nine units is the course's thesis in miniature: the same failure, moved earlier and earlier — from the CFO's dashboard, to the loader, to the audit gate, to the producer's CI — until it stopped being a failure at all."
            },
            {
              "type": "example",
              "heading": "Worked example: a PII request served by the graph",
              "body": "Legal asks: *'Which systems store customer email, who can read it, and prove deletion propagates.'* Without governance structures this is a quarter of archaeology; with them it is three queries. **Catalog**: assets tagged `pii:email` — the tag applied at ingestion (staging models classify columns; the catalog harvests the classification): raw.customers, stg_customers, dim_customer, the CRM reverse-ETL feed, and — surprise — an ML feature table where an engineer once joined email domain as a feature. The surprise is the point: hand-inventories miss exactly what the harvested graph catches. **Access**: masking policies (unit 5/6 platforms both support column masking) show email readable in clear by 2 roles (support-tools service, compliance), hashed for everyone else — including, after this audit, the feature table's readers (the domain feature is re-derived from a hashed form). **Lineage**: downstream reachability from raw.customers.email lists every derived column; the GDPR erasure flow (unit 6's deletion vectors + unit 8's CDC delete events) is verified to reach each of them, and the reverse-ETL feed's deletion webhook is the one gap found and fixed. The general lesson: **governance questions are graph queries** — tags for node classification, lineage for reachability, access policies as edge labels — and a platform that cannot answer them mechanically will answer them wrong under deadline."
            },
            {
              "type": "text",
              "heading": "Ownership: who operates all this",
              "body": "Structures need owners, and the industry's live debate is *where* they sit. The **centralized platform** model: one data team owns ingestion through marts; consumers file requests. It delivers consistency (one modeling standard, one quality bar) and collapses at scale — the central team becomes the queue everyone waits in, and domain knowledge (what *does* this fulfillment status mean?) lives far from the modelers. The **data mesh** position (Dehghani): domains own their data as *products* — the fulfillment team publishes its own governed, contracted, SLO-bearing datasets — with a central *platform* team providing the self-service infrastructure (the units-5-through-8 machinery as a paved road) and *federated* governance setting the cross-cutting standards (contract format, PII policy, catalog participation). Read critically, mesh is not a technology but an org design, and its failure mode is as real as centralization's: domains without data engineering skills shipping ungoverned 'products', federation decaying into anarchy with extra steps. The honest synthesis most mid-size companies (Trellis included) land on: **central platform and standards, domain-embedded ownership of sources and contracts** — the fulfillment team owns its export's contract (they know what the status means; the proposition makes their CI the checkpoint), the platform team owns the paved road from contract to mart, and the bus matrix (unit 3) plus the catalog record whose name is on every asset. The test of any ownership model is operational: when the 2 a.m. page fires, is it unambiguous *whose* runbook opens?"
            },
            {
              "type": "callout",
              "tone": "warn",
              "body": "**Governance tooling fails by aspiration; it survives by defaults.** A catalog nobody updates, tags applied 'when we get to it', contracts registered for new sources only — each decays to theater in two quarters. The pattern that survives: make the governed path the *default* path — documentation harvested from the DAG (written anyway, unit 7), tags applied by staging-layer classification rules (code, not campaigns), contracts scaffolded automatically when a new source is onboarded, access via roles nobody can bypass because the WAP boundary (unit 7) already runs on them. Every governance artifact that requires a human to remember it will be forgotten; every one generated as a side effect of work already happening will be current forever."
            },
            {
              "type": "text",
              "heading": "What is now established",
              "body": "Governance is now machinery with proofs of value: a harvested catalog making the platform searchable and owned; lineage turning impact and root-cause into reachability queries; contracts pulling every expressible failure to the cheapest checkpoint (the proposition — and the discount incident's nine-unit arc ending at a failed CI build); access control as the enforced premise unit 7's guarantees always needed; PII questions answered as graph queries; and an ownership synthesis that names whose runbook opens at 2 a.m. One force remains ungoverned, and it is the one that quietly kills more platforms than any outage: the invoice. The final lesson turns the course's cost arithmetic — scattered through units 2, 5, 6, and 8 — into a discipline: attribution, the pathology catalogue, and where to spend optimization effort, with the course's last theorem telling you exactly that."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "Write the data contract (fields you would include, not full prose) for Trellis's order-events topic as published to consumers, and mark which clause catches each historical incident: the discount unit change; the half-empty feed; the 14-hour CDC outage; a partner consuming the topic who breaks when a new optional field appears.",
                  "solution": "Contract: schema (Avro reference: field names, types, nullability, doc strings with units — 'discount: USD per line, range [0,500]'); semantics (enumerations for status; per-order ordering guarantee keyed by order_id; delete events present with before-images); SLOs (freshness: p99 event-to-topic < 5 min; completeness: daily event count within ±3σ of forecast; availability of the topic); change policy (additive fields allowed with minor version + notice; type/semantic changes = major version + dual-publish window; consumers must tolerate unknown fields). Catches: discount change → schema/semantics clause at producer CI (units + range declared); half-empty feed → completeness SLO (consumer-side runtime validation alarms); CDC outage → freshness SLO breach paging the producer/platform per the blame boundary; fragile partner → the change policy's 'must tolerate unknown fields' clause makes their breakage *their* incident (contract satisfied), triggering their fix rather than a war.",
                  "hint": "Four clause families: schema, semantics, SLOs, change policy — each incident maps to exactly one."
                },
                {
                  "prompt": "Using the enforcement-point proposition, compute (qualitatively but rigorously) the cost of the same breaking change surfacing at each of the four stages for a metric feeding a weekly pricing decision — and identify which contract-vocabulary expansion moves the discount-style *semantic* drift from stage 4 to stage 1 versus to stage 3.",
                  "solution": "Stage 1 (producer CI): cost = one failed build + a design conversation; no wrong data ever exists. Stage 2 (ingestion validation): + one delayed batch, quarantine triage, a backfill — bounded, loud. Stage 3 (audit gate): + pipeline staleness across all consumers of the publish (WAP holds everything behind the gate), on-call escalation — still no wrong decision. Stage 4 (dashboard): the pricing decision executes on wrong margins — unbounded: mispriced SKUs for up to a week, revenue impact, restatement, trust. Monotone containment is visible: each stage includes the prior costs plus new irreversibility. Vocabulary expansions: declaring *units and ranges* in the contract ('USD, [0,500]') moves unit-changes to stage 1 (CI can diff declared semantics); a *distributional* clause (expected mean/variance bands on discount) cannot run at CI (no data yet) but moves undeclared drift to stage 3's statistical audits — which is why the proposition says expanding vocabulary moves classes 'to (1)/(2)': syntax and declared semantics go to CI; statistical properties go to the earliest stage that sees data.",
                  "hint": "What can be checked without data (CI) vs only with data (runtime/audit)? Cost = everything downstream of the surfacing point."
                },
                {
                  "prompt": "Your lineage graph shows: raw.payments → stg_payments → int_reconciled → {fct_payment, mart_finance} ; fct_payment → {mart_exec, churn_features} ; churn_features → churn_model_v3 (deployed). The payments provider announces a field deprecation in 60 days. Produce the impact-analysis output a good tool would give, the migration order, and the verification that migration is complete — each as a graph operation.",
                  "solution": "Impact analysis = downstream reachability from raw.payments.<field>: {stg_payments, int_reconciled, fct_payment, mart_finance, mart_exec, churn_features, churn_model_v3} — with column-level lineage pruning the set to assets actually referencing the deprecated field (perhaps mart_exec doesn't). Migration order = reverse topological: update stg_payments first to derive the replacement (isolating the change at the airlock — unit 7's staging role), verify downstream equivalence (unit 7's reconciliation tests comparing old/new derivations during a dual-run window), then update any direct references downstream, retrain/redeploy churn_model_v3 against the migrated features last (models are consumers too — the lineage edge to a *deployed artifact* is the one hand-built graphs always miss). Verification of completion = an empty result for 'assets referencing the deprecated field' (column-lineage query) sustained over a full pipeline cycle + the field's usage stats in the catalog at zero — then the producer may drop it inside their 60-day window.",
                  "hint": "Impact = reachability; order = reverse topology from the airlock; done = the reference query returns empty."
                },
                {
                  "prompt": "Argue both sides in ~4 sentences each, then give the synthesis for a 300-person company: 'The fulfillment domain team should own fulfillment data end-to-end (mesh)' vs 'The central data team should own all modeling (centralized)'. End with the single operational test from this lesson that any chosen model must pass.",
                  "solution": "Mesh side: the fulfillment team knows what RELABELED actually means, changes their schema anyway (contracts make their CI the natural checkpoint — the proposition works best at the producer), and a central team of eight cannot model forty domains without becoming the queue that starves everyone; product-thinking (SLOs, contracts, docs) on domain data is how quality scales with the org. Centralized side: domain teams lack data engineering skill and incentive — 'products' decay into ungoverned exports; conformance (unit 3's bus, one customer dimension) dies when forty teams each model their own customers; and platform economics (units 5–9) require concentrated expertise the domains will never staff. Synthesis at 300 people: domains own *sources and their contracts* (they control the CI where breaking changes are cheapest); the central platform owns the paved road (ingestion patterns, the transformation framework, the semantic layer, the catalog) and the conformed core (shared dimensions, the bus matrix); federated standards (contract format, PII rules) are set once. The operational test: when the 2 a.m. page fires for any asset, the catalog names exactly one owner whose runbook opens — any model, however fashionable, that fails that test is an org chart, not an architecture.",
                  "hint": "Each side is right about the other's failure mode; the synthesis assigns each layer to whoever fails cheapest there."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u9l2-i1",
              "front": "The two lineage queries that run incident response",
              "back": "Impact analysis = downstream reachability ('what breaks if I change this?' — to dashboards and deployed models, not just tables); root-cause = upstream reachability ('which change made this wrong?'). Both mechanical once lineage is harvested from the DAG + query logs."
            },
            {
              "id": "u9l2-i2",
              "front": "The four clauses of a data contract",
              "back": "Schema (fields/types/nullability); semantics (units, meanings, enums — 'USD per line, [0,500]'); SLOs (freshness, completeness, availability); change policy (what's additive vs breaking, notice, versioning)."
            },
            {
              "id": "u9l2-i3",
              "front": "The enforcement-point proposition, in one line",
              "back": "Failure cost is monotone in surfacing stage (producer CI < ingestion < audit gate < dashboards); contracts pull every failure expressible in their vocabulary to the earliest capable stage — and make blame a machine-checkable lookup."
            },
            {
              "id": "u9l2-i4",
              "front": "Why must catalogs and tags be harvested, not hand-maintained?",
              "back": "Aspirational governance decays in quarters; artifacts generated as side effects of existing work (DAG docs, staging classification rules, query logs) stay current forever. The governed path must be the default path."
            },
            {
              "id": "u9l2-i5",
              "front": "The discount incident's nine-unit arc (the course thesis in one example)",
              "back": "Surfaced at the CFO (u1) → loud at the loader via schema-embedded formats (u2) → blocked at the audit gate via monitors + WAP (u7) → prevented at producer CI via contracts (u9): the same failure moved earlier until it stopped being a failure."
            },
            {
              "id": "u9l2-i6",
              "front": "The ownership synthesis and its operational test",
              "back": "Domains own sources + contracts (breaking changes are cheapest at their CI); the platform team owns the paved road and the conformed core; federated standards set once. Test: every asset's 2 a.m. page names exactly one owner whose runbook opens."
            }
          ]
        },
        {
          "id": "u9l3",
          "title": "Cost Engineering: The Bill as a System Property",
          "estMinutes": 28,
          "builds_on": [
            "u5l3",
            "u5l4",
            "u9l2"
          ],
          "content": [
            {
              "type": "text",
              "heading": "The invoice is the platform's other SLO",
              "body": "Platforms rarely die of outages; they die of invoices. The failure sequence is depressingly standard: costs grow silently for six quarters, a CFO asks what the company gets for $2 M a year of data spend, nobody can answer *per workload*, and the platform is rebuilt in anger — usually worse. This course has priced every mechanism as it built it precisely so that its graduates never sit silent in that meeting: unit 2 priced storage formats and requests, unit 4 priced scans, shuffles, and layout, unit 5 priced compute elasticity and meters, unit 6 priced DML spread and churn, unit 8 priced freshness. The final lesson assembles those prices into a discipline — **FinOps for data** — with three moves: **attribute** (make every dollar name its workload and owner — the governance graph of the last lesson, now with a currency column), **diagnose** (the pathology catalogue: recognize the ten shapes of waste on sight), and **prioritize** (spend optimization effort where the theorem says it pays). The stance to carry from the whole course: cost is not a procurement problem to negotiate annually; it is a *system property* — an output of layout, freshness, and architecture decisions — and this course has taught you every input to it."
            },
            {
              "type": "theorem",
              "kind": "definition",
              "name": "Cost attribution; unit economics",
              "statement": "**Cost attribution** decomposes the platform bill along the ownership graph: every billable resource (a warehouse, a job cluster, a storage prefix, a topic, an on-demand query) is tagged with (workload, owner, environment), so the invoice becomes a table joinable to the catalog — cost per pipeline, per mart, per team, per dashboard. The primitives are architectural, established in earlier units: per-workload warehouses (u5l3's cattle rule) make compute self-attributing; query tags/labels attribute shared-pool platforms; storage attributes by prefix/table; the semantic layer attributes queries to the metrics and dashboards that issued them.\n\n**Unit economics** divides attributed cost by a consumption denominator to yield decision-grade ratios: cost per pipeline-run, per dashboard-refresh, per active consumer, per ML training cycle — and their trends. A platform's health metric is not total spend (which should grow with the business) but **unit cost trajectory**: cost per consumed unit should fall as scale amortizes fixed work; a rising unit cost is the smoke alarm that some pathology below is compounding."
            },
            {
              "type": "example",
              "heading": "Worked example: the Trellis bill autopsy",
              "body": "Trellis's monthly platform bill, eighteen months into the architecture, attributed per the definition — the numbers a graduate should be able to produce for their own platform in an afternoon. **Snowflake compute $9,400**: ELT_WH $1,060 (XL × ~1.5 h nightly — the elasticity theorem holding), BI_WH $4,100 (M multi-cluster, business hours — the largest legitimate line), SCIENCE_WH $310, DEV_WH $780, and **$3,150 of automatic clustering + a forgotten always-on 2XL in a sandbox account** — the first finding: a third of warehouse spend is one policy failure (resource monitors existed; the sandbox account wasn't enrolled — governance gap, not tuning gap). **Snowflake storage $1,900**: of which $1,140 is time-travel/fail-safe churn on two staging tables rebuilt wholesale nightly with 14-day retention — u5l2's churn × retention law, unheeded: set TRANSIENT + retention 1, saving ~$1,000/mo. **Databricks + object storage $6,200**: clickstream compute $3,800 (justified: sessionization + ML), storage $1,300, and **$1,100 of a streaming job whose consumer is a dashboard viewed weekly** — u8l3's dial, unheeded: micro-batch hourly saves ~$900/mo. **BigQuery (one team's shadow stack) $1,700**: on-demand queries against an unpartitioned export — u5l4's meter, unheeded; partitioning cuts it 90%, and the deeper finding is *shadow*: the export bypasses the catalog, so the lineage-and-contracts machinery never saw it. Total: $19,200/mo, of which **~$6,100 (32%) is attributable waste with named fixes** — a proportion so typical it is almost a constant of the industry. The autopsy's meta-lesson: every finding was a unit-N law, unheeded — cost review is *curriculum review*."
            },
            {
              "type": "code",
              "heading": "The autopsy is three queries (attribution as SQL)",
              "lang": "sql",
              "code": "-- 1. Compute cost per workload: metering joined to the naming convention.\n--    (Per-workload warehouses ARE the attribution — u5l3's cattle rule paying off.)\nSELECT warehouse_name,\n       SPLIT_PART(warehouse_name, '_', 1)      AS workload,   -- ELT / BI / SCIENCE / DEV\n       SUM(credits_used) * 3.00                AS usd_month\nFROM   snowflake.account_usage.warehouse_metering_history\nWHERE  start_time >= DATEADD(month, -1, CURRENT_DATE)\nGROUP  BY 1, 2 ORDER BY usd_month DESC;\n\n-- 2. Storage cost decomposed into live vs churn (u5l2's churn × retention law):\nSELECT table_name,\n       active_bytes / 1e9                      AS live_gb,\n       (time_travel_bytes + failsafe_bytes) / 1e9 AS churn_gb   -- the waste column\nFROM   snowflake.account_usage.table_storage_metrics\nORDER  BY churn_gb DESC LIMIT 20;\n\n-- 3. Scan efficiency per dashboard: query history joined to semantic-layer tags.\nSELECT query_tag:dashboard::string             AS dashboard,\n       SUM(bytes_scanned) / 1e12               AS tb_scanned_month,\n       COUNT(*)                                AS refreshes\nFROM   snowflake.account_usage.query_history\nWHERE  query_tag IS NOT NULL\nGROUP  BY 1 ORDER BY tb_scanned_month DESC;\n-- Finding rows: the sandbox 2XL (query 1), the 14-day-retention staging tables\n-- (query 2, churn_gb ≫ live_gb), the 2 TB-per-refresh dashboard (query 3).\n-- Every waste line in the autopsy came out of one of these three result sets.",
            },
            {
              "type": "theorem",
              "kind": "proposition",
              "name": "Greedy prioritization is optimal under equal-effort fixes (and near-optimal beyond)",
              "statement": "Model the waste findings as items with recoverable values v₁ ≥ v₂ ≥ … ≥ vₙ. (a) If each fix costs one unit of engineering effort and you can spend k units, choosing the k largest values maximizes recovered savings — greedy-by-attributed-value is exactly optimal. (b) If fixes have differing efforts eᵢ and effort budget E, greedy by value-density vᵢ/eᵢ is optimal in the fractional/divisible sense and, for indivisible fixes, achieves at least a constant-factor guarantee (and, run as 'best density first, fill remaining budget', at least half the optimum) — justifying density-ordered backlogs without exact knapsack solving. Practical corollary: attribution (which produces the vᵢ) is itself the highest-value activity, since without it greedy degenerates to guessing — the formal reason 'measure before optimizing' is a theorem, not a slogan.",
              "proof": "(a) Any selection of k items has value equal to the sum of its members; since v₁ … v_k are the k largest, any other selection S with |S| = k satisfies Σ_{i∈S} vᵢ ≤ Σ_{i≤k} vᵢ by an exchange argument: replace any member of S not among the top-k with an unchosen top-k item — each exchange does not decrease the sum (the incoming value is ≥ the outgoing by the ordering), and finitely many exchanges transform S into the top-k set. Hence the top-k set is maximal. (b) Fractional case: order by density vᵢ/eᵢ and spend the budget down the list; the standard exchange argument shows any solution spending effort on a lower-density item while a higher-density item is unsaturated can be improved by reallocating effort toward the higher density — so density-greedy is optimal when items are divisible (partial fixes recover proportional value — often true: re-clustering the worst partitions first, enrolling the biggest accounts first). Indivisible case: greedy-by-density filling the budget, compared with the true optimum OPT: the classical bound shows greedy's value plus the first rejected item's value ≥ OPT; hence max(greedy, that single item) ≥ OPT/2 — a 2-approximation without solving knapsack, sufficient for backlog ordering where the vᵢ are themselves estimates. ∎"
            },
            {
              "type": "text",
              "heading": "The pathology catalogue",
              "body": "The recurring waste shapes, each tagged with its governing law — recognition is the skill, since every one hides inside a green, functioning pipeline. **Idle compute** (u5l3's utilization clause): warehouses without suspend policies, sandbox accounts outside monitors, dev clusters over weekends. **Unpruned scans** (u4l2): layouts uncorrelated with dominant predicates — the fix is clustering or partitioning, and on byte-metered platforms it is a literal bill reduction. **SELECT-star sprawl** (u1l3/u4l1): projection discipline decaying in dashboards and UDF-heavy notebooks. **Over-freshness** (u8l3's dial): streaming or 5-minute schedules serving weekly decisions — the single most common *architectural* waste. **Churn × retention** (u5l2/u6l3): full-rebuild staging tables with long time-travel windows; MERGE-heavy tables never OPTIMIZE'd, deletion vectors never purged. **Small files** (u2l3): streaming ingest without compaction duty. **Full rebuilds that should be incremental** (u7l2's 100×). **Fan-out recomputation** (u7l1's view stacks): the same join executed thousands of times daily because nobody materialized the mart. **Shadow stacks** (u9l2): unattributed spend outside the catalog — ungoverned *and* uncounted. **Skew and spill** (u4l3): one towering partition billing a whole cluster's wait. The discipline that keeps the catalogue short: unit-cost dashboards per workload (the smoke alarm), a monthly attribution review (the autopsy), and the theorem ordering the backlog."
            },
            {
              "type": "callout",
              "tone": "info",
              "body": "**Cost, performance, and correctness optimizations are usually the same edit.** The course's deepest economy: clustering that prunes scans (u4) cuts both latency and bytes billed; incremental models (u7) cut both runtime and credits; compaction (u2/u6) cuts both request latency and request charges; right-freshness (u8) cuts both operational surface and standing spend; contracts (u9) prevent both corruption and the backfill-storm that follows it. Waste and fragility are strongly correlated because both are symptoms of the same cause — a design that ignores the workload's actual shape. Optimize for the workload, and the invoice follows."
            },
            {
              "type": "text",
              "heading": "What is now established — the course, closed",
              "body": "Cost is a system property with an engineering discipline: attribution along the governance graph (per-workload compute as the primitive), unit economics as the health metric, a pathology catalogue in which every entry is an earlier unit's law unheeded, and a theorem directing effort at the largest attributed values first — with attribution itself proved to be the highest-value work. Trellis's bill is itemized, its waste named and scheduled, and its platform can answer the CFO's question in one table. Step back once, because the arc is the point. The course began with one database doing two jobs badly and a proof about why (unit 1). It separated the workloads and priced their bytes (unit 2), gave the analytical copy a language of meaning (unit 3) and an engine (unit 4), then two industrial homes — the warehouse (unit 5) and the civilized lake (unit 6). It made the pipelines between them software with theorems (unit 7), made the movement itself honest under failure (unit 8), and finally made the whole thing *governable and affordable* (unit 9). One example threaded it end to end: a retailer's analytics growing from a melting replica to a contracted, audited, dual-platform system whose worst historical incident is now a failed CI build. The recurring method was the course's real syllabus: **derive the design from the workload's shape, price it in bytes and dollars, prove the property you depend on, and move every failure to the cheapest point that can catch it.** That method — not any vendor's product — is what transfers to the platforms that will replace these."
            },
            {
              "type": "exercises",
              "heading": "Exercises",
              "items": [
                {
                  "prompt": "An attributed cost review yields findings (monthly recoverable value, effort in engineer-days): A idle sandbox $3,000 (1d); B partition the shadow BigQuery export $1,500 (2d); C convert 3 full-rebuild models to incremental $1,200 (4d); D re-cluster the events table $900 (2d); E TRANSIENT staging retention $1,000 (0.5d); F retire the weekly-dashboard streaming job to micro-batch $900 (1d). With 6 engineer-days this quarter, apply the prioritization proposition (state the ordering rule you use and show the arithmetic) and give the expected monthly savings.",
                  "solution": "Efforts differ ⇒ order by density v/e: E $2,000/d (0.5d), A $3,000/d (1d), F $900/d (1d), B $750/d (2d), D $450/d (2d), C $300/d (4d). Greedy fill of 6 days: E (0.5d, $1,000) + A (1d, $3,000) + F (1d, $900) + B (2d, $1,500) = 4.5d, $6,400; remaining 1.5d cannot fit D (2d) or C (4d) — indivisible case: check the proposition's guard by comparing with swapping in the first rejected item (D, $900 for 2d — doesn't fit; no single item beats the greedy set). Result: fix E, A, F, B this quarter ≈ **$6,400/mo recovered** for 4.5 engineer-days, defer D and C. Note the theorem's corollary in action: the ordering was only possible because attribution produced the v's — the review that generated this table was the highest-value 'fix' of all.",
                  "hint": "Density = value/effort; fill the budget down the list; sanity-check against the first rejected item."
                },
                {
                  "prompt": "A platform's total spend grew 40% year over year while active consumers grew 60% and pipeline-runs grew 70%. A director calls the growth 'unsustainable'. Using unit economics, make the counter-analysis — compute the relevant ratios — and then name the two findings that would nonetheless justify concern, and where in the attribution table you would look for each.",
                  "solution": "Unit costs: cost per consumer changed by 1.40/1.60 ≈ 0.875 (−12.5%); cost per pipeline-run by 1.40/1.70 ≈ 0.82 (−18%): unit costs are *falling* — the platform is amortizing; total growth tracks business growth, which is the healthy profile (the smoke alarm is rising unit cost, not rising spend). Legitimate concerns despite good ratios: (1) mix-shift masking — one workload's unit cost may be exploding inside a falling average: look at per-workload unit trends in the attribution table (e.g., the ML training line growing 300% while BI amortizes); (2) unattributed/shadow spend — falling ratios computed over attributed spend are meaningless if the unattributed remainder is growing: look at the residual line (total invoice minus attributed sum) and its trend; a growing residual is governance debt wearing a discount. The general form: aggregate ratios answer aggregate questions; the autopsy always descends one level.",
                  "hint": "Divide by denominators before panicking; then distrust the average and the residual."
                },
                {
                  "prompt": "Map each pathology to its governing course law and its detection query (the check you'd automate): (a) a dashboard whose refresh scans 2 TB to render 12 numbers; (b) $800/mo of time-travel storage on a table rebuilt nightly; (c) a topic's consumer lag alarm firing every deploy; (d) p95 pipeline runtime doubling over a quarter with flat data volume.",
                  "solution": "(a) u4l2 pruning / u1l3 projection: detection = per-dashboard bytes-scanned from query history joined to the semantic layer's dashboard attribution; flag scan-to-result ratios above threshold; fix = clustering/partition filter or a materialized mart (u7l1's law). (b) u5l2 churn × retention: detection = retained-version storage per table vs its rebuild cadence (tables where time-travel bytes ≫ live bytes); fix = TRANSIENT/retention-1 for rebuilt staging. (c) u8l2 rebalance weather: detection = consumer-group lag time-series correlated with deploy events; fix = cooperative rebalancing + rolling restarts (operational, not capacity). (d) Ambiguous by design — the diagnosis tree: check the four u4 line items over time (scanned: clustering decay, u4l2's overlap depth; shuffled: a widened projection upstream of an exchange, u6l2's exercise; peak partition: growing skew from an emerging hot key; per-stage rows: a fan-out join introduced by a schema change) — the point being that runtime regressions are *attributable* to a specific law once the profile is itemized.",
                  "hint": "Every pathology has a metric that names it; the last one requires the four-line-item decomposition."
                },
                {
                  "prompt": "Write the closing memo (5–7 sentences) you would send after your first month as Trellis's data platform lead, structured as the course's method: the one workload-shape fact, the one price, the one proof, and the one moved failure that most shaped the platform — and the single next investment you would make, justified in the method's terms.",
                  "solution": "(Reference structure — content may vary:) 'Our platform's design follows from one fact: our analytical queries read a few columns of millions of rows while our applications read all columns of a few rows — so they live on separate systems, columnar and row-shaped respectively, connected by logged, contracted pipelines. Every major decision is priced: columnar layout and date-clustering cut our dominant scans ~30×; incremental models cut nightly compute ~100×; per-workload warehouses make the bill self-attributing, and this month's review found 32% recoverable waste with named fixes, ordered by value-density. The properties we depend on are proved, not hoped: idempotent DAG nodes make every rerun and backfill convergent, and write-audit-publish guarantees no consumer ever sees unaudited data. Our worst historical failure — a silent semantic change corrupting revenue — has been moved from the CFO's dashboard to the producer's CI, where it now costs a failed build instead of a restatement. Next investment: column-level lineage completion to the last mile (dashboards and deployed models), because the enforcement-point proposition says every failure class we can express moves to its cheapest checkpoint — and lineage is the vocabulary that lets us express more of them. Total ask: two engineer-weeks; expected return: the next discount incident, not happening.'",
                  "hint": "One shape, one price, one proof, one moved failure, one next bet — the course's method as a memo template."
                }
              ]
            }
          ],
          "reviewItems": [
            {
              "id": "u9l3-i1",
              "front": "The three moves of data FinOps",
              "back": "Attribute (every dollar names its workload/owner — per-workload warehouses, tags, prefixes), diagnose (the pathology catalogue), prioritize (greedy by attributed value/density — the theorem)."
            },
            {
              "id": "u9l3-i2",
              "front": "The platform health metric that matters (and the one that doesn't)",
              "back": "Unit cost trajectory (cost per consumer/run/refresh) should fall with scale — rising unit cost is the smoke alarm. Total spend growing with the business is healthy, not alarming."
            },
            {
              "id": "u9l3-i3",
              "front": "Why is greedy-by-value(-density) the right backlog order for cost fixes?",
              "back": "Exchange argument: under equal efforts, top-k values are exactly optimal; under differing efforts, density-greedy is fractionally optimal and ≥ half-optimal indivisibly — and attribution itself is the prerequisite that makes greedy meaningful (measure-first is a theorem)."
            },
            {
              "id": "u9l3-i4",
              "front": "Five pathology-catalogue entries and their governing laws",
              "back": "Idle compute (u5 utilization clause); unpruned scans (u4 layout); over-freshness (u8 dial); churn × retention (u5/u6); small files (u2). Each hides in a green pipeline — recognition, not novelty, is the skill."
            },
            {
              "id": "u9l3-i5",
              "front": "Why do cost, performance, and correctness fixes usually coincide?",
              "back": "All three degrade from the same cause — design ignoring workload shape. Clustering, incrementality, compaction, right-freshness, and contracts each cut latency, spend, and failure surface simultaneously."
            },
            {
              "id": "u9l3-i6",
              "front": "The course's method, in one sentence",
              "back": "Derive the design from the workload's shape, price it in bytes and dollars, prove the properties you depend on, and move every failure to the cheapest point that can catch it."
            }
          ]
        }
      ],
      "masteryCheck": {
        "id": "u9-check",
        "questions": [
          {
            "id": "u9q1",
            "type": "numeric",
            "prompt": "A distinct-count metric uses HyperLogLog with m = 4,096 registers. What is its approximate standard error, as a percentage (one decimal)?",
            "answer": 1.6,
            "tolerance": 0.1,
            "explanation": "Standard error ≈ 1.04/√m = 1.04/64 = 1.625% → ≈1.6%. Quadrupling m halves the error (√ scaling): 16,384 registers → ~0.8%. The semantic layer should declare the metric as approximate with this bar, and billing-grade counts must use exact scheduled computation instead.",
            "points": 1
          },
          {
            "id": "u9q2",
            "type": "short",
            "prompt": "Name the layer where a metric like 'revenue_net' is defined exactly once — formula, grain, allowed dimensions — and from which consumer queries are compiled (two words).",
            "accept": [
              "semantic layer",
              "the semantic layer",
              "metrics layer",
              "semantic/metrics layer"
            ],
            "explanation": "The semantic (metrics) layer: unit 3 gave data one definition, unit 7 gave transformations one definition, and the semantic layer gives *aggregations* one definition — removing the last structural cause of two dashboards disagreeing over identical data.",
            "points": 1
          },
          {
            "id": "u9q3",
            "type": "mcq",
            "prompt": "A producer proposes renaming a field in a contracted export. Where does this failure surface in a fully governed platform, and what is the total cost?",
            "options": [
              "At the producer's CI, pre-deploy: the contract check flags the rename as breaking (delete + add), lists consumers via lineage, and offers the change-policy paths — cost is a failed build and a design conversation; no wrong data ever exists",
              "At the consumer's ingestion, where schema resolution fails loudly at 2 a.m. and the batch is quarantined for morning triage",
              "At the audit gate, where statistical monitors detect the distribution shift and block publish, leaving dashboards one day stale",
              "Nowhere — renames are additive changes that schema evolution handles transparently without consumer involvement"
            ],
            "answer": 0,
            "explanation": "With a registered contract enforced in producer CI, schema-expressible breaks surface at stage 1 of the enforcement-point proposition — the cheapest point, before any violating data is produced. (b) is the unit-2 world (schema-embedded formats, no contract): a real improvement over silence, but a runtime failure with a delayed batch; (c) is the unit-7 world (semantic drift the schema can't express); (d) is false — rename = delete + add in resolution terms (unit 2's Avro lesson) and is the canonical breaking change.",
            "points": 1
          },
          {
            "id": "u9q4",
            "type": "numeric",
            "prompt": "Cost findings (value $/mo, effort days): P $4,000 (2d), Q $2,500 (1d), R $2,400 (3d), S $600 (0.5d). With an effort budget of 3.5 days and greedy-by-density selection, what monthly savings do you capture (in dollars)?",
            "answer": 7100,
            "tolerance": 0,
            "explanation": "Densities: Q $2,500/d, P $2,000/d, S $1,200/d, R $800/d. Greedy: Q (1d) + P (2d) = 3d, $6,500; remaining 0.5d fits S ($600) → total 3.5d, $7,100/mo. R ($2,400 for 3d) doesn't fit and doesn't beat the selected set — the proposition's indivisible-case check passes. Attribution produced the values; density ordered the work.",
            "points": 1
          },
          {
            "id": "u9q5",
            "type": "proof",
            "points": 2,
            "prompt": "Prove the equal-effort case of the prioritization proposition: given findings with recoverable values v₁ ≥ v₂ ≥ … ≥ vₙ and the capacity to execute exactly k fixes (each costing one unit of effort), selecting the k largest values maximizes total recovered savings. Use an exchange argument, and state the corollary about why attribution ('measure first') is formally the highest-value activity.",
            "rubric": [
              "Sets up the claim: any candidate selection S with |S| = k has value Σ_{i∈S} vᵢ, to be compared against the top-k set T = {1..k}",
              "Exchange argument: if S ≠ T, there exist j ∈ S∖T and i ∈ T∖S with vᵢ ≥ vⱼ (by the ordering, since i ≤ k < j in sorted position... any element of T∖S has value ≥ any element of S∖T); swapping j for i does not decrease the sum",
              "Concludes by finite iteration: repeated exchanges transform S into T without ever decreasing value, hence value(S) ≤ value(T) — T is optimal",
              "Corollary: without attribution the vᵢ are unknown, so any selection is an arbitrary k-subset whose expected value is the mean, not the maximum — the gap between random and greedy selection is exactly what measurement buys, making the measurement step's value the difference between top-k and average-k sums"
            ],
            "solution": "Let the findings be sorted v₁ ≥ v₂ ≥ … ≥ vₙ and let T = {v₁, …, v_k} be the top-k set. Take any selection S of k findings with S ≠ T. Then S∖T and T∖S are nonempty and equinumerous. Pick any j ∈ S∖T and i ∈ T∖S. Every member of T has value ≥ every non-member with larger sorted index; concretely, since i ∈ T its value vᵢ is among the k largest, and since j ∉ T its value vⱼ is not — so vᵢ ≥ vⱼ. Exchange j for i: the new selection S′ = S ∖ {j} ∪ {i} has value(S′) = value(S) − vⱼ + vᵢ ≥ value(S). Each exchange strictly reduces |S∖T| by one, so after at most k exchanges the selection equals T, and the value never decreased along the way: value(S) ≤ value(T). Hence T maximizes recovered savings. ∎ Corollary: the argument consumed one input — the sorted values. Without attribution, the optimizer cannot sort: selection is effectively a random k-subset with expected value k·v̄ (the mean), while greedy achieves the top-k sum; the difference — concentrated in heavy-tailed cost distributions, where the top few findings dominate (as in every real bill autopsy) — is the formal value of the measurement step itself. 'Measure before optimizing' is thus not hygiene but the dominant term: attribution converts optimization from expectation-of-the-mean to sum-of-the-maximum.",
            "explanation": "The course's final theorem is deliberately its simplest — an exchange argument any engineer can reproduce in a meeting — because its corollary carries the whole FinOps discipline: the bill autopsy (attribution) is provably the first fix, and heavy-tailed waste distributions make the top-k concentration large in practice."
          },
          {
            "id": "u9q6",
            "type": "open",
            "points": 3,
            "prompt": "Capstone: Trellis's board asks for a 'customer health score' visible three ways — (1) in the weekly exec dashboard, (2) inside the CRM for account managers, (3) as a live input to the support-routing system (p99 < 100 ms). Design the end-to-end delivery using the full course: where the score is computed and defined, how each surface is served, the governance around it (ownership, contract, lineage, access — the score uses order history, support tickets, and NPS, one component of which is PII-adjacent), the freshness each surface actually needs (justify via the dial), what keeps the three surfaces from disagreeing, and the cost posture (which serving choices keep the marginal cost near zero and which line items you would monitor). Name the specific units'/lessons' mechanisms as you use them.",
            "rubric": [
              "Computation and definition: score computed once in the modeled/transformation layer (u7 DAG: an incremental model over fct_order_line, tickets, NPS with point-in-time-correct components — u9l1's leak warning if predictive), *defined* once in the semantic layer (u9l1) with formula, grain (customer), owner, and version; all three surfaces derive from this single definition — the anti-disagreement mechanism named explicitly",
              "Serving per surface with freshness justified by the consuming decision (u1/u8 dial): exec dashboard — weekly decision ⇒ nightly batch mart behind WAP (u7l3) through the semantic layer; CRM — account managers act daily ⇒ reverse ETL on a daily schedule (u9l1); support routing — per-interaction decision ⇒ keyed low-latency serving copy fed from the pipeline/log (u9l1's operational pattern, u8's transport), never a warehouse query at 100 ms",
              "Governance: named owner; a contract on the published score (schema, semantics, SLOs, change policy — u9l2) since an operational system consumes it; lineage from sources through the score to all three surfaces for impact analysis (a definition change lists the CRM and router as affected); access — PII-adjacent NPS component handled via masking/classification (u9l2's tags), the score itself exposed without raw PII; the routing system's read path access-controlled (u7's WAP premise generalized)",
              "Cost posture: compute-once/syndicate-many keeps marginal serving cost near zero (one incremental build; reverse ETL and KV projection are cheap consumers); monitors on the score pipeline's unit cost, the serving store's footprint, and — flagged as the risk — anyone querying the warehouse per-interaction from the router (the u4 crossover violation to alert on); overall answer traces each choice to a named unit/lesson mechanism rather than asserting"
            ],
            "solution": "Definition and computation. The score is one governed asset: computed in the transformation DAG (u7l1) as an incremental model (u7l2 — keyed MERGE by customer, nightly, lookback per source lateness) joining order aggregates (fct_order_line), ticket aggregates, and NPS — each component computed point-in-time-correctly (u9l1's leak rule if the score is predictive: components as-of scoring time, dimensions at effective versions per u3l3). It is *defined* in the semantic layer (u9l1): `customer_health = f(...)` with formula, grain = customer, owner = Growth Analytics, version, and allowed dimensions — and all three surfaces are compiled/derived from this one definition, which is the structural answer to 'what keeps them from disagreeing': there is only one computation (u7's DRY) and one definition (u9l1), so the surfaces can differ only in staleness, which is declared per surface. Serving. (1) Exec dashboard: weekly decisions (u1's dial) ⇒ the nightly mart suffices; it publishes behind WAP (u7l3 — the board never sees an unaudited score) and renders through the semantic layer on the BI warehouse (u5 caches absorbing the repeat reads). (2) CRM: account managers work daily ⇒ reverse ETL (u9l1) pushes the published score into the CRM each morning after the audit gate — compute once, syndicate; the CRM never queries the warehouse live. (3) Support routing: a per-interaction, 100 ms, single-key read — u4's crossover in reverse: a keyed serving copy (u9l1) fed from the pipeline (publish score changes to a topic keyed by customer_id — u8l2 — projected into a KV store / compacted topic), updated within minutes of the nightly build (and intra-day if ticket events warrant a streaming component later — adopt only if routing decisions demonstrably improve, per u8l3's cost callout). Governance. Owner named in the catalog (u9l2); because an operational system consumes it, the published score carries a data contract: schema (customer_id, score, computed_at, version), semantics (range, meaning of bands), SLOs (freshness by 07:00; completeness = scored fraction of active customers), change policy (score-formula changes are versioned; the router pins a major version — a formula change cannot silently re-route support traffic: the u9l2 proposition moving that failure to review time). Lineage (u9l2) spans sources → model → all three surfaces, so impact analysis for any proposed change lists the deck, the CRM sync, and the router; the NPS component's PII adjacency is handled by classification tags + masking at staging (u9l2's harvested defaults) — the score exposes no raw PII, and the raw NPS columns are role-restricted (the u7 WAP premise applied to consumers generally). Cost posture. Marginal cost near zero by design: one incremental build (u7l2's 100× law), cheap syndication (reverse ETL batch, KV projection — both consumers of the same publish), no per-interaction warehouse queries. Monitored line items: the score pipeline's unit cost per scored customer (u9l3), the serving store's size, reverse-ETL API quotas — and an explicit alert on warehouse query patterns matching the router's service account, because the failure mode that silently burns money here is exactly an engineer 'simplifying' the router to query the warehouse directly (u4 crossover violation + u5 credit burn). Every mechanism named is doing the job it was proved or priced for earlier in the course — which is the point of the capstone.",
            "explanation": "The capstone requires composing nearly every unit: modeling and point-in-time correctness, incremental idempotent computation, WAP, the semantic layer as the anti-disagreement mechanism, three serving patterns matched to three access shapes and freshness needs, contracts protecting an operational consumer, lineage and PII governance, and a cost posture with named monitors. The grader rewards tracing each choice to its mechanism — the course's method, executed once, end to end."
          }
        ]
      }
    },
  ],
};
