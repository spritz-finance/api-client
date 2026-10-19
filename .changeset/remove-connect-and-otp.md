---
'@spritz-finance/api-client': minor
---

Breaking: remove Spritz Connect and the one-time code key recovery, both retired on the API. `client.connect` (`createSession`, `exchangeCode`), its exported types `ConnectSession`, `ConnectTokenExchange` and `CreateConnectSessionParams`, and the Connect paths in the REST types are gone. `user.requestApiKey()` and `user.authorizeApiKeyWithOTP()` (deprecated in 0.23.0) are gone too. To recover a lost key where account reuse is enabled, call `user.create()` again with the same email; otherwise use the key you stored or contact Spritz support. Keys already issued through the one-time code flow keep working.
