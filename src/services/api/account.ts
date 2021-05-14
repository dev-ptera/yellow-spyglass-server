import { getAccountHistory } from '../../rpc';
import { formatError } from '../error.service';
import { AccountHistoryResponse, AccountInfoResponse } from '@dev-ptera/nano-node-rpc';
import { getAccountInfo } from '../../rpc/calls/account-info';

/* http://localhost:3000/account?address=ban_14ikk8br4uy47fiug31q3th9kephty9dhhbxkpdkp3kgfxuopa7g98dmzrm&offset=0 */
export const getAccount = async (req, res): Promise<void> => {
    const address = req.query.address;
    const offset = req.query.offset;

    const accountHistoryPromise = getAccountHistory(address, offset)
        .then((accountHistory: AccountHistoryResponse) => {
            return Promise.resolve(accountHistory);
        })
        .catch((err) => {
            return Promise.reject(formatError('getAccountHistory', err, { address, offset }));
        });

    const accountInfoPromise = getAccountInfo(address)
        .then((accountInfo: AccountInfoResponse) => {
            return Promise.resolve(accountInfo);
        })
        .catch((err) => {
            return Promise.reject(formatError('getAccountInfo', err, { address }));
        });

    Promise.all([accountHistoryPromise, accountInfoPromise])
        .then(([accountHistory, accountInfo]) => {
            res.send({ accountHistory, accountInfo });
        })
        .catch((err) => {
            res.status(500).send(formatError('getAccount', err));
        });
};
