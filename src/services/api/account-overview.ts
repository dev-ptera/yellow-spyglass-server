import { formatError } from '../error.service';
import {getAccountInfo, getDelegatorsCount, getAccountsPending, getAccountBalance} from '../../rpc';
import {
    AccountBalanceResponse,
    AccountInfoResponse,
    AccountsPendingResponse,
    DelegatorsCountResponse,
    ErrorResponse,
} from '@dev-ptera/nano-node-rpc';
import { AccountOverview } from '../../types';
import { getUnopenedAccount } from '../account-utils';

export const getAccountOverview = async (req, res): Promise<void> => {
    const address = req.query.address;

    const accountBalancePromise: Promise<AccountBalanceResponse> = getAccountBalance(address)
        .then((accountInfo: AccountBalanceResponse) => {
            return Promise.resolve(accountInfo);
        })
        .catch((err) => {
            return Promise.reject(formatError('getAccountBalance', err, { address }));
        });

    const accountInfoPromise: Promise<AccountInfoResponse> = getAccountInfo(address)
        .then((accountInfo: AccountInfoResponse) => {
            return Promise.resolve(accountInfo);
        })
        .catch((err: ErrorResponse) => {
            if (err.error && err.error === 'Account not found') {
                return Promise.resolve(getUnopenedAccount());
            } else {
                return Promise.reject(formatError('getAccountInfo', err, { address }));
            }
        });

    const accountPendingPromise: Promise<number> = getAccountsPending([address], false)
        .then((accountsPendingResponse: AccountsPendingResponse) => {
            const pendingHashes = accountsPendingResponse.blocks[address] as string[];
            return Promise.resolve(pendingHashes.length);
        })
        .catch((err) => {
            return Promise.reject(formatError('getAccountsPending', err, { address, source: false }));
        });

    const delegatorsCountPromise: Promise<DelegatorsCountResponse> = getDelegatorsCount(address)
        .then((delegatorsCountResponse: DelegatorsCountResponse) => {
            return Promise.resolve(delegatorsCountResponse);
        })
        .catch((err) => {
            return Promise.reject(formatError('getDelegatorsCount', err, { address }));
        });

    Promise.all([accountBalancePromise, accountInfoPromise, accountPendingPromise, delegatorsCountPromise])
        .then(([accountBalance, accountInfo, pendingCount, delegators]) => {
            const accountOverview: AccountOverview = {
                address,
                opened: Boolean(accountInfo.open_block),
                balanceRaw: accountBalance.balance,
                pendingRaw: accountBalance.pending,
                representative: accountInfo.representative,
                completedTxCount: accountInfo.block_count,
                pendingTxCount: pendingCount,
                delegatorsCount: delegators.count,
            };
            res.send({ accountOverview });
        })
        .catch((err) => {
            res.status(500).send(formatError('getAccountOverview', err));
        });
};
