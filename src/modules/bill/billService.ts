import {
    CreateUSBill,
    CreateUSBillVariables,
    CreateUSBill_addUSBill,
} from '../../graph/mutations/__types__/CreateUSBill'
import {
    DeletePayableAccount,
    DeletePayableAccountVariables,
    DeletePayableAccount_deletePayableAccount_Bill,
} from '../../graph/mutations/__types__/DeletePayableAccount'
import { RenameBankAccount_renamePayableAccount_Bill } from '../../graph/mutations/__types__/RenameBankAccount'
import {
    RenamePayableAccount,
    RenamePayableAccountVariables,
} from '../../graph/mutations/__types__/RenamePayableAccount'
import AddUSBillMutation from '../../graph/mutations/createUSBill.graphql'
import DeletePayableAccountMutation from '../../graph/mutations/deletePayableAccount.graphql'
import RenamePayableAccountMutation from '../../graph/mutations/renamePayableAccount.graphql'
import { UserBills } from '../../graph/queries/__types__'
import UserBillsQuery from '../../graph/queries/bills.graphql'
import { GraphClient } from '../../lib/client'
import { BillType } from '../../types/globalTypes'

export class BillService {
    private client: GraphClient

    constructor(client: GraphClient) {
        this.client = client
    }

    public async list() {
        const response = await this.client.query<UserBills>({
            query: UserBillsQuery,
        })
        return response?.bills ?? []
    }

    public async rename(accountId: string, name: string) {
        const response = await this.client.query<
            RenamePayableAccount,
            RenamePayableAccountVariables
        >({
            query: RenamePayableAccountMutation,
            variables: {
                accountId,
                name,
            },
        })
        return (
            (response?.renamePayableAccount as RenameBankAccount_renamePayableAccount_Bill) ?? null
        )
    }

    public async delete(accountId: string) {
        const response = await this.client.query<
            DeletePayableAccount,
            DeletePayableAccountVariables
        >({
            query: DeletePayableAccountMutation,
            variables: {
                accountId,
            },
        })
        return (
            (response?.deletePayableAccount as DeletePayableAccount_deletePayableAccount_Bill) ??
            null
        )
    }

    public async add(institutionId: string, accountNumber: string, type?: BillType) {
        const response = await this.client.query<CreateUSBill, CreateUSBillVariables>({
            query: AddUSBillMutation,
            variables: {
                institutionId,
                accountNumber,
                type: type ?? null,
            },
        })
        return (response?.addUSBill as CreateUSBill_addUSBill) ?? null
    }
}
