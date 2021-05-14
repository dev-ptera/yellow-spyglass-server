import { AccountsPendingResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../../config';

export const getAccountsPending = async (addresses: string[], source: boolean): Promise<AccountsPendingResponse> =>
    NANO_CLIENT.accounts_pending(addresses, -1, {
        source,
    })
        .then((accountInfo: AccountsPendingResponse) => Promise.resolve(accountInfo))
        .catch((err) => Promise.reject(err));
