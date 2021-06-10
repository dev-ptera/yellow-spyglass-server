import { AccountBalance, PriceData, RepresentativesResponseDto } from '../types';
import { AccountDistributionStats } from '../types/dto/AccountDistributionStats';

export type AppCache = {
    priceData: PriceData;
    representatives: RepresentativesResponseDto;
    accountDistributionStats: AccountDistributionStats;
    richList: AccountBalance[];
};

export const AppCache: AppCache = {
    priceData: undefined,
    representatives: undefined,
    accountDistributionStats: undefined,
    richList: [],
};
