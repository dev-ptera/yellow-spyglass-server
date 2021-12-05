import { ConsensusStatsDto } from './ConsensusStatsDto';
import { SupplyDto } from './SupplyDto';
import { QuorumDto, SpyglassAPIQuorumDto } from './QuorumDto';
import { PeerVersionsDto } from './PeerVersionsDto';

export type NetworkStatsDto = {
    consensus: ConsensusStatsDto;
    supply: SupplyDto;
    quorum: QuorumDto;
    nakamotoCoefficient: number;
    peerVersions: PeerVersionsDto[];
    spyglassQuorum: SpyglassAPIQuorumDto;
    principalRepMinBan: number;
    /** This value is populated whenever the account distribution metrics are updated. */
    openedAccounts: number;
};
