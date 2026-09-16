---
'@spritz-finance/api-client': minor
---

Expose RFC 9457 problem details on `APIError` as a typed, normalized `problem` property, so consumers can branch on the problem type instead of inspecting an untyped payload.

```typescript
import { hasProblemType } from '@spritz-finance/api-client'

try {
    await client.deposit.create(input, options)
} catch (error) {
    if (hasProblemType(error, 'urn:problem-type:idempotency-conflict')) {
        // The same idempotency key was used with a different request body.
    }

    throw error
}
```

**New**

- `ProblemDetails`, `ProblemFieldError` and `ProblemSuggestedAction` types, modelling every field the contract documents on a problem response: `type`, `title`, `status`, `detail`, `instance`, `code`, `field`, `errors[]`, `retryable`, `retryAfter`, `suggestedAction`, `clearsAt`, `availableAt`, `permanent`, plus `realm`/`scope` (some 401s) and `resourceType`/`resourceId` (404s). Anything else the API sends stays readable on `error`.
- `APIError.problem?: ProblemDetails`, parsed from the response body.
- `APIError.requestId?: string` and `APIError.traceId?: string`, lifted from the `x-amzn-requestid` and `x-amzn-trace-id` headers.
- Type guards `isAPIError`, `hasProblemType` and `hasProblemCode`. The latter two narrow `problem.type` / `problem.code` to the literal passed in.

The payload is untrusted, so it is validated at runtime with no new dependency: a field appears on `problem` only when the response carried it with its documented type, each `errors[]` entry is validated individually, and documented nulls (`clearsAt`, `availableAt`) are preserved as distinct from absence. Inherited properties are ignored, so a polluted prototype cannot add a field the response never sent. A malformed error body never throws — it just yields fewer fields, or no `problem` at all.

**Additive.** `error` still holds the untouched parsed payload, including fields `ProblemDetails` does not model, and `headers` still holds the correlation ids. The status subclasses and transport errors are unchanged, and no class was added per problem code.

The SDK exposes upstream problem details faithfully, including `detail`, which is written for integrators rather than end users. Deciding what is safe to forward to a frontend remains the consumer's call at its own boundary.
