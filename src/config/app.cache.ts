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
    representatives: RepresentativesResponseDto;

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
    historicHash: Map<string, string>;

    /** This object matches the firestore collection for representative pings. */
    firestoreRepPings: RepPingMap;
};

export const AppCache: AppCache = {
    priceData: undefined,
    representatives: undefined,
    repPings: {
        currPing: 0,
        map: new Map<string, number>(),
    },
    accountDistributionStats: undefined,
    knownAccounts: [],
    richList: [],
    historicHash: new Map<string, string>(),
    firestoreRepPings: new Map<string, RepPingMapData>(),
};
