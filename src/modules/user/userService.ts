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

interface RequestApiKeyResponse {
    success: boolean
}

interface RequestApiKeyParams {
    email: string
}

interface CreateUserParams {
    email: string
    timezone?: string | null
}

interface AuthorizeApiKeyResponse {
    apiKey: string
    userId: string
    email: string
}

interface AuthorizeApiKeyParams {
    otp: string
    email: string
}

export class UserService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async createUser(args: CreateUserParams) {
        return this.client.request<CreateUserResponse, CreateUserParams>({
            method: 'post',
            path: '/users/integration',
            body: args,
        })
    }

    public async create(args: CreateUserParams) {
        return this.createUser(args)
    }

    public async requestApiKey(email: string) {
        return this.client.request<RequestApiKeyResponse, RequestApiKeyParams>({
            method: 'post',
            path: '/users/request-key',
            body: {
                email,
            },
        })
    }

    public async authorizeApiKeyWithOTP(args: AuthorizeApiKeyParams) {
        return this.client.request<AuthorizeApiKeyResponse, AuthorizeApiKeyParams>({
            method: 'post',
            path: '/users/validate-key',
            body: args,
        })
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
