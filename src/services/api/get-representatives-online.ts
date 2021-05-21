import { getRepresentativesOnlineRpc } from '../../rpc/calls/representatives-online';
import { formatError } from '../error.service';
import { RepresentativesOnlineResponse } from '@dev-ptera/nano-node-rpc';
import { RepresentativesOnlineDto } from '../../types';

export const getRepresentativesOnlineApi = async (req, res): Promise<void> => {
    getRepresentativesOnlineRpc()
        .then((reps: RepresentativesOnlineResponse) => {
            res.send(JSON.stringify(reps.representatives as RepresentativesOnlineDto));
        })
        .catch((err) => {
            res.status(500).send(formatError('getRepresentativesOnlineApi', err));
        });
};
