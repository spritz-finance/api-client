---
'@spritz-finance/api-client': patch
---

Surface optional `redirectUri` on `bankAccount.createLinkToken` for Plaid OAuth flows. Pass a URL (web), universal link (iOS), or package name (Android) to receive a Plaid Link token configured for OAuth redirect handling.
