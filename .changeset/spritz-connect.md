---
'@spritz-finance/api-client': minor
---

Add `client.connect` for Spritz Connect: `createSession({ redirectUri, state, email })` and `exchangeCode(code)`, for linking a user whose email already has a Spritz account (the 409 from `user.create()`). Regenerated REST types include the new `email` field. Documents the 409 codes `USER_ALREADY_EXISTS` (use Connect) and `USER_CREATE_IN_PROGRESS` (retry).
