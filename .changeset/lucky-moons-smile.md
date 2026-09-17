---
'@spritz-finance/api-client': minor
---

Add `client.achDebit.checkEligibility({ email })` for the new `POST /v1/ach-debit/eligibility` endpoint.

```typescript
const { eligible } = await client.achDebit.checkEligibility({ email: 'user@example.com' })
```

Ask before showing a bank deposit option to someone who is not yet a Spritz user. The route authenticates as the integrator over HMAC and takes no user bearer key, because the address it asks about need not belong to an existing user. Eligibility only moves in one direction — once an address is eligible it stays eligible — so `eligible: false` may be transient and should be re-checked rather than cached. Once the user exists, `client.user.getUserAccess()` is the source of truth.

**New**

- `AchDebitService`, reachable as `client.achDebit`.
- `AchDebitEligibilityRequest` and `AchDebitEligibilityResponse` types, both derived from the generated contract.

**Also in this release**, from regenerating the REST types: `messageVersion` on the `deposit.prepare` response widens from `'v1'` to `'v1' | 'fomo_v1'`. Spritz picks the authorization template server-side from the integrator; clients cannot request one and should keep displaying `message` verbatim. Code that assigned `messageVersion` to a `'v1'`-typed variable will need to widen it.
