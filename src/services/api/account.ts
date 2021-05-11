import { getAccountHistory } from '../../rpc';
import { formatError, logError } from '../error.service';
import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';

/* http://localhost:3000/account?address=ban_14ikk8br4uy47fiug31q3th9kephty9dhhbxkpdkp3kgfxuopa7g98dmzrm&offset=0 */
export const getAccount = async (req, res): Promise<void> => {
    const address = req.query.address;
    const offset = req.query.offset;
    getAccountHistory(address, offset)
        .then((accountHistory: AccountHistoryResponse) => {
            res.send({ accountHistory });
        })
        .catch((err) => {
            res.status(500).send(formatError('getAccount', err, { address, offset }));
        });
};
