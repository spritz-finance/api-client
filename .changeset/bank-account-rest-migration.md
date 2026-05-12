---
'@spritz-finance/api-client': minor
---

Migrate `client.bankAccount` to the REST API so bank account records expose `fundingSourceId`, the canonical signal for ACH on-ramp eligibility.

- `bankAccount.list()`, `bankAccount.create()`, and `bankAccount.delete()` now call REST `/v1/bank-accounts/` instead of GraphQL.
- New `bankAccount.get(id)` returns a single bank account.
- The list/create response shape changes to match the REST contract: `label` (was `name`), `accountNumberLast4`, `routingNumberLast4`, region-specific `type` (`us` / `ca` / `uk` / `iban`), `supportedRails`, and `fundingSourceId`. Removed fields: `userId`, `email`, `ownedByUser`, `paymentAddresses`, full `accountNumber`, GraphQL-only `bankAccountType`/`bankAccountSubType`/`deliveryMethods`.
- `bankAccount.create()` input switches to the REST body (`type`, `ownership`, region-specific fields, optional `accountHolder` for `thirdParty`) and no longer requires the previous `subType`/`details` GraphQL shape.
- `bankAccount.rename()` is removed; the REST API has no equivalent.
- `completeLinking()` now returns the full REST envelope `{ bankAccounts: [...] }` with the same per-account shape as `list()`.
- ACH on-ramp guide updated: treat `bankAccount.list()` as the canonical list and use `fundingSourceId` to detect on-ramp eligibility. Bank accounts without a `fundingSourceId` remain usable for off-ramp.
