import { getAccountsPendingRpc } from '../../rpc';
import { formatError } from '../error.service';
import { AccountsPendingResponse, BlocksInfoResponse } from '@dev-ptera/nano-node-rpc';
import { PendingTransactionDto } from '../../types';
import { blocksInfoPromise } from './get-block-info';

export const pendingTransactionsPromise = async (address: string, offset: number, size: number) =>
    getAccountsPendingRpc([address])
        .then(async (accountsPendingResponse: AccountsPendingResponse) => {
            const hashes: string[] = [];
            const pendingTxs = accountsPendingResponse.blocks[address];
            let i = 0;
            for (const hash in pendingTxs) {
                if (i >= offset) {
                    hashes.push(hash);
                }
                if (i++ > offset + Math.min(50, size)) {
                    break;
                }
            }
            const dto: PendingTransactionDto[] = [];
            await blocksInfoPromise(hashes)
                .then((blocksResponse: BlocksInfoResponse) => {
                    for (const hash in blocksResponse.blocks) {
                        const block = blocksResponse.blocks[hash];
                        dto.push({
                            address: block.block_account,
                            timestamp: Number(block.local_timestamp),
                            balanceRaw: block.amount,
                            hash,
                        });
                    }
                })
                .catch((err) => {
                    return Promise.reject(err);
                });

            return Promise.resolve(dto);
        })
        .catch((err) => {
            return Promise.reject(formatError('getAccountsPending', err, { address, source: false }));
        });

export const getPendingTransactions = async (req, res): Promise<void> => {
    const address = req.query.address;
    const offset = req.query.offset || 0;
    const size = Math.min(req.query.size || 50, 50);
    pendingTransactionsPromise(address, offset, size)
        .then((confirmedTx: PendingTransactionDto[]) => {
            res.send(JSON.stringify(confirmedTx));
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
