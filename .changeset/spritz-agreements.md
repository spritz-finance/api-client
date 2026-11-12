---
'@spritz-finance/api-client': minor
---

Add `client.agreements` for Spritz Terms of Service, Privacy Policy and E-Sign Consent: `present()` creates a presentation of outstanding agreements (with a `submissionToken` for the user's client) and `getReceipt(presentationId)` recovers an acceptance receipt. `user.getMe()` now returns `agreements`. REST types are regenerated from the live spec.
