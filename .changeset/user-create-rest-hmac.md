---
'@spritz-finance/api-client': patch
---

`client.user.create()` now calls `POST /v1/integrator/users` on the REST API when the client is configured with integrator HMAC credentials (`integrationKey` + `integratorSecret`), such as those issued by the Spritz Developer Console. The legacy `/users/integration` route denies those credentials, so user creation failed for Developer Console integrators.

Clients configured without an `integratorSecret` keep using the legacy route. The return type (`{ userId, email, apiKey }`) is unchanged. On the REST route an email that already exists throws a `ConflictError` (409).
