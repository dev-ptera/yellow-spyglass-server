import {
    AccountDistributionStatsDto,
    AccountBalanceDto,
    PriceDataDto,
    RepresentativesResponseDto,
    KnownAccountDto,
    RepPingMap,
    RepPingMapData,
} from '@app/types';
import { NetworkStatsDto } from '../types/dto/NetworkStatsDto';

export type AppCache = {
    /** Graph data for BAN distribution. */
    accountDistributionStats: AccountDistributionStatsDto;

    /** This object matches the json collection for representative pings. */
    dbRepPings: RepPingMap;

    /** Populated by a csv of hash -> timestamp pairs. */
    historicHash: Map<string, string>;

    /** BAN accounts with an alias. */
    knownAccounts: KnownAccountDto[];

    networkStats: NetworkStatsDto;

    /** All reps online, regardless of voting weight. */
    onlineReps: Set<string>;

    /** Populated by CoinMarketCap API. */
    priceData: PriceDataDto;

    /** An object used to keep track of whether a representative has fallen offline.
     *  Since the `representatives_online` nano RPC call is unreliable (sometimes it returns far fewer reps than expected),
     *  this object tracks representatives and the last time they were successfully pinged.
     *  If a rep is unreachable for a certain amount of pings, it will be marked as offline. */
    repPings: {
        currPing: number;
        map: Map<string, number>;
    };

    /** Top BANANO holders, sorted by balance. */
    richList: AccountBalanceDto[];

    /** Representatives that either run the node monitor software or have a weight greater than min threshold. */
    trackedReps: RepresentativesResponseDto;
};

export const AppCache: AppCache = {
    accountDistributionStats: undefined,
    dbRepPings: new Map<string, RepPingMapData>(),
    historicHash: new Map<string, string>(),
    knownAccounts: [],
    networkStats: {
        consensus: undefined,
        distribution: undefined,
        quorum: undefined,
        nakamotoCoefficient: undefined,
    },
    onlineReps: new Set<string>(),
    priceData: undefined,
    repPings: {
        currPing: 0,
        map: new Map<string, number>(),
    },
    richList: [],
    trackedReps: undefined,
};
