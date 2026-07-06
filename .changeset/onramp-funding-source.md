---
'@spritz-finance/api-client': minor
---

On-ramps now expose the funding source they originated from: `onrampPayment.list`/`get` responses include a `source` object (`{ fundingSourceId }`) for ACH-debit on-ramps, or `null` for externally pushed funds (ach_credit, wire, sepa). Deposits expose `onRampId` linking to the on-ramp created for them. Funding sources gain a `deletedAt` timestamp and a `"deleted"` status — removed funding sources stay retrievable by id for historical reference. Regenerated REST types against the platform OpenAPI spec.
