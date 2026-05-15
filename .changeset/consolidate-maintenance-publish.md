---
---

Consolidate maintenance publishing into the existing `publish.yml` workflow. npm only allows one trusted publisher per package, so the standalone `maintenance-publish.yml` (introduced in 0.8.1) is removed and `publish.yml` gains an optional `dist-tag` input for releases on diverged maintenance branches. Documented in CLAUDE.md.
