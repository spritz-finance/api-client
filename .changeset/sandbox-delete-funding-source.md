---
'@spritz-finance/api-client': minor
---

Add `client.sandbox.deleteFundingSource(fundingSourceId)` for permanently removing an ACH debit funding source while integration testing. Like the other sandbox helpers it is only available in sandbox environments — returns 403 in production. Regenerated REST types against the platform OpenAPI spec.
