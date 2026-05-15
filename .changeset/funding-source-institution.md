---
'@spritz-finance/api-client': patch
---

Funding sources now expose an `institution` field with branding metadata (`name`, `logoUrl`, `primaryColor`) alongside the existing `institutionName`. The flat `institutionName` is deprecated — prefer `institution.name` going forward. Regenerated REST types against the platform OpenAPI spec.
