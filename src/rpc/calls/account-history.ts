import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../../config';

export const getAccountHistoryRpc = async (address, offset, size): Promise<AccountHistoryResponse> =>
    NANO_CLIENT.account_history(address, size, {
        offset,
        raw: true,
    })
        .then((accountHistory: AccountHistoryResponse) => Promise.resolve(accountHistory))
        .catch((err) => Promise.reject(err));
