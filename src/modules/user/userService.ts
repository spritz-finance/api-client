import { GetVerificationParams } from '../../graph/mutations/__types__/GetVerificationParams'
import { RetryFailedVerification } from '../../graph/mutations/__types__/RetryFailedVerification'
import RetryFailedVerificationQuery from '../../graph/mutations/retryFailedVerification.graphql'
import GetVerificationParamsQuery from '../../graph/mutations/verificationParams.graphql'
import { CurrentUser, UserAccess } from '../../graph/queries/__types__'
import CurrentUserQuery from '../../graph/queries/currentUser.graphql'
import UserAccessQuery from '../../graph/queries/userAccess.graphql'
import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathResponse } from '../../rest/types'
import { transformToUserAccess } from './accessTransform'
import { UserAccessCapabilities } from './accessTypes'
import { transformUserResponse, VerificationStatus } from './transform'

export type UserProfile = PathResponse<'/v1/users/me', 'get'>

interface CreateUserResponse {
    userId: string
    email: string
    apiKey: string
}

interface CreateUserParams {
    email: string
    timezone?: string | null
}

export class UserService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    /**
     * Create an account under your integrator and return its access key.
     * With an integrator secret this uses POST /v1/integrator/users; without
     * one it uses the deprecated /users/integration route.
     *
     * Where reuse is enabled, a repeat for a normalized email (trimmed,
     * lowercased) that already has an account your integrator created returns
     * the same userId and current email with a fresh apiKey.
     * Older keys can stay valid until revoked. Where reuse is disabled, handle
     * USER_ALREADY_EXISTS for any existing account.
     *
     * Cross-tenant creation requires an approved rollout for your integrator.
     * An email held elsewhere grants no access to that account. Both routes
     * carry coded errors: USER_DELETED (the account resolved for you is closed),
     * USER_SELECTION_REQUIRED (several authorized matches), USER_ALREADY_EXISTS
     * (this call cannot return an existing account), USER_CREATE_IN_PROGRESS
     * (retryable), and AUTHORIZATION_LOOKUP_UNAVAILABLE (retryable 503).
     * Use hasProblemCode rather than branching on error text.
     */
    public async createUser(args: CreateUserParams): Promise<CreateUserResponse> {
        if (this.client.usesIntegratorAuth) {
            return this.client.restApi(
                restRoute('/v1/integrator/users', 'post', {
                    body: {
                        email: args.email,
                        ...(args.timezone ? { timezone: args.timezone } : {}),
                    },
                })
            )
        }

        return this.client.request<CreateUserResponse, CreateUserParams>({
            method: 'post',
            path: '/users/integration',
            body: args,
        })
    }

    /**
     * Alias of `createUser`: create the account for an email under your integrator, or
     * reuse the one you already have, and return an API key for it. See `createUser`
     * for the create-and-reuse contract and the conflict codes.
     */
    public async create(args: CreateUserParams) {
        return this.createUser(args)
    }

    /**
     * Fetch the authenticated user's profile from the REST API (`GET /v1/users/me`).
     *
     * Returns the response as-is, including `verification` (status, country and any
     * outstanding requirement) and `capabilities`.
     */
    public async getMe() {
        return this.client.restApi(restRoute('/v1/users/me', 'get'))
    }

    public async getCurrentUser() {
        const response = await this.client.query<CurrentUser>({
            query: CurrentUserQuery,
        })
        return transformUserResponse(response)
    }

    public async retryFailedVerification() {
        await this.client.query<RetryFailedVerification>({
            query: RetryFailedVerificationQuery,
        })
        return this.getCurrentUser()
    }

    public async getVerificationParams() {
        const response = await this.client.query<GetVerificationParams>({
            query: GetVerificationParamsQuery,
        })
        return response.getVerificationParams
    }

    public async getUserAccess(): Promise<UserAccessCapabilities> {
        const response = await this.client.query<UserAccess>({
            query: UserAccessQuery,
        })
        const user = transformUserResponse(response)

        const verificationStatus = user?.verificationStatus ?? VerificationStatus.NotStarted
        const verifiedCountry = user?.verifiedCountry ?? null

        return transformToUserAccess(response, verificationStatus, verifiedCountry)
    }
}
