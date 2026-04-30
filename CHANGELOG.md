# @spritz-finance/api-client

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
