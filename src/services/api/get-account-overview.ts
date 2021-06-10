import { formatError } from '../error.service';
import { getAccountBalanceRpc, getAccountInfoRpc } from '../../rpc';
import {
    AccountBalanceResponse,
    AccountInfoResponse,
    DelegatorsResponse,
    ErrorResponse,
} from '@dev-ptera/nano-node-rpc';
import { AccountOverviewDto, DelegatorDto } from '../../types';
import { getUnopenedAccount } from '../account-utils';
import { getDelegatorsRpc } from '../../rpc/calls/delegators';
import { confirmedTransactionsPromise } from './get-confirmed-transactions';
import { pendingTransactionsPromise } from './get-pending-transactions';
import { AppCache } from '../../config';

export const getAccountOverview = async (req, res): Promise<void> => {
    const parts = req.url.split('/');
    const size = Math.min(req.query.size || 50, 50);
    const address = parts[parts.length - 1];

    const accountBalancePromise: Promise<AccountBalanceResponse> = getAccountBalanceRpc(address)
        .then((accountInfo: AccountBalanceResponse) => {
            return Promise.resolve(accountInfo);
        })
        .catch((err) => {
            return Promise.reject(formatError('getAccountBalance', err, { address }));
        });

    const accountInfoPromise: Promise<AccountInfoResponse> = getAccountInfoRpc(address)
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

    const delegatorsPromise: Promise<DelegatorDto[]> = getDelegatorsRpc(address)
        .then((delegatorsResponse: DelegatorsResponse) => {
            const delegatorsDto: DelegatorDto[] = [];
            for (const key in delegatorsResponse.delegators) {
                if (delegatorsResponse.delegators[key] !== '0') {
                    delegatorsDto.push({
                        address: key,
                        weightRaw: delegatorsResponse.delegators[key],
                    });
                }
            }
            return Promise.resolve(delegatorsDto);
        })
        .catch((err) => {
            return Promise.reject(formatError('getDelegators', err, { address }));
        });

    const isRepOnline = (accountRep: string): boolean => {
        const repCache = AppCache.representatives?.representatives || [];
        for (const rep of repCache) {
            if (rep.address === accountRep) {
                return rep.online;
            }
        }
        return false;
    };

    Promise.all([
        accountBalancePromise,
        accountInfoPromise,
        delegatorsPromise,
        confirmedTransactionsPromise(address, 0, size),
        pendingTransactionsPromise(address, 0, size),
    ])
        .then(([accountBalance, accountInfo, delegators, confirmedTransactions, pendingTransactions]) => {
            const accountOverview: AccountOverviewDto = {
                address,
                opened: Boolean(accountInfo.open_block),
                balanceRaw: accountBalance.balance,
                pendingRaw: accountBalance.pending,
                representative: accountInfo.representative,
                isRepOnline: isRepOnline(accountInfo.representative),
                completedTxCount: Number(accountInfo.block_count),
                pendingTxCount: Number(pendingTransactions.length),
                delegatorsCount: Number(delegators.length),
                confirmedTransactions,
                pendingTransactions: pendingTransactions.splice(0, 50),
                delegators,
            };
            res.send({ ...accountOverview });
        })
        .catch((err) => {
            res.status(500).send(formatError('getAccountOverview', err));
        });
};
