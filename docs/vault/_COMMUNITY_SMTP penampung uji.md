---
type: community
cohesion: 0.40
members: 6
---

# SMTP penampung uji

**Cohesion:** 0.40 - moderately connected
**Members:** 6 nodes

## Members
- [[.handle()]] - code - scripts/smtp_sink.py
- [[.send()]] - code - scripts/smtp_sink.py
- [[H]] - code - scripts/smtp_sink.py
- [[S]] - code - scripts/smtp_sink.py
- [[SMTP penampung untuk uji lokal menyimpan setiap email yang diterima ke folder t]] - rationale - scripts/smtp_sink.py
- [[smtp_sink.py]] - code - scripts/smtp_sink.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/SMTP_penampung_uji
SORT file.name ASC
```
