---
'@spritz-finance/api-client': minor
---

**Breaking:** remove `client.connect` and its `ConnectSession`, `ConnectTokenExchange` and `CreateConnectSessionParams` types. Spritz Connect has been removed from the API, so its routes no longer exist. For `USER_ALREADY_EXISTS` and `USER_SELECTION_REQUIRED`, use the API key you stored for the account or contact Spritz support. REST types are regenerated from the live spec.
