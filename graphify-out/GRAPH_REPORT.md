# Graph Report - .  (2026-09-30)

## Corpus Check
- Corpus is ~9,161 words - fits in a single context window. You may not need a graph.

## Summary
- 177 nodes · 250 edges · 13 communities
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Chat React (App + API klien)
- Arsitektur dan alur data
- Admin dan bootstrap PHP
- Konfigurasi TypeScript
- Dependensi runtime
- Dependensi dev
- Design system
- Skrip susun deploy
- SMTP penampung uji

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Lapor WKI (chat-style reporting web)` - 9 edges
3. `App()` - 8 edges
4. `Design System Lapor WKI (Master)` - 8 edges
5. `Arsitektur Lapor WKI` - 8 edges
6. `server/ PHP backend (api.php, admin.php, app/*)` - 6 edges
7. `Alur data (data flow)` - 6 edges
8. `cfg()` - 5 edges
9. `db()` - 5 edges
10. `Mailer` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Design System Lapor WKI (Master)` --conceptually_related_to--> `Lapor WKI (chat-style reporting web)`  [INFERRED]
  design-system/lapor-wki/MASTER.md → README.md
- `Key chat components (bubbles, adaptive composer, progress, review)` --conceptually_related_to--> `web/src/components (Header, MessageList, Composer)`  [INFERRED]
  design-system/lapor-wki/MASTER.md → docs/ARSITEKTUR.md
- `README Lapor WKI` --references--> `Design System Lapor WKI (Master)`  [EXTRACTED]
  README.md → design-system/lapor-wki/MASTER.md
- `Alur data (data flow)` --conceptually_related_to--> `Lapor WKI (chat-style reporting web)`  [INFERRED]
  docs/ARSITEKTUR.md → README.md
- `Random reference code (WBS-/GRT-)` --conceptually_related_to--> `Whistleblowing System (WBS-XXXXXXXX)`  [INFERRED]
  docs/ARSITEKTUR.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Report submission flow (SPA to api submit to DB and email)** — docs_arsitektur_app_tsx, docs_arsitektur_submit_endpoint, docs_arsitektur_table_reports, docs_arsitektur_table_attachments, docs_arsitektur_mailer [EXTRACTED 1.00]
- **Lapor WKI design system elements** — design_system_lapor_wki_master_color_tokens, design_system_lapor_wki_master_typography, design_system_lapor_wki_master_motion, design_system_lapor_wki_master_accessibility, design_system_lapor_wki_master_spacing_shape [EXTRACTED 1.00]
- **Privacy-by-design measures** — readme_privacy_security, docs_arsitektur_table_rate_limit, docs_arsitektur_reference_code, readme_attachment_upload [INFERRED 0.75]

## Communities (13 total, 0 thin omitted)

### Community 0 - "Chat React (App + API klien)"
Cohesion: 0.11
Nodes (32): fetchFlows(), submitReport(), SubmitResult, App(), prefersReduced(), wait(), AnswerInput(), AnswerProps (+24 more)

### Community 1 - "Arsitektur dan alur data"
Cohesion: 0.10
Nodes (35): Arsitektur Lapor WKI, server/admin.php dashboard, Alur data (data flow), server/api.php public endpoint, server/app bootstrap (DB, throttle), flows, Mailer, web/src/App.tsx chat state machine, Chat phases: loading, choose, asking, files, review, sending, done, web/src/components (Header, MessageList, Composer) (+27 more)

### Community 2 - "Admin dan bootstrap PHP"
Cohesion: 0.12
Nodes (9): PDO, page_start(), cfg(), db(), h(), migrate(), rate_limit_hit(), throttle() (+1 more)

### Community 3 - "Konfigurasi TypeScript"
Cohesion: 0.09
Nodes (21): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx (+13 more)

### Community 4 - "Dependensi runtime"
Cohesion: 0.12
Nodes (16): @phosphor-icons/react, react, react-dom, dependencies, @phosphor-icons/react, react, react-dom, name (+8 more)

### Community 5 - "Dependensi dev"
Cohesion: 0.18
Nodes (11): @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react, devDependencies, @types/react, @types/react-dom (+3 more)

### Community 6 - "Design system"
Cohesion: 0.20
Nodes (10): Design System Lapor WKI (Master), Accessibility guidelines, Key chat components (bubbles, adaptive composer, progress, review), Semantic color tokens (light/dark), Light-first style with paired dark mode, Motion rules (reduced motion), Phosphor icons, Spacing and shape scale (+2 more)

### Community 7 - "Skrip susun deploy"
Cohesion: 0.22
Nodes (8): files, keep, out, root, saved, server, tmp, web

### Community 8 - "SMTP penampung uji"
Cohesion: 0.40
Nodes (3): H, SMTP penampung untuk uji lokal: menyimpan setiap email yang diterima ke folder t, S

## Knowledge Gaps
- **54 isolated node(s):** `root`, `web`, `server`, `out`, `keep` (+49 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Lapor WKI (chat-style reporting web)` connect `Arsitektur dan alur data` to `Design system`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `Design System Lapor WKI (Master)` connect `Design system` to `Arsitektur dan alur data`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Lapor WKI (chat-style reporting web)` (e.g. with `Design System Lapor WKI (Master)` and `Alur data (data flow)`) actually correct?**
  _`Lapor WKI (chat-style reporting web)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `web`, `server` to the rest of the system?**
  _54 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Chat React (App + API klien)` be split into smaller, more focused modules?**
  _Cohesion score 0.10975609756097561 - nodes in this community are weakly interconnected._
- **Should `Arsitektur dan alur data` be split into smaller, more focused modules?**
  _Cohesion score 0.0957983193277311 - nodes in this community are weakly interconnected._
- **Should `Admin dan bootstrap PHP` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._