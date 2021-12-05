import axios, { AxiosResponse } from 'axios';
import { AppCache } from '@app/config';
import { KnownAccountDto } from '@app/types';
import { LOG_ERR } from '@app/services';

/** Makes API to Spyglass API to get known accounts. */
const getKnownAccountsPromise = (): Promise<KnownAccountDto[]> =>
    new Promise<KnownAccountDto[]>((resolve) => {
        axios
            .request({
                method: 'POST',
                url: 'https://api.spyglass.pw/banano/known/accounts',
                data: {
                    includeOwner: true,
                    includeType: true,
                },
            })
            .then((response: AxiosResponse<KnownAccountDto[]>) => resolve(response.data))
            .catch((err) => {
                LOG_ERR('getKnownAccountsPromise', err);
                resolve([]);
            });
    });

/** Saves known accounts in the App Cache. */
export const cacheKnownAccounts = async (): Promise<void> => {
    const remoteAccounts = await getKnownAccountsPromise();
    if (remoteAccounts.length > 0) {
        AppCache.knownAccounts = remoteAccounts;
    }
};
