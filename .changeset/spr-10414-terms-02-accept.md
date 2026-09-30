---
'@spritz-finance/api-client': minor
---

Add `client.terms.accept({ agreementId, sessionId? })` for `POST /v1/users/me/terms`.

```typescript
const { termsAccepted } = await client.terms.accept({ agreementId })
```

`agreementId` is the signed agreement id the user obtains from the provider's hosted flow. The URL of that flow is the `actionUrl` of the `terms_acceptance` requirement on `client.user.getMe()`. The endpoint does not accept an idempotency key. This is the REST replacement for the legacy GraphQL `client.onramp.acceptTermsOfService()`.

**New**

- `TermsService`, reachable as `client.terms`.
- `AcceptTermsRequest` and `AcceptTermsResponse` types, derived from the generated contract.
