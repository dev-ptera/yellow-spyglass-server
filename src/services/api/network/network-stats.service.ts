import { AppCache } from '@app/config';
import { LOG_ERR } from '@app/services';
import { BasicRepDetails, NetworkStatsDto, Quorum, Supply } from '@app/types';
import { getRepresentatives } from './get-representatives';
import { getSupply } from './get-supply';
import { getQuorum } from './get-quorum';
import { calcConsensusStats, calcDistributionStats, calcNakamotoCoefficient } from './network-calculations';

/** This is called to update the Network Stats in the AppCache. */
export const cacheNetworkStats = async (): Promise<NetworkStatsDto> => {
    console.log('Refreshing Network Stats');
    await Promise.all([getRepresentatives(), getSupply(), getQuorum()])
        .then((response: [BasicRepDetails[], Supply, Quorum]) => {
            const reps = response[0];
            const supply = response[1];
            const quorum = response[2];
            const distribution = calcDistributionStats(supply);
            const consensus = calcConsensusStats(reps, supply, quorum);
            const nakamotoStats = calcNakamotoCoefficient(reps, quorum, consensus);
            AppCache.networkStats = {
                distribution,
                consensus,
                quorum,
                nakamotoCoefficient: nakamotoStats.coefficient,
                repWeights: nakamotoStats.repWeights,
            };
        })
        .catch((err) => {
            return Promise.reject(LOG_ERR('cacheNetworkStats', err));
        });

    return Promise.resolve(AppCache.networkStats);
};
