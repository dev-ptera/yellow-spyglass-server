import { RepresentativeDto, RepresentativesResponseDto } from '@app/types';
import { AppCache, NANO_CLIENT } from '@app/config';
import { LOG_ERR, getMonitoredReps, writeRepStatistics, LOG_INFO, calculateUptimeStatistics } from '@app/services';
import * as RPC from '@dev-ptera/nano-node-rpc';
import { rawToBan } from 'banano-unit-converter';
import { ConfirmationQuorumResponse } from '@dev-ptera/nano-node-rpc';
import { MicroRepresentativeDto } from '@app/types';

const MIN_WEIGHT_TO_BE_COUNTED = 100000;
const OFFLINE_AFTER_PINGS = 4;

/**
 * The `representatives_online` RPC call is unreliable, so I mark reps as offline if they have been offline for OFFLINE_AFTER_PINGS pings.
 */
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
                    LOG_ERR('cacheRepresentatives.delegators_count', err, { address });
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
 * Gets the top 150 representatives & filters out smaller ones.
 * Then to the remaining, adds delegator count, marks each as online/offline, and stores ping data in JSON files.
 */
const getLargeReps = async (): Promise<RepresentativeDto[]> => {
    const rpcData = await NANO_CLIENT.representatives(150, true);
    const largeRepMap = new Map<string, Partial<RepresentativeDto>>();

    // Add all reps with high-enough delegated weight to a map.
    for (const address in rpcData.representatives) {
        const raw = rpcData.representatives[address];
        const weight = Math.round(Number(rawToBan(raw)));
        if (weight >= MIN_WEIGHT_TO_BE_COUNTED) {
            largeRepMap.set(address, { weight });
        } else {
            break;
        }
    }

    // Adds delegatorsCount to each weightedRep.
    await populateDelegatorsCount(largeRepMap);

    // Get all online reps from nano rpc.
    const onlineReps = (await NANO_CLIENT.representatives_online(false)) as RPC.RepresentativesOnlineResponse;

    // Update online pings
    AppCache.repPings.currPing++;
    // The following representatives get to increase their last-known ping since they were included in representatives_online result.
    for (const address of onlineReps.representatives) {
        AppCache.repPings.map.set(address, AppCache.repPings.currPing);
    }

    // Save representative online/offline status in local database
    for (const address of largeRepMap.keys()) {
        const rep = largeRepMap.get(address);
        rep.online = isRepOnline(address);
        await writeRepStatistics(address, rep.online);
    }

    // Construct large rep response dto
    const largeReps: RepresentativeDto[] = [];
    for (const address of largeRepMap.keys()) {
        const rep = largeRepMap.get(address);
        const repPings = AppCache.dbRepPings.get(address);
        const uptimeStats = calculateUptimeStatistics(address, repPings);
        largeReps.push({
            address,
            weight: rep.weight,
            online: Boolean(rep.online),
            delegatorsCount: rep.delegatorsCount,
            principal: rep.weight > AppCache.networkStats.principalRepMinBan,
            uptimePercentDay: uptimeStats.uptimePercentDay,
            uptimePercentWeek: uptimeStats.uptimePercentWeek,
            uptimePercentMonth: uptimeStats.uptimePercentMonth,
            uptimePercentSemiAnnual: uptimeStats.uptimePercentSemiAnnual,
            uptimePercentYear: uptimeStats.uptimePercentYear,
            lastOutage: uptimeStats.lastOutage,
            creationDate: uptimeStats.creationDate,
            creationUnixTimestamp: uptimeStats.creationUnixTimestamp,
        });
    }

    return largeReps;
};

/** Using the representatives_online RPC call, returns any online rep that has < MIN_WEIGHT_TO_BE_COUNTED weight.  */
const getMicroReps = async (): Promise<MicroRepresentativeDto[]> => {
    // Get all online reps from nano rpc, then filter out the larger reps.
    const onlineReps = (await NANO_CLIENT.representatives_online(true)) as RPC.RepresentativesOnlineWeightResponse;
    const microRepMap = new Map<string, Partial<MicroRepresentativeDto>>();
    for (const address in onlineReps.representatives) {
        const weight = Math.round(Number(rawToBan(onlineReps.representatives[address].weight)));
        if (weight < MIN_WEIGHT_TO_BE_COUNTED) {
            microRepMap.set(address, { weight });
        }
    }

    // Adds delegatorsCount to each micro rep.
    await populateDelegatorsCount(microRepMap);

    // Construct micro rep response dto
    const microReps: MicroRepresentativeDto[] = [];
    for (const address of microRepMap.keys()) {
        const rep = microRepMap.get(address);
        microReps.push({
            address,
            weight: rep.weight,
            online: true,
            delegatorsCount: rep.delegatorsCount,
        });
    }

    // Sort by weight, descending
    microReps.sort(function (a, b) {
        return a.weight < b.weight ? 1 : -1;
    });
    return microReps;
};

/** Get online voting weight (BAN) */
const getOnlineWeight = (): Promise<number> =>
    NANO_CLIENT.confirmation_quorum()
        .then((quorumResponse: ConfirmationQuorumResponse) =>
            Promise.resolve(Number(rawToBan(quorumResponse.online_stake_total)))
        )
        .catch((err) => Promise.reject(LOG_ERR('cacheRepresentatives.getOnlineWeight', err)));

/** Representatives Promise aggregate; makes all calls required to populate the rep data in AppCache. */
const getRepresentativesDto = (): Promise<RepresentativesResponseDto> =>
    Promise.all([getLargeReps(), getMonitoredReps(), getOnlineWeight(), getMicroReps()])
        .then(async (data) => {
            const response = {
                thresholdReps: data[0], //aka largeReps
                monitoredReps: data[1],
                onlineWeight: data[2],
                microReps: data[3],
            };
            return Promise.resolve(response);
        })
        .catch((err) => Promise.reject(LOG_ERR('cacheRepresentatives.getRepresentativesDto', err)));

/** This is called to update the representatives list in the AppCache */
export const cacheRepresentatives = async (): Promise<void> => {
    return new Promise((resolve) => {
        const start = LOG_INFO('Refreshing Representatives');
        getRepresentativesDto()
            .then((data: RepresentativesResponseDto) => {
                AppCache.representatives = data;
                resolve(LOG_INFO('Representatives Updated', start));
            })
            .catch((err) => {
                resolve(LOG_ERR('cacheRepresentatives', err));
            });
    });
};
