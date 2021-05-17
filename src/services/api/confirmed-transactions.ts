import { getAccountHistory } from '../../rpc';
import { formatError } from '../error.service';
import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';
import { ConfirmedTransaction } from '../../types/dto/ConfirmedTransaction';
import { SUBTYPE } from '../../types/model/Subtype';

export const confirmedTransactionsPromise = (address: string, offset: number): Promise<ConfirmedTransaction[]> =>
    getAccountHistory(address, offset)
        .then((accountHistory: AccountHistoryResponse) => {
            const dtoTransactions: ConfirmedTransaction[] = [];
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
            return Promise.reject(err);
        });

export const getConfirmedTransactions = async (req, res): Promise<void> => {
    const address = req.query.address;
    const offset = req.query.offset;

    confirmedTransactionsPromise(address, offset)
        .then((confirmedTx: ConfirmedTransaction[]) => {
            res.send(JSON.stringify(confirmedTx));
        })
        .catch((err) => {
            res.status(500).send(formatError('getConfirmedTransactions', err, { address }));
        });
};
