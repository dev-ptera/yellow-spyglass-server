import { AccountsPendingResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../../config';

export const getAccountsPending = async (addresses: string[]): Promise<AccountsPendingResponse> =>
    NANO_CLIENT.accounts_pending(addresses, -1, {
        source: true,
        include_only_confirmed: true,
    })
        .then((accountInfo: AccountsPendingResponse) => Promise.resolve(accountInfo))
        .catch((err) => Promise.reject(err));
