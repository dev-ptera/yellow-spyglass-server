import { Ping, RepresentativeDto, RepresentativesResponseDto } from '@app/types';
import { AppCache, NANO_CLIENT } from '@app/config';
import { formatError, getMonitoredRepsService, writeRepStatistics} from '@app/services';
import * as RPC from '@dev-ptera/nano-node-rpc';
import { rawToBan } from 'banano-unit-converter';
import { ConfirmationQuorumResponse } from '@dev-ptera/nano-node-rpc';

const { performance } = require('perf_hooks');
const MIN_WEIGHT_TO_BE_COUNTED = 100000;
const OFFLINE_AFTER_PINGS = 4;

/** Given a list of pings, where 1 represents ONLINE and 0 represents OFFLINE, returns online percentage. */
const calculateUptimePercentage = (pings: Ping[]): number => {
    let onlinePings = 0;
    for (const ping of pings) {
        if (ping === 1) {
            onlinePings++;
        }
    }
    return Number(((onlinePings / pings.length) * 100).toFixed(1));
};

/** Using the AppCache, will mark a rep as offline if it has been unresponsive for [OFFLINE_AFTER_PINGS] pings. */
export const isRepOnline = (repAddress: string): boolean =>
    AppCache.repPings.map.get(repAddress) !== undefined &&
    AppCache.repPings.map.get(repAddress) !== 0 &&
    AppCache.repPings.map.get(repAddress) + OFFLINE_AFTER_PINGS >= AppCache.repPings.currPing;

/** Iterates through weighted reps to populate delegators count. */
export const populateDelegatorsCount = async (
    reps: Map<string, Partial<{ delegatorsCount: number }>>
): Promise<void> => {
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

/**
 * Gets the top 100 representatives & filters out smaller ones.
 * Then to the remaining, adds delegator count, marks each as online/offline, and stores ping data in firestore.
 */
const getAllRepresentatives = async (): Promise<RepresentativeDto[]> => {
    const rpcData = await NANO_CLIENT.representatives(100, true);
    const trackedReps = new Map<string, Partial<RepresentativeDto>>();

    // Add all reps with high-enough delegated weight to a map.
    for (const address in rpcData.representatives) {
        const raw = rpcData.representatives[address];
        const weight = Math.round(Number(rawToBan(raw)));
        if (weight >= MIN_WEIGHT_TO_BE_COUNTED) {
            trackedReps.set(address, { weight });
        } else {
            break;
        }
    }

    // Adds delegatorsCount to each weightedRep.
    await populateDelegatorsCount(trackedReps);

    // Get all online reps from nano rpc.
    // The `representatives_online` RPC call is unreliable, so I mark reps as offline if they have been offline for OFFLINE_AFTER_PINGS pings.
    const onlineReps = (await NANO_CLIENT.representatives_online().catch((err) =>
        Promise.reject(formatError('getRepresentativesApi.representatives_online', err))
    )) as RPC.RepresentativesOnlineResponse;

    // Update online pings
    AppCache.onlineReps.clear();
    AppCache.repPings.currPing++;
    for (const address of onlineReps.representatives) {
        // Use nano rpc results to add online/offline status to untracked reps.
        AppCache.onlineReps.add(address);
        AppCache.repPings.map.set(address, AppCache.repPings.currPing);
    }

    // Use the AppCache to mark trackedReps as online or offline.
    for (const address of trackedReps.keys()) {
        const rep = trackedReps.get(address);
        rep.online = isRepOnline(address);
        // Update onlinReps cache results to match trackedReps cache results.
        rep.online ? AppCache.onlineReps.add(rep.address) : AppCache.onlineReps.delete(rep.address);
    }

    // Save representative online/offline status in local database
    for (const address of trackedReps.keys()) {
        await writeRepStatistics(address, trackedReps.get(address).online);
    }

    // Construct response array
    const reps: RepresentativeDto[] = [];
    for (const address of trackedReps.keys()) {
        const rep = trackedReps.get(address);
        const fsPings = AppCache.dbRepPings.get(address);

        reps.push({
            address,
            weight: rep.weight,
            online: Boolean(rep.online),
            delegatorsCount: rep.delegatorsCount,
            uptimePercentDay: calculateUptimePercentage(fsPings.day),
            uptimePercentWeek: calculateUptimePercentage(fsPings.week),
            uptimePercentMonth: calculateUptimePercentage(fsPings.month),
            uptimePercentSemiAnnual: calculateUptimePercentage(fsPings.semiAnnual),
            uptimePercentYear: calculateUptimePercentage(fsPings.year),
        });
    }
    return reps;
};

/** Get online voting weight (BAN) */
const getOnlineWeight = (): Promise<number> =>
    NANO_CLIENT.confirmation_quorum()
        .then((quorumResponse: ConfirmationQuorumResponse) =>
            Promise.resolve(Number(rawToBan(quorumResponse.online_stake_total)))
        )
        .catch((err) => Promise.reject(formatError('getRepresentativesService.getOnlineWeight', err)));

/** Representatives Promise aggregate; makes the all required to populate the rep data in AppCache. */
const getRepresentativesDto = (): Promise<RepresentativesResponseDto> =>
    Promise.all([getAllRepresentatives(), getMonitoredRepsService(), getOnlineWeight()])
        .then((data) => {
            const response = {
                thresholdReps: data[0],
                monitoredReps: data[1],
                onlineWeight: data[2],
            };
            return Promise.resolve(response);
        })
        .catch((err) => Promise.reject(formatError('getRepresentativesService', err)));

/** This is called to update the representatives list in the AppCache */
export const cacheRepresentatives = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const t0 = performance.now();
        console.log('[INFO]: Refreshing Representatives');
        getRepresentativesDto()
            .then((data: RepresentativesResponseDto) => {
                const t1 = performance.now();
                console.log(`[INFO]: Representatives Updated, took ${Math.round(t1 - t0)}ms`);
                AppCache.trackedReps = data;
                resolve();
            })
            .catch((err) => {
                console.error(`[ERROR]: Could not reload representatives`);
                reject(err);
            });
    });
};
