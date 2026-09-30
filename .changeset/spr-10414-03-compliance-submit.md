---
'@spritz-finance/api-client': minor
---

Add `client.compliance.submit(...)` for `POST /v1/users/me/compliance`.

```typescript
const { complianceFieldsComplete, bridgeCustomerUpdated } = await client.compliance.submit({
    placeOfBirth: { country: 'DEU', city: 'Berlin' },
    nationalities: ['DEU'],
    accountPurpose: 'personal_or_living_expenses',
})
```

All required fields must be supplied together; a partial submission is rejected with field-level errors on `error.problem.errors`. `accountPurposeOther` is required when `accountPurpose` is `'other'`.

**New**

- `SubmitComplianceRequest` and `SubmitComplianceResponse` types, derived from the generated contract.
