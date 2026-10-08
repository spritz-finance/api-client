---
'@spritz-finance/api-client': minor
---

Regenerate REST types from the live sandbox spec. `bankAccount.create` with `type: "iban"` no longer requires `bic` (`CreateBankAccountInput` has `bic?: string`); when supplied it is still validated as an uppercase 8 or 11 character BIC. Also picks up the documented `400`/`403`/`409` problem responses on `autoRampAccount.create`, which is now idempotent per (`address`, `network`, `token`) and returns `AUTO_RAMP_ACCOUNT_CREATE_IN_PROGRESS` (`retryable: true`) on a concurrent create. Additive: no existing field changes type.
