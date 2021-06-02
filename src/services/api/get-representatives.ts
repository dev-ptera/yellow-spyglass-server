import { RepresentativeDto } from '../../types/dto/RepresentativeDto';
import { AppCache, NANO_CLIENT } from '../../config';
import { formatError } from '../error.service';
import * as RPC from '@dev-ptera/nano-node-rpc';
import { rawToBan } from 'banano-unit-converter';
import { RepresentativesResponseDto } from '../../types';
import { getMonitoredRepsService } from './get-monitored-reps';
import { ConfirmationQuorumResponse } from '@dev-ptera/nano-node-rpc';

const MIN_WEIGHT_TO_BE_COUNTED = 100000;

// Iterate through weighted reps to populate delegators count
export const populateDelegatorsCount = async (reps: Map<string, Partial<{ delegatorsCount: number }>>) => {
    const delegatorCountPromises: Promise<{ address: string; delegatorsCount: number }>[] = [];
    for (const address of reps.keys()) {
        delegatorCountPromises.push(
            NANO_CLIENT.delegators_count(address)
                .then((data: RPC.DelegatorsCountResponse) =>
                    Promise.resolve({
                        address,
                        delegatorsCount: Number(data.count),
                    })
                )
                .catch((err) => {
                    formatError('getRepresentativesApi.delegators_count', err, { address });
                    return Promise.resolve({
                        address,
                        delegatorsCount: 0,
                    });
                })
        );
    }
    await Promise.all(delegatorCountPromises).then((data) => {
        data.map((pair) => (reps.get(pair.address).delegatorsCount = Number(pair.delegatorsCount)));
    });
};

const getAllRepresentatives = async (): Promise<RepresentativeDto[]> => {
    const rpcData = await NANO_CLIENT.representatives(100, true);
    const weightedReps = new Map<string, Partial<RepresentativeDto>>();
    const reps: RepresentativeDto[] = [];

    // Add all reps with high-enough delegated weight to a map.
    for (const address in rpcData.representatives) {
        const raw = rpcData.representatives[address];
        const weight = Math.round(Number(rawToBan(raw)));
        if (weight >= MIN_WEIGHT_TO_BE_COUNTED) {
            weightedReps.set(address, { weight });
        } else {
            break;
        }
    }

    await populateDelegatorsCount(weightedReps);

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
        const rep = weightedReps.get(address);
        reps.push({
            address,
            weight: rep.weight,
            online: Boolean(rep.online),
            delegatorsCount: rep.delegatorsCount,
        });
    }
    return reps;
};

export const getOnlineWeight = (): Promise<number> =>
    NANO_CLIENT.confirmation_quorum()
        .then((quorumResponse: ConfirmationQuorumResponse) =>
            Promise.resolve(Number(rawToBan(quorumResponse.online_stake_total)))
        )
        .catch((err) => Promise.reject(formatError('getRepresentativesService.getOnlineWeight', err)));

const getRepresentativesDto = () =>
    Promise.all([getAllRepresentatives(), getMonitoredRepsService(), getOnlineWeight()])
        .then((data) => {
            const response: RepresentativesResponseDto = {
                representatives: data[0],
                monitoredReps: data[1],
                onlineWeight: data[2],
            };
            return Promise.resolve(response);
        })
        .catch((err) => Promise.reject(formatError('getRepresentativesService', err)));

export const getRepresentativesService = (req, res): void => {
    getRepresentativesDto().then((data: RepresentativesResponseDto) => {
        res.send(JSON.stringify(data));
    });
};

export const cacheRepresentatives = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        getRepresentativesDto()
            .then((data) => {
                AppCache.representatives = data;
                resolve();
            })
            .catch((err) => {
                console.error('Could not reload representatives');
                reject(err);
            });
    });
};
