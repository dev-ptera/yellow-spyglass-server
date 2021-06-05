import { AccountRepresentativeResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../../config';

export const getAccountRepresentativeRpc = async (addr: string): Promise<AccountRepresentativeResponse> =>
    NANO_CLIENT.account_representative(addr)
        .then((response: AccountRepresentativeResponse) => Promise.resolve(response))
        .catch((err) => Promise.reject(err));
