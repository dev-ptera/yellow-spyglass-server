import { getAccountHistoryRpc } from '../../rpc';
import { formatError } from '../error.service';
import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';
import { SUBTYPE } from '../../types/model/Subtype';
import { ConfirmedTransactionDto } from '../../types';

export const confirmedTransactionsPromise = (
    address: string,
    offset: number,
    size: number
): Promise<ConfirmedTransactionDto[]> =>
    getAccountHistoryRpc(address, offset, size)
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

export const getConfirmedTransactions = async (req, res): Promise<void> => {
    const address = req.query.address;
    const size = Math.min(req.query.size || 50, 50);
    const offset = req.query.offset;

    confirmedTransactionsPromise(address, offset, size)
        .then((confirmedTx: ConfirmedTransactionDto[]) => {
            res.send(JSON.stringify(confirmedTx));
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
