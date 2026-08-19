---
'@spritz-finance/api-client': minor
---

Regenerate the REST types from the sandbox OpenAPI schema. The bank account `status` field is now `'active' | 'inactive'` — the API no longer returns `'pending'` or `'rejected'` for `GET /v1/bank-accounts/`, `POST /v1/bank-accounts/`, or `GET /v1/bank-accounts/{accountId}`.

This narrows a union, so consumers branching on `'pending'` or `'rejected'` for a bank account will now see a type error. Funding sources are unaffected — they keep their own `status` union (`pending | active | review_required | ineligible | disabled | deleted`).
