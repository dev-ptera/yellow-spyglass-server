import {AccountInfoResponse} from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../../config';
/*
export const getAccountsPending = async (addresses: string[]): Promise<AccountInfoResponse> =>
    NANO_CLIENT.accounts_pending(addresses,
        {
            representative: true,
            pending: true,
            weight: true
    })
        .then((accountInfo: AccountInfoResponse) => Promise.resolve(accountInfo))
        .catch((err) => Promise.reject(err));
*/