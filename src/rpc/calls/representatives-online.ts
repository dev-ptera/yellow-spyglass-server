import { RepresentativesOnlineWeightResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../../config';

export const getRepresentativesOnlineRpc = async (): Promise<RepresentativesOnlineWeightResponse> =>
    NANO_CLIENT.representatives_online(true)
        .then((reps: RepresentativesOnlineWeightResponse) => Promise.resolve(reps))
        .catch((err) => Promise.reject(err));
