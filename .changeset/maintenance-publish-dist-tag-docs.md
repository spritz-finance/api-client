---
---

Clarify the maintenance-publish workflow's `dist-tag` input: npm rejects values that parse as SemVer ranges (e.g. `0.7`, `0.7.x`), so use a non-range form like `legacy-0.7`.
