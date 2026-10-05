---
'@spritz-finance/api-client': minor
---

`UserProfile` (`GET /v1/users/me`, and the user returned by `POST /v1/users/me`) gains `verification.duplicateIdentity: { maskedEmail: string } | null`. When `verification.failureReason` is `duplicate_identity` and the identity is already verified on another account under the same integrator, `maskedEmail` is that account's email masked as `j****@gmail.com`, so you can tell the user which account to sign in with. It is `null` in every other case. Additive: existing fields are unchanged.
