# @spritz-finance/api-client

## 0.7.0

### Minor Changes

- 84704ec: Add `client.sandbox.createDepositWithReturn` for simulating end-to-end ACH return handling in sandbox. Pass a NACHA return code (e.g. `R01`, `R10`) and the deposit's ACH debit is pre-armed to return with that code, surfacing in webhooks and `client.achDebitReturn.list()` like a real return.

  Add `client.onrampPayment.get(onRampId)` for fetching a single on-ramp record. Once a deposit is authorized it is observed via the on-ramp model — this completes the lookup pair alongside `list`.

  Tighten the ACH onramp guide: hoist the server-side-only architecture note above the prerequisites, add a NACHA-verbatim compliance warning around the authorization message, fix the sandbox-demo open instructions to use a local HTTP server, expand the deposit response field reference, and add a "Track Deposit Status" section explaining the on-ramp lookup pattern.

## 0.6.0

### Minor Changes

- e867e23: Switch ACH onramp to the new no-signature direct-deposit flow. `client.deposit.prepare` and `client.deposit.create` now hit `/v1/deposits/direct/prepare` and `/v1/deposits/direct`: `prepare` takes the destination wallet `address` (plus `network`/`asset`) instead of a bound `destinationId`, and `create` takes only `preparationId` — wallet signatures are no longer required. The `client.depositDestination` service and its bind/sign endpoints have been removed.

  Add `client.achDebitReturn` for the integrator-scoped ACH return endpoints (`list`, `get`) at `/v1/integrator/ach-debit/returns`, with filtering by user, return code, reporting bucket, crypto state at return, loss, user action, and time range.

## 0.5.0

### Minor Changes

- Add ACH onramp services (funding sources, deposit destinations, deposits), Plaid bank linking methods, and sandbox KYC bypass. Switch bank account and onramp payment list endpoints from GraphQL to REST API.

## 0.4.28

### Patch Changes

- be2b4d4: Declare the package manager version in package metadata.
