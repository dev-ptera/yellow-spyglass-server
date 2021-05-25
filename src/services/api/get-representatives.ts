import { RepresentativeDto } from '../../types/dto/RepresentativeDto';
import { NANO_CLIENT } from '../../config';
import { formatError } from '../error.service';
import * as RPC from '@dev-ptera/nano-node-rpc';
import {rawToBan} from "banano-unit-converter";

const MIN_WEIGHT_TO_BE_COUNTED = 10000;

/**
 * Filters out reps with a lower balance, adds flag if rep is online.=
 */
const getAllRepresentatives = async (data: RPC.RepresentativesResponse): Promise<RepresentativeDto[]> => {
    const weightedReps = new Map<string, Partial<RepresentativeDto>>();
    const reps: RepresentativeDto[] = [];

    // Add all reps with high-enough delegated weight to a map.
    for (const address in data.representatives) {
        const raw = data.representatives[address];
        const weight = Math.round(Number(rawToBan(raw)));
        if (weight >= MIN_WEIGHT_TO_BE_COUNTED) {
            weightedReps.set(address, { weight });
        } else {
            break;
        }
    }

    // Iterate through weighted reps to populate delegators count
    const delegatorCountPromises: Promise<{ address: string; delegators: number }>[] = [];
    for (const address of weightedReps.keys()) {
        delegatorCountPromises.push(
            NANO_CLIENT.delegators_count(address)
                .then((data: RPC.DelegatorsCountResponse) =>
                    Promise.resolve({
                        address,
                        delegators: Number(data.count),
                    })
                )
                .catch((err) => Promise.reject(formatError('getRepresentativesApi.delegators_count', err, { address })))
        );
    }
    await Promise.all(delegatorCountPromises).then((data) => {
        data.map((pair) => (weightedReps.get(pair.address).delegators = Number(pair.delegators)));
    });

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
        .catch((err) => Promise.reject(formatError('getRepresentativesApi.representatives_online', err)));

    // Construct response array
    for (const address of weightedReps.keys()) {
        reps.push({
            address,
            weight: weightedReps.get(address).weight,
            online: Boolean(weightedReps.get(address).online),
            delegators: weightedReps.get(address).delegators,
        });
    }
    return reps;
};

export const getRepresentativesApi = async (req, res): Promise<RepresentativeDto[]> =>
    NANO_CLIENT.representatives(100, true)
        .then(getAllRepresentatives)
        .then((reps) => {
            res.send(JSON.stringify(reps));
            return Promise.resolve(reps);
        })
        .catch((err) => Promise.reject(err));
