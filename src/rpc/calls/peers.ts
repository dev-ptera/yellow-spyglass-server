import { PeersResponse, PeersResponseDetails} from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../../config';

export type Peers = PeersResponse<PeersResponseDetails>;

export const getPeersRpc = async (): Promise<Peers> =>
    NANO_CLIENT.peers<PeersResponseDetails>(true)
        .then((peers: Peers) => Promise.resolve(peers))
        .catch((err) => Promise.reject(err));
