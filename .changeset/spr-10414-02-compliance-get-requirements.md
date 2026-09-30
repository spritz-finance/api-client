---
'@spritz-finance/api-client': minor
---

Add `client.compliance.getRequirements()` for `GET /v1/users/me/compliance/requirements`.

```typescript
const { required, complete, deadline, fields } = await client.compliance.getRequirements()
```

Returns the additional compliance fields the user's region requires and which of them are still missing. Users outside a regulated region get `required: false` with an empty `fields` array.

**New**

- `ComplianceService`, reachable as `client.compliance`.
- `ComplianceRequirements` and `ComplianceRequirementField` types, derived from the generated contract.
