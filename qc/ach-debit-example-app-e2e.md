# ACH Debit Example App E2E QC

This runbook is for the ACH onramp example at `scripts/sandbox/ach-onramp.html`.

The partner-facing ACH calls run through the built SDK on the local evidence server. The browser only drives the UI and Plaid Link; it does not hold HMAC signing code.

The app captures every SDK request, SDK response, SDK error shape, Plaid Link outcome, selected funding source, deposit limit response, authorization message, deposit create response, on-ramp polling response, and ACH return polling response into a redacted evidence JSON file under `qc/evidence/`.

Browser JavaScript cannot safely write directly to an arbitrary local path, so the repo includes a local evidence server. It serves the app and receives redacted evidence on the same origin, which works with VPS/port-forwarded browsers.

## Setup

1. Create or reuse a sandbox user with KYC bypassed:

    ```bash
    ./scripts/sandbox/run.sh setup-user
    ```

2. Build the SDK bundle used by the evidence server:

    ```bash
    yarn build
    ```

3. Start the app and evidence server:

    ```bash
    node scripts/sandbox/evidence-server.mjs
    ```

    The server binds to `127.0.0.1` by default. Prefer an SSH port-forward for VPS/browser testing. If you intentionally need direct non-local access, run with `EVIDENCE_HOST=0.0.0.0`.

4. Open `http://localhost:3001/ach-onramp.html`, or the forwarded URL for port `3001` ending in `/ach-onramp.html`.

5. Fill in:
    - Integration key
    - Integrator secret
    - API key, or use **Generate Fresh User** to create one
    - Solana destination wallet
    - Deposit amount
    - Optional fee subsidy
    - Plaid Signal sandbox amount profile
    - Optional sandbox ACH return code

6. If Plaid Link opens, use Plaid sandbox credentials:
    - Username: `user_good`
    - Password: `pass_good`

## Evidence Rules

Run one scenario per browser run. Click **Clear Evidence** before each scenario. The app auto-saves evidence after completed flows and return polling; use **Save Evidence to Workspace** after blocked/error scenarios.

Expected file names look like:

```text
ach-qc-2026-05-06T10-15-30-123Z.json
```

Files are written to `qc/evidence/` and intentionally ignored by git.

Each file must be checked for:

- No raw integrator secret, API key, Plaid public token, Plaid link token, Authorization header, or HMAC signature.
- SDK `client.fundingSource.list()` response.
- SDK `client.fundingSource.getDepositLimits(id)` response for `/v1/funding-sources/{id}/deposit-limits`.
- Pre-KYC SDK `client.bankAccount.createLinkToken()` 403 evidence, including `PermissionDeniedError`, `status`, `message`, and problem-detail payload.
- Pre-KYC raw REST parity evidence for `POST /v1/bank-accounts/link-token`.
- Post-KYC SDK `client.bankAccount.createLinkToken()` success evidence.
- Post-KYC raw REST parity evidence for `POST /v1/bank-accounts/link-token`.
- SDK `client.deposit.prepare(...)` request and response.
- The exact authorization message shown before confirm.
- Confirm event after authorization review.
- SDK create method:
    - `client.deposit.create(...)` for normal create.
    - `client.sandbox.createDepositWithReturn(...)` when ACH return simulation is selected.
- Signal amount profile used for the run, because Plaid sandbox Signal is amount-driven.
- Problem detail body on errors, including HTTP status and API code/type where returned.
- Request IDs or trace IDs if the API returns them.

## Scenarios

### 0. Generated User And KYC Gate

Inputs:

- Integration key
- Integrator secret
- Optional sandbox user email

Action:

- Click **Generate Fresh User** to create a new unverified user and fill the API key.
- Click **Bypass KYC (US)** if you only need to make the current API key usable.
- Click **Full SDK KYC Gate QC** when you specifically want evidence that pre-KYC is blocked and post-KYC is allowed through the SDK.

Expected:

- Fresh user actions always create a unique sandbox user and fill the API key field.
- `client.bankAccount.createLinkToken()` throws `PermissionDeniedError` with status `403` before verification.
- The app bypasses KYC to `US` through `client.sandbox.bypassKyc(...)`.
- `client.bankAccount.createLinkToken()` succeeds after verification.
- Evidence is saved to `qc/evidence/`.

### 1. Happy Path

Inputs:

- Signal amount profile: score `60` (`$12.17`)
- Return code: blank

Expected:

- Funding source is `active`.
- Deposit limits are returned.
- Prepare succeeds and shows the authorization message.
- User confirm creates a deposit.
- Create uses `client.deposit.create(...)`; Signal behavior is driven by the prepared amount.
- On-ramp polling uses:
    - `client.onrampPayment.list(...)`
    - `client.onrampPayment.get(onRampId)` when `bridgeOnRampId` is returned.

### 2. Live Signal Unavailable Guard

Inputs:

- Signal amount profile: custom amount that does not map to a stable Plaid sandbox score
- Return code: blank

Expected:

- Create uses `client.deposit.create(...)`.
- If Plaid Signal is unavailable, SDK throws a clean 409 with `risk_evaluation_unavailable`.
- No ACH debit is initiated.
- The app says the preparation is consumed and prompts for a fresh quote.

### 3. Signal Score 60 With Return Simulation

Inputs:

- Signal amount profile: score `60` (`$12.17`)
- Return code: `R01`

Expected:

- Create uses `client.sandbox.createDepositWithReturn(...)`.
- SDK request body includes `returnSimulation: { code: "R01" }`.
- Deposit is created.
- ACH returns polling eventually finds a return for the deposit.
- Webhook receiver records the corresponding deposit/on-ramp lifecycle and return-related events.

### 4. Signal High-Score Block

Inputs:

- Signal amount profile: score `90` (`$27.53`)
- Return code: blank

Expected:

- Create uses `client.deposit.create(...)`.
- SDK throws a clean 409 conflict with `risk_rejected` or equivalent public problem detail.
- No ACH debit is initiated.
- No ACH return can exist because Signal blocks before the pull.

### 5. Signal Ruleset Review/Reroute

Run only when the Plaid sandbox ruleset for this integrator maps an amount fixture to `REVIEW` or `REROUTE`.

Inputs:

- Signal amount profile configured to hit the sandbox ruleset action
- Return code: blank

Expected:

- SDK throws a clean 409 conflict with `risk_review_required` or `risk_rejected`.
- No deposit/on-ramp is created.
- No ACH debit is initiated.

### 6. Unauthorized Return

Run once with `R10` and once with `R29`.

Inputs:

- Signal amount profile: score `60` (`$12.17`)
- Return code: `R10` or `R29`

Expected:

- Deposit is created through `/v1/sandbox/deposits/direct`.
- ACH return polling eventually finds the return.
- Return record has the expected `returnCode`.
- User/source action fields reflect unauthorized-return handling.
- Webhook receiver captures return-related event delivery and signature verification passes.

## Review Checklist

- Partner flow is simple: link bank, fetch source, fetch limits, prepare, confirm, create.
- Errors are actionable and do not expose internals.
- Risk blocks happen after confirm and before ACH initiation.
- Return simulations happen only after an accepted create.
- Polling works through `onrampPayment` and `achDebitReturn`.
- Webhooks are verified end-to-end with raw-body signature validation.
- Evidence files are sufficient for a third party to audit the run without local browser state.
