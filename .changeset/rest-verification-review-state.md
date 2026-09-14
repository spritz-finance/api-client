---
'@spritz-finance/api-client': minor
---

Regenerate REST types from the live sandbox spec for verification retry support: `UserProfile.verification` gains `failureReason`, `provider` (`persona` | `plaid`) and the `under_review` status, and `sandbox.bypassKyc({ failed: true, retryable })` can arm a retryable failure.
