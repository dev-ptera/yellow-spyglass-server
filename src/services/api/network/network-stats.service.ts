import { AppCache } from '@app/config';
import {getPeerVersionsPromise, LOG_ERR, LOG_INFO} from '@app/services';
import {BasicRepDetails, PeerVersionsDto, QuorumDto, SupplyDto} from '@app/types';
import { getAllReps } from './get-representatives';
import { getSupplyPromise } from './supply.service';
import { getQuorumPromise } from './quorum.service';
import { calcConsensusStats, calcNakamotoCoefficient } from './network-calculations';

/** This is called to update the Network Stats in the AppCache. */
export const cacheNetworkStats = async (): Promise<void> => {
    const start = LOG_INFO('Refreshing Network Stats');
    return new Promise((resolve) => {
        Promise.all([getAllReps(), getSupplyPromise(), getQuorumPromise(), getPeerVersionsPromise()])
            .then((response: [BasicRepDetails[], SupplyDto, QuorumDto, PeerVersionsDto[]]) => {
                const reps = response[0];
                const supply = response[1];
                const quorum = response[2];
                const peerVersions = response[3];
                const consensus = calcConsensusStats(reps, supply.totalAmount, quorum);
                const nakamotoCoefficient = calcNakamotoCoefficient(reps, quorum, consensus);
                AppCache.networkStats = {
                    supply: supply,
                    consensus,
                    quorum,
                    nakamotoCoefficient,
                    peerVersions
                    // repWeights: nakamotoStats.repWeights,
                };
                resolve(LOG_INFO('Network Stats Updated', start));
            })
            .catch((err) => {
                resolve(LOG_ERR('cacheNetworkStats', err));
            });
    });
};
