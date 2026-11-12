---
'@spritz-finance/api-client': minor
---

Add `authorizationStatement` to the deposit prepare response, and the `fomo_v2` authorization message version. `authorizationStatement` is the authorization paragraph alone, copied word for word from `message`. Show it as written when your UI lays out the amounts from `summary` itself. That's only allowed for `fomo_v2`; for every other version, show `message` in full.
