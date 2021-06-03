import {FrontiersResponse} from '@dev-ptera/nano-node-rpc';
import {NANO_CLIENT} from '../../config';

export const getFrontiers = async (count: number): Promise<FrontiersResponse> =>
    NANO_CLIENT.frontiers('ban_1111111111111111111111111111111111111111111111111111hifc8npp', count)
        .then((response: FrontiersResponse) => Promise.resolve(response))
        .catch((err) => Promise.reject(err));
