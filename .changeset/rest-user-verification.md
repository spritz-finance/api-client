---
'@spritz-finance/api-client': minor
---

Add REST user profile and verification session methods, and regenerate the REST types from the sandbox OpenAPI schema.

**New methods**

- `client.user.getMe()` calls `GET /v1/users/me` and returns the REST profile as-is (exported type `UserProfile`), including `verification` (`status`, `country`, optional `requirement`) and `capabilities`.
- `client.verification.createSession()` calls `POST /v1/users/me/verification-sessions/` and returns the session as-is (exported type `VerificationSession`: `sessionId`, `provider`, `sessionToken`, `verificationUrl`, `verificationUrlExpiresAt`).

The GraphQL methods `user.getCurrentUser()`, `user.getVerificationParams()` and `user.retryFailedVerification()` are unchanged and not deprecated: the REST profile has no verification failure reason, maps verifications under review to `not_started`, and has no retry endpoint yet.

**Regenerated REST types**

The regeneration adds types for new endpoints (for example `POST /v1/off-ramp-quotes/{quoteId}/submit`, `GET /v1/deposits/`, `POST /v1/sandbox/bank-accounts/link`) and new webhook event names (`offramp.*`, `achDebit.*`, `onrampCredit.*`). It also changes types used by existing methods to match the API:

- `deposit.prepare()` / `deposit.create()` / `sandbox.createDepositWithReturn()`: the `clientContext` request field is gone; the fee quote replaces `planAdjustmentBps` / `planAdjustmentFeeUsd` with `instantPortionUsd`, `settlementPortionUsd`, `regularPublishedFeeUsd`, `instantPublishedFeeUsd` and adds `requestedPriority`; `integratorPricingClass`, `integratorPlanPhase`, `integratorPolicyVersion` and `exposureAmountUsd` are removed from the deposit.
- `sandbox.createDepositWithReturn()`: `returnSimulation` is now optional and its `code` is a union of NACHA return codes (was `string`); `riskSimulation` and `lifecycleSimulation` were added.
- `fundingSource.getDepositLimits()`: `dailyLimitUsd`, `dailyRemainingUsd`, `monthlyLimitUsd`, `monthlyRemainingUsd`, `unsettledDepositLimit`, `unsettledDepositRemaining` and `exposure` are removed; `maxPortionUsd` is replaced by `maxAmountUsd` and `maxEarlyReleaseAmountUsd`.
- `fundingSource.list()` / `fundingSource.get()`: `disabledReason` and `ownershipMatchStatus` are removed.
- Additive only: `quoteId` on refunded off-ramps, `depositId` on on-ramps, and the wider webhook event list.
