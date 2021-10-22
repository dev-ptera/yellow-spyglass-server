import { MonitoredRepDto, RepresentativeDto } from '@app/types';
import { AppCache, NANO_CLIENT } from '@app/config';
import { calculateUptimeStatistics, isRepOnline, LOG_ERR, LOG_INFO, writeRepStatistics } from '@app/services';
import * as RPC from '@dev-ptera/nano-node-rpc';
import { rawToBan } from 'banano-unit-converter';
import { isRepPrincipal, sortRepByWeight } from './rep-utils';

const MIN_WEIGHT_TO_BE_COUNTED = 100000;

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
export const getLargeReps = async (monitoredReps: MonitoredRepDto[]): Promise<RepresentativeDto[]> => {
    const start = LOG_INFO('Refreshing Large Reps');
    const rpcData = await NANO_CLIENT.representatives(150, true);
    const largeRepMap = new Map<string, Partial<RepresentativeDto>>();

    // Include large, non-PR reps from the monitored reps list. #v22
    for (const rep of monitoredReps) {
        if (!isRepPrincipal(rep.weight) && isRepOnline(rep.address) && rep.weight >= MIN_WEIGHT_TO_BE_COUNTED) {
            largeRepMap.set(rep.address, { weight: rep.weight });
        }
    }

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
            principal: isRepPrincipal(rep.weight),
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

    LOG_INFO('Large Reps Updated', start);
    return sortRepByWeight(largeReps);
};
