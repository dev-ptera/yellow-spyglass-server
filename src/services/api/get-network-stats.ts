import { BasicRepDetails, NetworkStats, Quorum, Supply } from '../../types';
import { getQuorum, getRepresentatives, getSupply } from '../../rpc';
import { calcConsensusStats, calcDistributionStats, calcNakamotoCoefficient } from './network-calculations';
import { AppCache } from '../../config/app.cache';
import { logError } from '../error.service';

export const reloadNetworkStats = async (): Promise<NetworkStats> => {
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
            logError(err);
            return Promise.reject(err);
        });

    return Promise.resolve(AppCache.networkStats);
};
