import { ConsensusStats } from './ConsensusStats';
import { DistributionStats } from './DistributionStats';
import { Quorum } from '../model';

export type NetworkStats = {
    consensus: ConsensusStats;
    distribution: DistributionStats;
    quorum: Quorum;
    nakamotoCoefficient: number;
    repWeights: number[];
};
