import { BasicRepDetails, ConsensusStatsDto, QuorumDto } from '@app/types';

const officialRepresentatives = new Set<string>()
    .add('ban_1fomoz167m7o38gw4rzt7hz67oq6itejpt4yocrfywujbpatd711cjew8gjj')
    .add('ban_1ka1ium4pfue3uxtntqsrib8mumxgazsjf58gidh1xeo5te3whsq8z476goo')
    .add('ban_1bananobh5rat99qfgt1ptpieie5swmoth87thi74qgbfrij7dcgjiij94xr')
    .add('ban_1cake36ua5aqcq1c5i3dg7k8xtosw7r9r7qbbf5j15sk75csp9okesz87nfn');

const _isOfficialRep = (addr: string): boolean => officialRepresentatives.has(addr);

export const calcConsensusStats = (
    reps: BasicRepDetails[],
    totalSupply: number,
    quorum: QuorumDto
): ConsensusStatsDto => {
    const allReps = {
        onlineAmount: quorum.onlineStakeTotal,
        onlinePercent: quorum.onlineStakeTotal / totalSupply,
        offlineAmount: totalSupply - quorum.onlineStakeTotal,
        offlinePercent: (totalSupply - quorum.onlineStakeTotal) / totalSupply,
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
        onlineAmount: officialOnlineWeight,
        onlinePercent: officialOnlineWeight / totalSupply,
        offlineAmount: officialOfflineWeight,
        offlinePercent: officialOfflineWeight / totalSupply,
    };
    const unofficial = {
        onlineAmount: quorum.onlineStakeTotal - officialOnlineWeight - officialOfflineWeight,
        onlinePercent: (quorum.onlineStakeTotal - (officialOnlineWeight + officialOfflineWeight)) / totalSupply,
        offlineAmount: unofficialOfflineWeight,
        offlinePercent: unofficialOfflineWeight / totalSupply,
    };
    const noRep = {
        amount:
            totalSupply -
            official.onlineAmount -
            official.offlineAmount -
            unofficial.offlineAmount -
            unofficial.onlineAmount,
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
    quorum: QuorumDto,
    consensus: ConsensusStatsDto
): number => {
    const unofficialWeights: number[] = [];
    const officialWeightSum = consensus.official.onlineAmount + consensus.official.offlineAmount;

    for (const rep of reps) {
        if (!_isOfficialRep(rep.address)) {
            unofficialWeights.push(rep.votingWeight);
        }
    }

    const weights = Array.of(officialWeightSum, ...unofficialWeights);
    weights.sort((a, b) => (a > b ? -1 : b > a ? 1 : 0));

    let total = 0;
    let coefficient = 1;
    const MAX_BREAKPOINTS = 15;
    let i = 0;
    for (const weight of weights) {
        i++;
        total += weight;
        if (i > MAX_BREAKPOINTS) {
            break;
        }
        if (total < quorum.quorumDelta) {
            coefficient++;
        }
    }
    return coefficient;
};
