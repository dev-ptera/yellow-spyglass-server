import { SupplyDto } from './SupplyDto';
import { SpyglassAPIQuorumDto } from './QuorumDto';
import { PeerVersionsDto } from './PeerVersionsDto';

export type NetworkStatsDto = {
    supply: SupplyDto;
    nakamotoCoefficient: number;
    peerVersions: PeerVersionsDto[];
    spyglassQuorum: SpyglassAPIQuorumDto;
    principalRepMinBan: number;
    /** This value is populated whenever the account distribution metrics are updated. */
    openedAccounts: number;
};
