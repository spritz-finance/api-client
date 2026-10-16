import { SpritzClient } from '../../lib/client'
import { buildRestPath } from '../../rest/route'

/*
 * The request and response shapes in this module are written by hand from the
 * API contract: the generated REST types come from the published sandbox spec,
 * which leaves the identity-link routes out.
 */

/** Parameters for `identityLink.createSession`. */
export type CreateIdentityLinkSessionParams = {
    /**
     * Where Spritz sends the person when the hosted flow ends. Must exactly match
     * one of the Connect redirect URIs registered for your integrator.
     */
    redirectUri: string
    /** Opaque value returned unchanged on the redirect. Verify it on the callback. */
    state: string
}

/** A newly created identity link session. */
export type IdentityLinkSession = {
    sessionId: string
    /**
     * The hosted link page for this session. It carries the session's link token
     * in its `#link_token` fragment: send it to the person unchanged and never log it.
     */
    authorizationUrl: string
    /** When the session expires (ISO 8601): 15 minutes after creation. */
    expiresAt: string
}

/**
 * Where a session is in the hosted flow.
 *
 * `pending` → `selected` (the person named the original account) → `authenticated`
 * (they proved control of it) → `comparing` → `compared` (the face check has run) →
 * `linked`. `review` means Spritz is reviewing the link, which then moves on to `linked`
 * or `failed`; `cancelled`, `failed` and `expired` are terminal.
 */
export type IdentityLinkStatus =
    | 'pending'
    | 'selected'
    | 'authenticated'
    | 'comparing'
    | 'compared'
    | 'linked'
    | 'review'
    | 'cancelled'
    | 'failed'
    | 'expired'

/** Outcome of the face comparison, or `null` until it is decided. */
export type IdentityLinkComparison = 'passed' | 'failed' | null

/** The `result` query parameter Spritz appends to `redirectUri` when the flow ends. */
export type IdentityLinkResult = 'linked' | 'review' | 'cancelled' | 'failed' | 'expired'

/** What `identityLink.get` returns. */
export type IdentityLinkSessionStatus = {
    status: IdentityLinkStatus
    comparison: IdentityLinkComparison
}

/** Identifies a session to `identityLink.get`. */
export type IdentityLinkSessionRef = {
    sessionId: string
    /** The session's link token, from the `#link_token` fragment of `authorizationUrl`. */
    linkToken: string
}

const LINK_TOKEN_FRAGMENT_KEY = 'link_token'

/**
 * Read the link token out of a session's `authorizationUrl`.
 *
 * The token is the credential for `identityLink.get`: keep it server-side and never
 * log it. Throws when the URL carries no token; the message never echoes the URL.
 */
export function linkTokenFromAuthorizationUrl(authorizationUrl: string): string {
    let fragment: string
    try {
        fragment = new URL(authorizationUrl).hash
    } catch {
        throw new Error('authorizationUrl is not a valid URL')
    }

    // The token travels only in the fragment, so a query-string copy is not honoured.
    const token = new URLSearchParams(fragment.replace(/^#/, '')).get(LINK_TOKEN_FRAGMENT_KEY)
    if (!token) {
        throw new Error('authorizationUrl carries no link_token fragment')
    }

    return token
}

/**
 * Identity link sessions: let a person who already verified with Spritz prove that a
 * new account is theirs, instead of verifying again and failing as a duplicate.
 *
 * The flow is hosted by Spritz. Your backend starts a session for the **new** account
 * (integrator credentials plus that account's API key on the client), sends the person
 * to `authorizationUrl`, and
 * learns the outcome from the redirect back to `redirectUri`: your `state` plus
 * `result=linked | review | cancelled | failed | expired`. On the hosted page the person proves
 * control of the original account (by signing in to it or confirming a code sent to
 * it) and passes a fresh liveness and face check against it.
 *
 * Linking never issues you a key for, or tells you anything about, the original
 * account. Until identity linking is enabled for your environment every call fails
 * with a `NotFoundError` (HTTP 404, with `problem.code` `IDENTITY_LINKING_UNAVAILABLE`
 * when the API names the reason).
 */
export class IdentityLinkService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    /**
     * Start a link session for the authenticated (new) account.
     *
     * Needs integrator credentials (`integrationKey` + `integratorSecret`) and the new
     * account's API key: the session is partner-initiated, so both `redirectUri` and
     * `state` are required. Throws before calling when the integrator credentials are
     * missing, and a `ConflictError` with `problem.code` `LINK_NOT_ELIGIBLE` when the
     * account cannot start a link: it is already verified or linked, under review,
     * disabled or closed, or an earlier session for it is still being confirmed.
     */
    public async createSession(
        args: CreateIdentityLinkSessionParams
    ): Promise<IdentityLinkSession> {
        if (!this.client.usesIntegratorAuth)
            throw new Error(
                'identityLink.createSession requires integrator credentials (integrationKey and integratorSecret)'
            )

        return this.client.restApi<IdentityLinkSession, CreateIdentityLinkSessionParams>({
            method: 'post',
            path: '/v1/users/me/identity-link-sessions',
            body: { redirectUri: args.redirectUri, state: args.state },
        })
    }

    /**
     * Read where a session is.
     *
     * The redirect to `redirectUri` is the completion signal; use this to reconcile from
     * your backend, for example when the redirect never arrived. The session's link token
     * (`linkTokenFromAuthorizationUrl(session.authorizationUrl)`) is the credential and is
     * sent in the request body, never in the URL. An unknown session or a wrong token fails
     * with a `NotFoundError` that carries no session details and no `problem.code`; an
     * expired session is reported as its `status`. Reads are rate-limited per IP address
     * across all sessions, so read when you need to rather than polling.
     */
    public async get({
        sessionId,
        linkToken,
    }: IdentityLinkSessionRef): Promise<IdentityLinkSessionStatus> {
        if (!sessionId) throw new Error('identityLink.get requires a sessionId')
        if (!linkToken) throw new Error('identityLink.get requires the session link token')

        // The link token is the session's credential and the route takes no other auth,
        // so unlike createSession this works without integrator credentials.
        return this.client.restApi<IdentityLinkSessionStatus, { linkToken: string }>({
            method: 'post',
            path: buildRestPath('/v1/link/sessions/{sessionId}/status', { sessionId }),
            body: { linkToken },
        })
    }
}
