import { formatError } from '../error.service';
import { getAccountBalance, getAccountInfo, getAccountsPending } from '../../rpc';
import {
    AccountBalanceResponse,
    AccountInfoResponse,
    AccountsPendingResponse,
    DelegatorsResponse,
    ErrorResponse,
} from '@dev-ptera/nano-node-rpc';
import { AccountOverview, Delegator, PendingTransaction} from '../../types';
import { getUnopenedAccount } from '../account-utils';
import { getDelegatorsRpc } from '../../rpc/calls/delegators';
import { confirmedTransactionsPromise } from './confirmed-transactions';

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

    const delegatorsPromise: Promise<Delegator[]> = getDelegatorsRpc(address)
        .then((delegatorsResponse: DelegatorsResponse) => {
            const delegatorsDto: Delegator[] = [];
            for (const key in delegatorsResponse.delegators) {
                if (delegatorsResponse.delegators[key] !== "0") {
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

    const pendingTransactionsPromise = (address: string) =>
        getAccountsPending([address], false)
            .then((accountsPendingResponse: AccountsPendingResponse) => {
                const pendingDto: PendingTransaction[] = [];
                const pendingTxs = accountsPendingResponse.blocks[address];
                for (const hash in pendingTxs) {
                    pendingDto.push({
                        hash,
                        address,
                        balanceRaw: pendingTxs[hash].amount,
                    });
                }
                return Promise.resolve(pendingDto);
            })
            .catch((err) => {
                return Promise.reject(formatError('getAccountsPending', err, { address, source: false }));
            });

    Promise.all([
        accountBalancePromise,
        accountInfoPromise,
        delegatorsPromise,
        confirmedTransactionsPromise(address, 0),
        pendingTransactionsPromise(address),
    ])
        .then(([accountBalance, accountInfo, delegators, confirmedTransactions, pendingTransactions]) => {
            const accountOverview: AccountOverview = {
                address,
                opened: Boolean(accountInfo.open_block),
                balanceRaw: accountBalance.balance,
                pendingRaw: accountBalance.pending,
                representative: accountInfo.representative,
                completedTxCount: Number(accountInfo.block_count),
                pendingTxCount: Number(pendingTransactions.length),
                delegatorsCount: Number(delegators.length),
                confirmedTransactions,
                pendingTransactions,
                delegators,
            };
            res.send({ ...accountOverview });
        })
        .catch((err) => {
            res.status(500).send(formatError('getAccountOverview', err));
        });
};
