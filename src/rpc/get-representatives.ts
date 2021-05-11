import { BasicRepDetails } from '../types';
import * as RPC from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '../config';

const MIN_WEIGHT_TO_BE_COUNTED = 5000;

/**
 * Filters out reps with a lower balance, adds flag if rep is online.=
 */
const processNodeResponse = async (data: RPC.RepresentativesResponse): Promise<BasicRepDetails[]> => {
    const weightedReps = new Map<string, { weight: number; online: boolean }>();
    const reps: BasicRepDetails[] = [];

    // Add all reps with high-enough delegated weight to a map.
    for (const address in data.representatives) {
        const raw = data.representatives[address];
        const weight = await NANO_CLIENT.mrai_from_raw(raw)
            .then((data: RPC.UnitConversionResponse) => Promise.resolve(Number(data.amount)))
            .catch((err) => Promise.reject(err));

        if (weight >= MIN_WEIGHT_TO_BE_COUNTED) {
            weightedReps.set(address, { weight, online: false });
        } else {
            break;
        }
    }

    // Get all online reps & mark which reps are online.
    await NANO_CLIENT.representatives_online()
        .then((onlineReps: RPC.RepresentativesOnlineResponse) => {
            for (const address of onlineReps.representatives) {
                const rep = weightedReps.get(address);
                if (rep) {
                    rep.online = true;
                }
            }
        })
        .catch((err) => Promise.reject(err));

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

export const getRepresentatives = (): Promise<BasicRepDetails[]> =>
    NANO_CLIENT.representatives(500, true)
        .then(processNodeResponse)
        .then((reps) => Promise.resolve(reps))
        .catch((err) => Promise.reject(err));
