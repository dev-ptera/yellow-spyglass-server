import { blocksInfoRpc } from '@app/rpc';
import { formatError } from '@app/services';
import { BlockDto } from '@app/types';
import { AppCache } from '@app/config';
import { BlocksInfoResponse, BlocksInfoResponseContents } from '@dev-ptera/nano-node-rpc';

export const blocksInfoPromise = (blocks: string[]): Promise<BlocksInfoResponse> =>
    blocksInfoRpc(blocks)
        .then((blocks: BlocksInfoResponse) => {
            return Promise.resolve(blocks);
        })
        .catch((err) => {
            return Promise.reject(formatError('blocksInfoPromise', err, { blocks }));
        });

export const getBlockInfo = async (req, res): Promise<void> => {
    const parts = req.url.split('/');
    const hash = parts[parts.length - 1];

    blocksInfoPromise([hash])
        .then((blockInfo: BlocksInfoResponse) => {
            const block = blockInfo.blocks[hash];
            const contents = block.contents as BlocksInfoResponseContents;
            res.send(
                JSON.stringify({
                    blockAccount: block.block_account,
                    amount: block.amount,
                    balance: block.balance,
                    height: Number(block.height),
                    timestamp: Number(AppCache.historicHash.get(hash) || block.local_timestamp),
                    confirmed: block.confirmed,
                    subtype: block.subtype,
                    contents: {
                        type: contents.type,
                        account: contents.account,
                        previous: contents.previous,
                        representative: contents.representative,
                        balance: contents.balance,
                        link: contents.link,
                        linkAsAccount: contents.link_as_account,
                        signature: contents.signature,
                        work: contents.work,
                    },
                } as BlockDto)
            );
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
