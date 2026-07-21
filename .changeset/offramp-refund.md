---
'@spritz-finance/api-client': minor
---

Failed off-ramps can now be refunded via the new `client.offramp.refund(offRampId, input)`. Pass `{ method: 'account', accountId }` to reissue the payout to a different bank account, omit `accountId` to reuse the off-ramp's original destination, or pass `{ method: 'credit' }` to return the funds to the user's Spritz balance. Only failed Modern Treasury and Checkbook off-ramps are refundable. Regenerated REST types against the platform OpenAPI spec, which also picks up `PATCH /v1/debit-cards/{cardId}/cardholder-info`.
