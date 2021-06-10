import { formatError } from '../error.service';
import { getAccountHistoryRpc } from '../../rpc';
import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';
import { ConfirmedTransactionDto, SUBTYPE } from '../../types';

const confirmedTransactionsPromise = (address: string, offset: number): Promise<ConfirmedTransactionDto[]> =>
    getAccountHistoryRpc(address, offset, -1)
        .then((accountHistory: AccountHistoryResponse) => {
            const dtoTransactions: ConfirmedTransactionDto[] = [];
            for (const transaction of accountHistory.history) {
                // TODO: Update typing for 'raw = true' option
                const newRepresentative =
                    transaction['subtype'] === SUBTYPE.change ? transaction['representative'] : undefined;

                dtoTransactions.push({
                    hash: transaction.hash,
                    address: transaction.account,
                    type: transaction['subtype'],
                    balanceRaw: transaction.amount,
                    height: Number(transaction.height),
                    timestamp: Number(transaction.local_timestamp),
                    newRepresentative,
                });
            }
            return Promise.resolve(dtoTransactions);
        })
        .catch((err) => {
            return Promise.reject(formatError('getConfirmedTransactions', err, { address }));
        });

export const getAccountInsights = async (req, res): Promise<void> => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 1];

    confirmedTransactionsPromise(address, -1)
        .then((confirmedTx: ConfirmedTransactionDto[]) => {
            res.send(JSON.stringify(confirmedTx));
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
