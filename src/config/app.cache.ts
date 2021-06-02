import { RepresentativesResponseDto } from '../types';

export type AppCache = {
    representatives: RepresentativesResponseDto;
};

export const AppCache: AppCache = {
    representatives: undefined,
};
