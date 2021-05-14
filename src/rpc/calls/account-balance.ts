import {AccountBalanceResponse} from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../../config';

export const getAccountBalance = async (address): Promise<AccountBalanceResponse> =>
    NANO_CLIENT.account_balance(address)
        .then((accountBalance: AccountBalanceResponse) => Promise.resolve(accountBalance))
        .catch((err) => Promise.reject(err));
