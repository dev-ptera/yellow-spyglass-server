import { BasicRepDetails, ConsensusStatsDto, DistributionStatsDto, Quorum, Supply } from '@app/types';

const officialRepresentatives = new Set<string>()
    .add('ban_1fomoz167m7o38gw4rzt7hz67oq6itejpt4yocrfywujbpatd711cjew8gjj')
    .add('ban_1ka1ium4pfue3uxtntqsrib8mumxgazsjf58gidh1xeo5te3whsq8z476goo')
    .add('ban_1bananobh5rat99qfgt1ptpieie5swmoth87thi74qgbfrij7dcgjiij94xr')
    .add('ban_1cake36ua5aqcq1c5i3dg7k8xtosw7r9r7qbbf5j15sk75csp9okesz87nfn');

const _isOfficialRep = (addr: string): boolean => officialRepresentatives.has(addr);

export const calcDistributionStats = (supply: Supply): DistributionStatsDto => ({
    maxSupplyTotal: supply.total,
    circulatingTotal: supply.circulating,
    devFundTotal: supply.devFund,
    burnedTotal: supply.burned,
    circulatingPercent: supply.circulating / supply.total,
    devFundPercent: supply.devFund / supply.total,
});

export const calcConsensusStats = (reps: BasicRepDetails[], supply: Supply, quorum: Quorum): ConsensusStatsDto => {
    const allReps = {
        onlineTotal: quorum.onlineStakeTotal,
        onlinePercent: quorum.onlineStakeTotal / supply.total,
        offlineTotal: supply.total - quorum.onlineStakeTotal,
        offlinePercent: (supply.total - quorum.onlineStakeTotal) / supply.total,
    };
    let officialOnlineWeight = 0;
    let officialOfflineWeight = 0;
    let unofficialOfflineWeight = 0;
    for (const rep of reps) {
        if (_isOfficialRep(rep.address)) {
            rep.online ? (officialOnlineWeight += rep.votingWeight) : (officialOfflineWeight += rep.votingWeight);
        } else {
            if (!rep.online) {
                unofficialOfflineWeight += rep.votingWeight;
            }
        }
    }
    const official = {
        onlineTotal: officialOnlineWeight,
        onlinePercent: officialOnlineWeight / supply.total,
        offlineTotal: officialOfflineWeight,
        offlinePercent: officialOfflineWeight / supply.total,
    };
    const unofficial = {
        onlineTotal: quorum.onlineStakeTotal - officialOnlineWeight - officialOfflineWeight,
        onlinePercent: (quorum.onlineStakeTotal - (officialOnlineWeight + officialOfflineWeight)) / supply.total,
        offlineTotal: unofficialOfflineWeight,
        offlinePercent: unofficialOfflineWeight / supply.total,
    };
    const noRep = {
        total:
            supply.total -
            official.onlineTotal -
            official.offlineTotal -
            unofficial.offlineTotal -
            unofficial.onlineTotal,
        percent:
            1 - official.onlinePercent - official.offlinePercent - unofficial.onlinePercent - unofficial.offlinePercent,
    };

    return {
        allReps,
        official,
        unofficial,
        noRep,
    };
};

export const calcNakamotoCoefficient = (
    reps: BasicRepDetails[],
    quorum: Quorum,
    consensus: ConsensusStatsDto
): {
    coefficient: number;
    repWeights: number[];
} => {
    const unofficialWeights: number[] = [];
    const officialWeightSum = consensus.official.onlineTotal + consensus.official.offlineTotal;
    for (const rep of reps) {
        if (!_isOfficialRep(rep.address)) {
            unofficialWeights.push(rep.votingWeight);
        }
    }

    const weights = Array.of(officialWeightSum, ...unofficialWeights);
    weights.sort((a, b) => (a > b ? -1 : b > a ? 1 : 0));

    let total = 0;
    let coefficient = 1;
    let repWeights = [];
    const MAX_BREAKPOINTS = 15;
    let i = 0;
    for (const weight of weights) {
        i++;
        total += weight;
        repWeights.push(weight);
        if (i > MAX_BREAKPOINTS) {
            break;
        }
        if (total < quorum.quorumDelta) {
            coefficient++;
        }
    }
    return {
        coefficient,
        repWeights,
    };
};
