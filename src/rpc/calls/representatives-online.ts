import { RepresentativesOnlineResponse} from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../../config';

export const getRepresentativesOnlineRpc = async (): Promise<RepresentativesOnlineResponse> =>
    NANO_CLIENT.representatives_online()
        .then((reps: RepresentativesOnlineResponse) => Promise.resolve(reps))
        .catch((err) => Promise.reject(err));
