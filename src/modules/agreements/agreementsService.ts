import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type CreateAgreementsPresentationRequest = PathRequestBody<
    '/v1/users/me/agreements/presentations',
    'post'
>
export type CreateAgreementsPresentationResponse = PathResponse<
    '/v1/users/me/agreements/presentations',
    'post'
>
export type AgreementsPresentation = Exclude<
    CreateAgreementsPresentationResponse,
    { nothingToPresent: true }
>
export type AgreementsReceipt = PathResponse<
    '/v1/users/me/agreements/operations/{presentationId}',
    'get'
>
export type AgreementsAcceptanceRequest = PathRequestBody<'/v1/agreements/acceptances', 'post'>
export type AgreementsState = AgreementsReceipt['agreements']
export type AgreementType = AgreementsPresentation['items'][number]['type']

/**
 * Spritz agreements (Terms of Service, Privacy Policy, E-Sign Consent) are the
 * user's relationship-level consent with Spritz, separate from provider terms
 * (`client.terms`) and from each deposit authorization.
 *
 * Read the current state from `user.getMe()` → `agreements`. When its `status`
 * is `action_required`, call `present()` from your backend, show the returned
 * copy to the user, and have the user's own client submit the acceptance.
 */
export class AgreementsService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    /**
     * Creates a presentation of every outstanding agreement
     * (`POST /v1/users/me/agreements/presentations`).
     *
     * Resolves with `{ nothingToPresent: true }` when the user has nothing to
     * accept. Otherwise render `copy[statementKey]` verbatim directly above a
     * button labelled `copy.buttonLabel`, linking each document from
     * `copy.links`. Do not translate or rephrase it. Document URLs are relative
     * to the Spritz API origin.
     *
     * Forward `presentationId`, `copySha256`, the presented `items[].type` and
     * the short-lived `submissionToken` (15 minutes, this presentation only) to
     * the user's client. That client sends `POST /v1/agreements/acceptances`
     * itself, with `Authorization: Bearer <submissionToken>` and body
     * `{ presentationId, accept, copySha256 }`. Spritz refuses an acceptance sent
     * from your backend, including one sent from the network that created the
     * presentation (`403 client_submission_required`), so this SDK does not
     * make that request. Under the default `clickwrap` pattern, `accept` must
     * list every presented type.
     *
     * Throws a `RateLimitError` with `problem.code ===
     * 'agreement_presentation_rate_limited'` after ten presentations for one user
     * within a minute.
     */
    public async present(
        input: CreateAgreementsPresentationRequest = {}
    ): Promise<CreateAgreementsPresentationResponse> {
        return this.client.restApi(
            restRoute('/v1/users/me/agreements/presentations', 'post', {
                body: input,
            })
        )
    }

    /**
     * Recovers the receipt of an accepted presentation
     * (`GET /v1/users/me/agreements/operations/{presentationId}`), for when the
     * user's client lost the acceptance response. Throws a `NotFoundError` when
     * nothing was accepted for that presentation.
     */
    public async getReceipt(presentationId: string): Promise<AgreementsReceipt> {
        return this.client.restApi(
            restRoute('/v1/users/me/agreements/operations/{presentationId}', 'get', {
                params: { presentationId },
            })
        )
    }
}
