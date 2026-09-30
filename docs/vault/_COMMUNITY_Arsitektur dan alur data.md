---
type: community
cohesion: 0.10
members: 35
---

# Arsitektur dan alur data

**Cohesion:** 0.10 - loosely connected
**Members:** 35 nodes

## Members
- [[Admin dashboard (admin.php)]] - code - README.md
- [[Alur data (data flow)]] - concept - docs/ARSITEKTUR.md
- [[Arsitektur Lapor WKI]] - document - docs/ARSITEKTUR.md
- [[Attachment upload (5 files x 10 MB)]] - concept - README.md
- [[Chat phases loading, choose, asking, files, review, sending, done]] - concept - docs/ARSITEKTUR.md
- [[DB table attachments]] - concept - docs/ARSITEKTUR.md
- [[DB table rate_limit]] - concept - docs/ARSITEKTUR.md
- [[DB table reports]] - concept - docs/ARSITEKTUR.md
- [[Deploy to Hostinger subdomain]] - concept - README.md
- [[Design decisions (optional answers, review summary, random ref code, server-side flows)]] - rationale - docs/ARSITEKTUR.md
- [[Email notification (mailSMTP driver)]] - concept - README.md
- [[Lapor WKI (chat-style reporting web)]] - concept - README.md
- [[Mailer (mail() or SMTP)]] - code - docs/ARSITEKTUR.md
- [[MySQL Hostinger database]] - concept - README.md
- [[Pelaporan Gratifikasi (GRT-XXXXXXXX)]] - concept - README.md
- [[Privacy and security measures]] - rationale - README.md
- [[README Lapor WKI]] - document - README.md
- [[Random reference code (WBS-GRT-)]] - concept - docs/ARSITEKTUR.md
- [[Whistleblowing System (WBS-XXXXXXXX)]] - concept - README.md
- [[api.phpaction=flows]] - concept - docs/ARSITEKTUR.md
- [[api.phpaction=submit (multipart, honeypot)]] - concept - docs/ARSITEKTUR.md
- [[appconfig.php configuration]] - code - README.md
- [[scriptsassemble.mjs (builds deploy)]] - code - README.md
- [[scriptssmtp_sink.py (local email test)]] - code - README.md
- [[server PHP backend (api.php, admin.php, app)]] - code - README.md
- [[serveradmin.php dashboard]] - code - docs/ARSITEKTUR.md
- [[serverapi.php public endpoint]] - code - docs/ARSITEKTUR.md
- [[serverapp bootstrap (DB, throttle), flows, Mailer]] - code - docs/ARSITEKTUR.md
- [[serverappflows.php (single source of questions)]] - code - README.md
- [[srcmain.tsx entry script]] - code - web/index.html
- [[web React + TypeScript (Vite) frontend]] - code - README.md
- [[webindex.html (SPA entry)]] - code - web/index.html
- [[websrcApp.tsx chat state machine]] - code - docs/ARSITEKTUR.md
- [[websrccomponents (Header, MessageList, Composer)]] - code - docs/ARSITEKTUR.md
- [[websrcvalidate.ts client validation]] - code - docs/ARSITEKTUR.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Arsitektur_dan_alur_data
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_Design system]]

## Top bridge nodes
- [[Lapor WKI (chat-style reporting web)]] - degree 9, connects to 1 community
- [[README Lapor WKI]] - degree 5, connects to 1 community
- [[websrccomponents (Header, MessageList, Composer)]] - degree 4, connects to 1 community
- [[webindex.html (SPA entry)]] - degree 4, connects to 1 community