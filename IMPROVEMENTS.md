# Improvements

Architecture deepening backlog for `@spritz-finance/api-client`.

Rules for every item:

- [ ] No breaking public SDK changes.
- [ ] Keep existing public methods unless explicitly superseded later.
- [ ] Prefer additive modules and compatibility wrappers.
- [ ] Ship small, reviewable diffs with focused tests.
- [ ] Preserve generated GraphQL/OpenAPI type contracts.

Selected next: **2. Deepen REST route handling**.

## 1. Deepen Session Credentials

Files:

- `src/spritzApiClient.ts`
- `src/lib/client.ts`
- `src/modules/**`

Problem:

The root client currently mixes integrator credentials and user API key state. `setApiKey()` rebuilds modules, so retained module references can keep stale credentials. That is risky for backend integrators handling many users.

Target:

Make the root client integrator-scoped and add a user-scoped view without removing existing behavior.

Checklist:

- [ ] Add a session/request-context module that owns environment, integrator key, integrator secret, and optional user API key.
- [ ] Add `client.forUser(apiKey)` as the preferred non-breaking interface for user-scoped calls.
- [ ] Keep `client.setApiKey(apiKey)` working as a compatibility path.
- [ ] Do not require `{ apiKey }` on every user method.
- [ ] Ensure root integrator calls still work without a user API key.
- [ ] Ensure user-scoped calls include the bearer token and shared integrator credentials.
- [ ] Add tests for `forUser()` isolation across two user API keys.
- [ ] Add tests covering retained module references after `setApiKey()`.
- [ ] Update README examples after the implementation is stable.

## 2. Deepen REST Route Handling

Files:

- `src/rest/types.ts`
- `src/lib/client.ts`
- `src/modules/bankAccount/bankAccountService.ts`
- `src/modules/fundingSource/fundingSourceService.ts`
- `src/modules/deposit/depositService.ts`
- `src/modules/onrampPayment/onrampPaymentService.ts`
- `src/modules/achDebitReturn/achDebitReturnService.ts`
- `src/modules/webhook/webhookService.ts`
- `src/modules/sandbox/sandboxService.ts`

Problem:

REST modules repeat method/path/body/query plumbing. Path literals are duplicated in value space and type space, path params are encoded by hand, and some query calls need casts. These modules are shallow: callers get little leverage from each interface, and route correctness has poor locality.

Target:

Create a typed REST route module that concentrates method, path params, query serialization, body typing, and response typing behind one seam.

Checklist:

- [ ] Add a typed route builder module for OpenAPI paths.
- [ ] Centralize path param encoding.
- [ ] Centralize query serialization while preserving current scalar behavior.
- [ ] Bind `PathResponse`, `PathRequestBody`, `PathQuery`, and `PathParams` to one operation descriptor.
- [ ] Keep `SpritzClient.restApi()` public/internal behavior compatible.
- [ ] Migrate one low-risk module first, likely ACH debit returns or funding sources.
- [ ] Add route builder tests for path params, query params, body passthrough, and response typing.
- [ ] Migrate remaining REST modules in small follow-up diffs.
- [ ] Delete repeated `encodeURIComponent` route assembly after migration.
- [ ] Keep public module method names and return shapes unchanged.

## 3. Deepen ACH Onramp Flow

Files:

- `docs/ach-onramp-guide.md`
- `src/modules/bankAccount/bankAccountService.ts`
- `src/modules/fundingSource/fundingSourceService.ts`
- `src/modules/deposit/depositService.ts`
- `src/modules/onrampPayment/onrampPaymentService.ts`
- `src/modules/achDebitReturn/achDebitReturnService.ts`
- `src/modules/webhook/webhookService.ts`

Problem:

The ACH onramp sequence is documented but not represented as a deep module. Integrators must know how bank accounts, funding sources, limits, deposit preparation, authorization text, deposit creation, webhooks, on-ramp payments, and ACH debit returns fit together.

Target:

Add an additive ACH onramp workflow module that concentrates eligibility and lifecycle rules while keeping existing primitive methods.

Checklist:

- [ ] Name the domain concept clearly before adding the module.
- [ ] Keep existing bank account, funding source, deposit, webhook, and return methods unchanged.
- [ ] Add helper methods only where they hide real ACH sequencing complexity.
- [ ] Encode funding source eligibility checks in one place.
- [ ] Encode active funding source readiness in one place.
- [ ] Preserve caller control over displaying authorization text before deposit creation.
- [ ] Add tests for happy path, ineligible account, pending source, inactive source, and exhausted limits.
- [ ] Update docs to show the higher-leverage path while retaining primitive examples.

## 4. Deepen User Access Policy

Files:

- `src/modules/user/userService.ts`
- `src/modules/user/accessTransform.ts`
- `src/modules/user/accessTypes.ts`
- `src/modules/user/transform.ts`

Problem:

KYC, country support, Bridge user state, terms acceptance, and next-requirement ordering are real access policy. Today that policy lives as private transform helpers and has no focused test surface.

Target:

Make user access policy a named module with fixture-driven tests.

Checklist:

- [ ] Extract access policy into a module with one clear interface.
- [ ] Keep `client.user.getUserAccess()` return shape unchanged.
- [ ] Add fixtures for platform KYC states.
- [ ] Add fixtures for Bridge user states.
- [ ] Add fixtures for terms acceptance states.
- [ ] Add country feature-map tests for onramp and offramp.
- [ ] Add next-requirement ordering tests.
- [ ] Keep transform code thin after policy extraction.

## 5. Deepen Error And Fallback Behavior

Files:

- `src/lib/error.ts`
- `src/lib/client.ts`
- `src/modules/payment/paymentService.ts`
- `src/modules/webhook/webhookService.ts`

Problem:

HTTP errors are well-shaped, GraphQL errors use a separate path, and some module methods silently convert failures into `null` or placeholder objects. That makes failure semantics part of individual module implementations instead of a shared interface.

Target:

Concentrate SDK error and fallback semantics so callers get consistent behavior and maintainers get locality.

Checklist:

- [ ] Define when `null` means not found versus request failure.
- [ ] Define when a fallback object is acceptable.
- [ ] Align GraphQL error behavior with HTTP error behavior where possible.
- [ ] Preserve exported error classes and current throw behavior unless adding a compatibility layer.
- [ ] Add tests for GraphQL errors with request headers.
- [ ] Add tests for REST RFC 7807 errors.
- [ ] Add tests for module-level nullable lookups.
- [ ] Remove silent catches that hide actionable failures unless they are part of the documented interface.
