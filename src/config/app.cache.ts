import { AccountBalanceDto, PriceDataDto, RepresentativesResponseDto } from '../types';
import { AccountDistributionStatsDto } from '../types/dto/AccountDistributionStatsDto';

export type AppCache = {
    priceData: PriceDataDto;
    representatives: RepresentativesResponseDto;
    accountDistributionStats: AccountDistributionStatsDto;
    richList: AccountBalanceDto[];
};

export const AppCache: AppCache = {
    priceData: undefined,
    representatives: undefined,
    accountDistributionStats: undefined,
    richList: [],
};
