import {getBlocksInfoRpc} from '../../rpc/calls/blocks-info';
import {BlocksInfoResponse} from '../../../../nano-node-rpc';
import {formatError} from '../error.service';

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
    const block = parts[parts.length-1];

    blocksInfoPromise([block])
        .then((blockInfo: BlocksInfoResponse) => {
            res.send(JSON.stringify(blockInfo));
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
