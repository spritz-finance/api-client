---
'@spritz-finance/api-client': minor
---

Regenerate the REST types from the sandbox OpenAPI schema. This contains two breaking type changes.

**1. Bank account `status` narrowed to `'active' | 'inactive'`.**

The API no longer returns `'pending'` or `'rejected'` for `GET /v1/bank-accounts/`, `POST /v1/bank-accounts/`, or `GET /v1/bank-accounts/{accountId}`. Code branching on either removed value will no longer compile. Funding sources are unaffected — they keep their own `status` union (`pending | active | review_required | ineligible | disabled | deleted`).

**2. IBAN bank account creation has new required request fields.**

On `POST /v1/bank-accounts/` with `type: 'iban'`:

- `bic` is now required (was optional) — affects every IBAN account creation.
- `accountHolder.address` is now required (was optional), as is its `country`. This only applies when you pass `accountHolder`, which itself remains required only for `ownership: 'thirdParty'`.

The endpoint already documented both as required for IBAN accounts; the types now enforce it. Callers omitting them were getting runtime 400s that the types allowed.

Also relaxed in the same variant: `accountHolder.address.state` is now optional (was required), and an optional `bankName` was added.
