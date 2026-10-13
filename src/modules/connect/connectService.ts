import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type CreateConnectSessionParams = PathRequestBody<'/v1/integrator/connect/sessions', 'post'>
export type ConnectSession = PathResponse<'/v1/integrator/connect/sessions', 'post'>
export type ConnectTokenExchange = PathResponse<'/v1/integrator/connect/token', 'post'>

/**
 * Spritz Connect: let a Spritz user authorize your integrator to act for an account
 * you do not own.
 *
 * Where reuse is enabled, `user.createUser` returns your own or currently
 * authorized account. Connect explicitly grants access to a selected existing
 * account. Use it when create fails with `USER_ALREADY_EXISTS` (this call cannot
 * return an existing account, including when reuse is disabled), when it fails with `USER_SELECTION_REQUIRED`
 * (you are authorized for several accounts with that email and must pick one), or
 * whenever you want access to a specific existing account:
 *
 * 1. `createSession({ redirectUri, state, email })` on your backend, passing the
 *    email of the account. Send the user to `authorizationUrl` unchanged
 *    (it carries a `#return_token` fragment; never log it). On mobile open it
 *    in the system auth session, not a WebView.
 * 2. Spritz redirects to `redirectUri` with `code` and your `state`, or with
 *    `error=access_denied | server_error | session_expired`.
 * 3. Verify `state`, then `exchangeCode(code)` for the user's API key. Store it
 *    server-side only.
 *
 * `redirectUri` must exactly match a callback URL Spritz has registered for your
 * integrator. Both calls need integrator HMAC credentials
 * (`integrationKey` + `integratorSecret`).
 */
export class ConnectService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    private requireIntegratorAuth(method: string) {
        if (!this.client.usesIntegratorAuth)
            throw new Error(
                `connect.${method} requires integrator credentials (integrationKey and integratorSecret)`
            )
    }

    /** Start a Connect session. Sessions last 10 minutes. */
    public async createSession(args: CreateConnectSessionParams): Promise<ConnectSession> {
        this.requireIntegratorAuth('createSession')
        return this.client.restApi(
            restRoute('/v1/integrator/connect/sessions', 'post', {
                body: {
                    redirectUri: args.redirectUri,
                    ...(args.state ? { state: args.state } : {}),
                    ...(args.email ? { email: args.email } : {}),
                },
            })
        )
    }

    /** Exchange the single-use authorization code for the user's API key. */
    public async exchangeCode(code: string): Promise<ConnectTokenExchange> {
        this.requireIntegratorAuth('exchangeCode')
        return this.client.restApi(
            restRoute('/v1/integrator/connect/token', 'post', { body: { code } })
        )
    }
}
