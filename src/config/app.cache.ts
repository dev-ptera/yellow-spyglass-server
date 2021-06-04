import { RepresentativesResponseDto } from '../types';
import { AccountDistributionStats } from '../types/dto/AccountDistributionStats';

export type AppCache = {
    representatives: RepresentativesResponseDto;
    accountDistributionStats: AccountDistributionStats;
    richList: string[];
};

export const AppCache: AppCache = {
    representatives: undefined,
    accountDistributionStats: undefined,
    richList: [],
};
