export type QuorumDto = {
    quorumDelta: number;
    onlineWeightQuorumPercent: number;
    onlineWeightMinimum: number;
    onlineStakeTotal: number;
    peersStakeTotal: number;
};

export type SpyglassAPIQuorumDto = {
    noRepPercent: number;
    noRepWeight: number;
    nonBurnedWeight: number;
    offlinePercent: number;
    offlineWeight: number;
    onlinePercent: number;
    onlineWeight: number;
    onlineWeightMinimum: number;
    onlineWeightQuorumPercent: number;
    peersStakeWeight: number;
    quorumDelta: number;
};
