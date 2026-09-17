---
---

Internal only: assert at compile time that the hand-written `ProblemDetails` still matches the generated OpenAPI problem schemas. `src/lib/problemContract.ts` emits no runtime code and is not bundled, so there is no consumer-facing change and nothing to release.
