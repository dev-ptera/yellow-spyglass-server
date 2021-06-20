import {
    AccountDistributionStatsDto,
    AccountBalanceDto,
    PriceDataDto,
    RepresentativesResponseDto,
    KnownAccountDto,
} from '@app/types';

export type AppCache = {
    priceData: PriceDataDto;
    representatives: RepresentativesResponseDto;
    accountDistributionStats: AccountDistributionStatsDto;
    richList: AccountBalanceDto[];
    knownAccounts: KnownAccountDto[];
    historicHash: Map<string, string>;
};

export const AppCache: AppCache = {
    priceData: undefined,
    representatives: undefined,
    accountDistributionStats: undefined,
    knownAccounts: [],
    richList: [],
    historicHash: new Map<string, string>(),
};
