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
    repPings: {
        currPing: number;
        map: Map<string, number>;
    };
    accountDistributionStats: AccountDistributionStatsDto;
    richList: AccountBalanceDto[];
    knownAccounts: KnownAccountDto[];
    historicHash: Map<string, string>;
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
