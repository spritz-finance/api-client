---
'@spritz-finance/api-client': minor
---

Expose the full partner-facing ACH debit release surface: funding-source deposit limits, RFC 7807 error messages, sandbox ACH return simulation, webhook event updates, and SDK-backed QC evidence tooling.

Add typed webhook subscription updates via `client.webhook.update(webhookId, { events })`, including support for ACH on-ramp events, ACH debit return events, and `'*'` for all webhook events.
