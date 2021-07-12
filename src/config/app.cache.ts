import {
    AccountDistributionStatsDto,
    AccountBalanceDto,
    PriceDataDto,
    RepresentativesResponseDto,
    KnownAccountDto,
    RepPingMap,
    RepPingMapData,
} from '@app/types';

export type AppCache = {
    priceData: PriceDataDto;
    /** Representatives that either run the node monitor software or have a weight greater than min threshold. */
    trackedReps: RepresentativesResponseDto;
    /** All reps online, regardless of voting weight. */

    onlineReps: Set<string>;

    /** An object used to keep track of whether a representative has fallen offline.
     *  Since the `representatives_online` nano RPC call is unreliable (sometimes it returns far fewer reps than expected),
     *  this object tracks representatives and the last time they were successfully pinged.
     *  If a rep is unreachable for a certain amount of pings, it will be marked as offline. */
    repPings: {
        currPing: number;
        map: Map<string, number>;
    };

    accountDistributionStats: AccountDistributionStatsDto;
    richList: AccountBalanceDto[];
    knownAccounts: KnownAccountDto[];

    /** Populated by a csv of hash -> timestamp pairs. */
    historicHash: Map<string, string>;

    /** This object matches the json collection for representative pings. */
    dbRepPings: RepPingMap;
};

export const AppCache: AppCache = {
    priceData: undefined,
    trackedReps: undefined,
    onlineReps: new Set<string>(),
    repPings: {
        currPing: 0,
        map: new Map<string, number>(),
    },
    accountDistributionStats: undefined,
    knownAccounts: [],
    richList: [],
    historicHash: new Map<string, string>(),
    dbRepPings: new Map<string, RepPingMapData>(),
};
