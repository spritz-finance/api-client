import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'
import { idempotencyHeaders, type CreateDepositOptions } from '../deposit/depositService'

export type BypassKycRequest = PathRequestBody<'/v1/sandbox/bypass-kyc', 'post'>
export type CreateDepositWithReturnRequest = PathRequestBody<'/v1/sandbox/deposits/direct', 'post'>
export type CreateDepositWithReturnResponse = PathResponse<'/v1/sandbox/deposits/direct', 'post'>
export type PrepareDepositWithProgramControlRequest = PathRequestBody<
    '/v1/sandbox/deposits/direct/prepare',
    'post'
>
export type PrepareDepositWithProgramControlResponse = PathResponse<
    '/v1/sandbox/deposits/direct/prepare',
    'post'
>
export type AchDebitExposureResponse = PathResponse<'/v1/sandbox/ach-debit/exposure', 'get'>
export type SetAchDebitExposureCapRequest = PathRequestBody<
    '/v1/sandbox/ach-debit/exposure/cap',
    'post'
>
export type SetAchDebitExposureCapResponse = PathResponse<
    '/v1/sandbox/ach-debit/exposure/cap',
    'post'
>
export type LinkBankAccountRequest = PathRequestBody<'/v1/sandbox/bank-accounts/link', 'post'>
export type LinkBankAccountResponse = PathResponse<'/v1/sandbox/bank-accounts/link', 'post'>
export type DeleteFundingSourceResponse = PathResponse<
    '/v1/sandbox/funding-sources/{fundingSourceId}',
    'delete'
>
export type SimulateAutoRampDepositRequest = PathRequestBody<
    '/v1/sandbox/auto-ramp-accounts/{id}/deposit',
    'post'
>
export type SimulateAutoRampDepositResponse = PathResponse<
    '/v1/sandbox/auto-ramp-accounts/{id}/deposit',
    'post'
>

export class SandboxService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    /**
     * Simulate KYC verification for testing purposes.
     * Only available in sandbox environments — returns 403 in production.
     */
    public async bypassKyc(options?: BypassKycRequest) {
        return this.client.restApi(
            restRoute('/v1/sandbox/bypass-kyc', 'post', {
                body: options ?? { country: 'US' },
            })
        )
    }

    /**
     * Create a deposit whose ACH debit is routed through a return-code-armed
     * receiving account. The deposit settles into the `returned` lifecycle with
     * the supplied NACHA `code` so end-to-end return handling can be tested.
     *
     * Like `deposit.create`, `POST /v1/sandbox/deposits/direct` requires an
     * `idempotency-key`; reuse the same key and body to replay after a timeout.
     *
     * Only available in sandbox environments — returns 403 in production.
     */
    public async createDepositWithReturn(
        input: CreateDepositWithReturnRequest,
        options: CreateDepositOptions
    ) {
        return this.client.restApi(
            restRoute('/v1/sandbox/deposits/direct', 'post', {
                body: input,
                headers: idempotencyHeaders(options),
            })
        )
    }

    /**
     * Prepare a deposit under a deterministic program halt or new-user pause
     * so integrators can exercise the production-equivalent 409 response.
     *
     * Only available in sandbox environments — returns 403 in production.
     */
    public async prepareDepositWithProgramControl(input: PrepareDepositWithProgramControlRequest) {
        return this.client.restApi(
            restRoute('/v1/sandbox/deposits/direct/prepare', 'post', {
                body: input,
            })
        )
    }

    /**
     * Read the authenticated integrator's sandbox W1/W2 exposure and caps.
     *
     * Only available in sandbox environments — returns 403 in production.
     */
    public async getAchDebitExposure() {
        return this.client.restApi(restRoute('/v1/sandbox/ach-debit/exposure', 'get', {}))
    }

    /**
     * Set the authenticated integrator's sandbox W1/W2 exposure caps.
     *
     * Only available in sandbox environments — returns 403 in production.
     */
    public async setAchDebitExposureCap(input: SetAchDebitExposureCapRequest) {
        return this.client.restApi(
            restRoute('/v1/sandbox/ach-debit/exposure/cap', 'post', {
                body: input,
            })
        )
    }

    /**
     * Link a deterministic sandbox bank account without opening Plaid Link.
     *
     * Only available in sandbox environments — returns 403 in production.
     */
    public async linkBankAccount(input: LinkBankAccountRequest) {
        return this.client.restApi(
            restRoute('/v1/sandbox/bank-accounts/link', 'post', {
                body: input,
            })
        )
    }

    /**
     * Permanently remove an ACH debit funding source for the authenticated user.
     * Intended for resetting funding sources during integration testing.
     *
     * Only available in sandbox environments — returns 403 in production.
     */
    public async deleteFundingSource(fundingSourceId: string) {
        return this.client.restApi(
            restRoute('/v1/sandbox/funding-sources/{fundingSourceId}', 'delete', {
                params: { fundingSourceId },
            })
        )
    }

    /**
     * Simulate a fiat deposit arriving in an auto-ramp account and settling to crypto
     * (`POST /v1/sandbox/auto-ramp-accounts/{id}/deposit`). This is the only way to make
     * an auto-ramp account settle in sandbox. The on-ramp it produces is an ordinary one:
     * follow `onRampId` with `onrampPayment.get()`.
     *
     * `amount` is in the account's own currency. Pass `settle: false` to leave the
     * deposit at `processing`, then pass the returned `depositId` back to advance that
     * same on-ramp. `gasFee` sets the network fee the provider reports (defaults to
     * `0.00`); `exchangeFee` sets the conversion fee, which is otherwise derived from the
     * provider's live bid/ask spread. Set both for a predictable fee breakdown.
     *
     * Only available in sandbox environments — returns 403 in production.
     */
    public async simulateAutoRampDeposit(accountId: string, input: SimulateAutoRampDepositRequest) {
        return this.client.restApi(
            restRoute('/v1/sandbox/auto-ramp-accounts/{id}/deposit', 'post', {
                params: { id: accountId },
                body: input,
            })
        )
    }
}
