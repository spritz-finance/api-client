# ACH-debit sandbox SDK controls

Why: four generated sandbox routes are inaccessible through the public `SandboxService`, preventing SDK consumers from exercising deterministic ACH-debit controls.

1. Verify each route's generated request, response, and header contract.
2. Add exported generated-type aliases and four `SandboxService` methods.
3. Add unit coverage for each method's REST route construction.
4. Add a patch changeset.
5. Run formatting, lint, contract typecheck, tests, and build.
6. Write the task report, commit with gritty, push, open the PR, then append final status.
