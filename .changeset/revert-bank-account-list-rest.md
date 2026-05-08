---
'@spritz-finance/api-client': patch
---

Revert `client.bankAccount.list()` to the `UserBankAccounts` GraphQL query. The REST `/v1/bank-accounts/` payload omits `userId`, `institution.id`, `institution.country`, `email`, `ownedByUser`, and `paymentAddresses`, and the previous shim filled those slots with empty strings and hardcoded values, silently changing the contract for existing consumers. Restoring the GraphQL path keeps the returned shape identical to prior releases.
