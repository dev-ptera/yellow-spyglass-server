import * as RPC from '@dev-ptera/nano-node-rpc';
import { AppCache, NANO_CLIENT } from '@app/config';
import { rawToBan } from 'banano-unit-converter';
import { BasicRepDetails } from '@app/types';
import { LOG_ERR } from '@app/services';

const MIN_WEIGHT_TO_BE_COUNTED = 1000;

/**
 * Filters out reps with a lower balance, adds flag if rep is online.
 */
const processNodeResponse = async (data: RPC.RepresentativesResponse): Promise<BasicRepDetails[]> => {
    const weightedReps = new Map<string, { weight: number; online: boolean }>();
    const reps: BasicRepDetails[] = [];

    // Add all reps with high-enough delegated weight to a map.
    for (const address in data.representatives) {
        const raw = data.representatives[address];
        const weight = Math.round(Number(rawToBan(raw)));

        if (weight >= MIN_WEIGHT_TO_BE_COUNTED) {
            weightedReps.set(address, { weight, online: false });
        } else {
            break;
        }
    }

    // Get all online reps from nano rpc.
    // The `representatives_online` RPC call is unreliable, so I mark reps as offline if they have been offline for OFFLINE_AFTER_PINGS pings.
    const onlineReps = (await NANO_CLIENT.representatives_online().catch((err) =>
        Promise.reject(LOG_ERR('representatives_online', err))
    )) as RPC.RepresentativesOnlineResponse;

    for (const address of AppCache.onlineReps.size === 0 ? onlineReps.representatives : AppCache.onlineReps.values()) {
        const rep = weightedReps.get(address);
        if (rep) {
            rep.online = true;
        }
    }

    // Construct response array
    for (const address of weightedReps.keys()) {
        reps.push({
            address,
            votingWeight: weightedReps.get(address).weight,
            online: weightedReps.get(address).online,
        });
    }
    return reps;
};

/** Gets a large amount of representatives so we can aggregate online voting weight stats. */
export const getRepresentatives = (): Promise<BasicRepDetails[]> =>
    NANO_CLIENT.representatives(1000, true)
        .then(processNodeResponse)
        .then((reps) => Promise.resolve(reps))
        .catch((err) => Promise.reject(err));
