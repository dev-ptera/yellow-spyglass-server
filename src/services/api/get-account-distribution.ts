import { getFrontiers, getFrontierCount, getAccountBalanceRpc, getRepresentativesOnlineRpc } from '../../rpc';
import { formatError } from '../error.service';
import { FrontierCountResponse } from '@dev-ptera/nano-node-rpc';
import { rawToBan } from 'banano-unit-converter';
import { AppCache } from '../../config';
import { AccountBalanceDto, AccountDistributionStatsDto } from '../../types';
import { getAccountRepresentativeRpc } from '../../rpc/calls/account-representative';
const { performance } = require('perf_hooks');

export const getFrontiersData = async (): Promise<{
    distributionStats: AccountDistributionStatsDto;
    richList: AccountBalanceDto[];
}> => {
    const frontiersCountResponse: FrontierCountResponse = await getFrontierCount().catch((err) => {
        return Promise.reject(formatError('getAccountDistribution.getFrontiersCount', err));
    });
    const frontiersResponse = await getFrontiers(Number(frontiersCountResponse.count)).catch((err) => {
        return Promise.reject(formatError('getAccountDistribution.getFrontiers', err));
    });

    const richList: AccountBalanceDto[] = [];
    const distributionStats: AccountDistributionStatsDto = {
        number0_001: 0,
        number0_01: 0,
        number0_1: 0,
        number1: 0,
        number10: 0,
        number100: 0,
        number1_000: 0,
        number10_000: 0,
        number100_000: 0,
        number1_000_000: 0,
        number10_000_000: 0,
        number100_000_000: 0,
        totalAccounts: 0,
    };
    const onlineRepSet = new Set<string>();
    const repsOnline = await getRepresentativesOnlineRpc();
    for (const addr in repsOnline.representatives) {
        onlineRepSet.add(addr);
    }
    for (const addr in frontiersResponse.frontiers) {
        const balanceResponse = await getAccountBalanceRpc(addr);
        const accountRep = await getAccountRepresentativeRpc(addr);
        if (balanceResponse.balance !== '0') {
            const ban = Number(Number(rawToBan(balanceResponse.balance)).toFixed(3));
            const repOnline = onlineRepSet.has(accountRep.representative);
            // Add to address list
            if (ban > 0.001) {
                richList.push({ addr, ban, repOnline });
            } else {
                continue;
            }

            // Bucket balances
            distributionStats.totalAccounts++;
            if (ban > 100_000_000) {
                distributionStats.number100_000_000++;
            } else if (ban > 10_000_000) {
                distributionStats.number10_000_000++;
            } else if (ban > 1_000_000) {
                distributionStats.number1_000_000++;
            } else if (ban > 100_000) {
                distributionStats.number100_000++;
            } else if (ban > 10_000) {
                distributionStats.number10_000++;
            } else if (ban > 1_000) {
                distributionStats.number1_000++;
            } else if (ban > 100) {
                distributionStats.number100++;
            } else if (ban > 10) {
                distributionStats.number10++;
            } else if (ban > 1) {
                distributionStats.number1++;
            } else if (ban > 0.1) {
                distributionStats.number0_1++;
            } else if (ban > 0.01) {
                distributionStats.number0_01++;
            } else if (ban > 0.001) {
                distributionStats.number0_001++;
            }
        }
    }

    const sortedAccounts = richList.sort((a: AccountBalanceDto, b: AccountBalanceDto) => {
        if (a.ban > b.ban) return -1;
        if (a.ban < b.ban) return 1;
        return 0;
    });
    return Promise.resolve({
        richList: sortedAccounts,
        distributionStats,
    });
};

export const cacheAccountDistribution = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const t0 = performance.now();
        console.log('[INFO]: Refreshing Rich List');
        getFrontiersData()
            .then((data) => {
                AppCache.accountDistributionStats = data.distributionStats;
                AppCache.richList = data.richList;
                const t1 = performance.now();
                console.log(`[INFO]: Rich List Updated, took ${Math.round(t1 - t0) / 1000} seconds`);
                const used = process.memoryUsage();
                for (let key in used) {
                    console.log(`${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`);
                }
                resolve();
            })
            .catch((err) => {
                reject(err);
            });
    });
};
