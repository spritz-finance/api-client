---
'@spritz-finance/api-client': minor
---

`deposit.create` accepts `instantFallback` (`standard` | `confirm`). With `confirm`, a high-priority preparation that can get no instant portion throws a `ConflictError` with `problem.code === 'instant_unavailable'` instead of silently proceeding at standard timing; nothing is created and the same `preparationId` can be submitted again with `standard` and a new idempotency key once the user agrees. Regenerated REST types also add `cancellableUntil` on deposits, and the `v2`, `fomo_v3` and `fomo_v4` authorization message versions.
