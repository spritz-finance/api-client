import {
    PopularBillInstitutions,
    PopularBillInstitutionsVariables,
    SearchUSBillInstitutions,
    SearchUSBillInstitutionsVariables,
} from '../../graph/queries/__types__'
import PopularUSBillInstitutionsQuery from '../../graph/queries/popularBillInstitutions.graphql'
import SearchUSBillInstitutionsQuery from '../../graph/queries/searchUSBillInstitutions.graphql'
import { GraphClient } from '../../lib/client'
import { BillType } from '../../types/globalTypes'

export class InstitutionService {
    private client: GraphClient

    constructor(client: GraphClient) {
        this.client = client
    }

    public async popularUSBillInstitutions(type?: BillType) {
        const response = await this.client.query<
            PopularBillInstitutions,
            PopularBillInstitutionsVariables
        >({
            query: PopularUSBillInstitutionsQuery,
            variables: {
                billType: type ?? null,
            },
        })
        return response?.popularUSBillInstitutions ?? []
    }

    public async searchUSBillInstitutions(searchTerm: string, type?: BillType) {
        const response = await this.client.query<
            SearchUSBillInstitutions,
            SearchUSBillInstitutionsVariables
        >({
            query: SearchUSBillInstitutionsQuery,
            variables: {
                searchTerm,
                billType: type ?? null,
            },
        })
        return response?.searchUSBillInstitutions ?? []
    }
}
