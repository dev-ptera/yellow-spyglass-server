import { LOG_ERR } from '@app/services';
import { AppCache } from '@app/config';
import { AccountDistributionStatsDto } from '@app/types';
import axios, { AxiosResponse } from 'axios';

/** Calls Spyglass API to get account distribution. */
const getAccountDistributionPromise = (): Promise<AccountDistributionStatsDto> =>
    new Promise<AccountDistributionStatsDto>((resolve) => {
        axios
            .request({
                method: 'GET',
                url: 'https://api.spyglass.pw/banano/v1/distribution/buckets',
            })
            .then((response: AxiosResponse<AccountDistributionStatsDto>) => resolve(response.data))
            .catch((err) => {
                LOG_ERR('getKnownAccountsPromise', err);
                resolve(undefined);
            });
    });

/** Call this to repopulate the rich list in the AppCache. */
export const cacheAccountDistribution = async (): Promise<void> => {
    const distribution = await getAccountDistributionPromise();
    if (distribution) {
        AppCache.accountDistributionStats = distribution;
    }
};
