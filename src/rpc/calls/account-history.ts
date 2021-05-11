import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../../config';

export const getAccountHistory = async (address, offset): Promise<AccountHistoryResponse> =>
    NANO_CLIENT.account_history(address, 100, {
        offset,
    })
        .then((accountHistory: AccountHistoryResponse) => Promise.resolve(accountHistory))
        .catch((err) => Promise.reject(err));
