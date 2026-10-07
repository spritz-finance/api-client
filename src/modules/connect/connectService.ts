import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type CreateConnectSessionParams = PathRequestBody<'/v1/integrator/connect/sessions', 'post'>
export type ConnectSession = PathResponse<'/v1/integrator/connect/sessions', 'post'>
export type ConnectTokenExchange = PathResponse<'/v1/integrator/connect/token', 'post'>

/**
 * Spritz Connect: let an existing Spritz user authorize your integrator.
 *
 * Use it when `user.createUser` fails with a `ConflictError` whose
 * `problem.code` is `USER_ALREADY_EXISTS` (the email already has a Spritz account):
 *
 * 1. `createSession({ redirectUri, state, email })` on your backend, passing the
 *    email that was rejected. Send the user to `authorizationUrl` unchanged
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
