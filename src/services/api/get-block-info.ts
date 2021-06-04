import { getBlocksInfoRpc } from '../../rpc/calls/blocks-info';
import { BlocksInfoResponse, BlocksInfoResponseContents } from '@dev-ptera/nano-node-rpc';
import { formatError } from '../error.service';
import {Block} from "../../types";

export const blocksInfoPromise = (blocks: string[]): Promise<BlocksInfoResponse> =>
    getBlocksInfoRpc(blocks)
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
                    timestamp: Number(block.local_timestamp),
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
                } as Block)
            );
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
