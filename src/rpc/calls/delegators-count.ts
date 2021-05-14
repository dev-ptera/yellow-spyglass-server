import { DelegatorsCountResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../../config';

export const getDelegatorsCount = async (address): Promise<DelegatorsCountResponse> =>
    NANO_CLIENT.delegators_count(address)
        .then((delegatorsCountResponse: DelegatorsCountResponse) => Promise.resolve(delegatorsCountResponse))
        .catch((err) => Promise.reject(err));
