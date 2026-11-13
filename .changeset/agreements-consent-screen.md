---
'@spritz-finance/api-client': minor
---

Agreements presentations now return one resolved consent `screen` (title, statement segments, E-SIGN checkbox, button label) and a `screenSha256` to echo on acceptance, replacing `statementKey`, `copy` and `copySha256`. `present()` takes `placement` (`standalone` | `kyc`) instead of `types`. New exported types: `AgreementsScreen`, `AgreementsScreenKind`, `AgreementsPlacement`, `AgreementsTextSegment`.
