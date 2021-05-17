import { DelegatorsResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../../config';

export const getDelegatorsRpc = async (address): Promise<DelegatorsResponse> =>
    NANO_CLIENT.delegators(address)
        .then((delegators: DelegatorsResponse) => Promise.resolve(delegators))
        .catch((err) => Promise.reject(err));
