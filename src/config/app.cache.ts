import { AccountDistributionStatsDto, AccountBalanceDto, PriceDataDto, RepresentativesResponseDto } from '@app/types';

export type AppCache = {
    priceData: PriceDataDto;
    representatives: RepresentativesResponseDto;
    accountDistributionStats: AccountDistributionStatsDto;
    richList: AccountBalanceDto[];
    historicHash: Map<string, string>;
};

export const AppCache: AppCache = {
    priceData: undefined,
    representatives: undefined,
    accountDistributionStats: undefined,
    richList: [],
    historicHash: new Map<string, string>(),
};
