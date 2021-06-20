import axios, { AxiosError, AxiosResponse } from 'axios';
import { KnownAccountDto } from '@app/types';
import { AppCache } from '@app/config';
import { formatError } from '../etc/error.service';

const getKnownAccountsPromise = (): Promise<KnownAccountDto[]> =>
    new Promise<KnownAccountDto[]>((resolve, reject) => {
        axios
            .request({
                method: 'GET',
                url: 'https://kirby.eu.pythonanywhere.com/api/v1/resources/addresses/all',
            })
            .then((response: AxiosResponse<KnownAccountDto[]>) => resolve(response.data))
            .catch((err: AxiosError) => {
                reject(formatError('getKnownAccountsPromise', err));
            });
    });

export const cacheKnownAccounts = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        console.log('[INFO]: Refreshing Known Accounts');
        getKnownAccountsPromise()
            .then((data: KnownAccountDto[]) => {
                console.log('[INFO]: Known Accounts Updated');
                AppCache.knownAccounts = data;
                resolve();
            })
            .catch(() => {
                console.error(`[ERROR]: Could not fetch known accounts.`);
                reject();
            });
    });
};
