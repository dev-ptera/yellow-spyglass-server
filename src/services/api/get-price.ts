import { cmcApiKey } from '../../config/cmc-api-key';
import { formatError } from '../error.service';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { CMCPriceData } from '../../types/model/CMCPriceData';
import { PriceData } from '../../types';
import { AppCache } from '../../config';
const { performance } = require('perf_hooks');

const method = 'GET';
const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
const headers = {
    'X-CMC_PRO_API_KEY': cmcApiKey,
};

const getBananoPrice = (): Promise<CMCPriceData> =>
    new Promise<CMCPriceData>((resolve, reject) => {
        axios
            .request({
                method,
                url,
                headers,
                params: {
                    symbol: 'BAN',
                },
            })
            .then((response: AxiosResponse<CMCPriceData>) => resolve(response.data))
            .catch((err: AxiosError) => {
                reject(formatError('getBananoPrice', err));
            });
    });

const getBitcoinPrice = (): Promise<CMCPriceData> =>
    new Promise<CMCPriceData>((resolve, reject) => {
        axios
            .request({
                method,
                url,
                headers,
                params: {
                    symbol: 'BTC',
                },
            })
            .then((response: AxiosResponse<CMCPriceData>) => resolve(response.data))
            .catch((err: AxiosError) => {
                reject(formatError('getBitcoinPrice', err));
            });
    });

export const getPrice = (): Promise<PriceData> => {
    return Promise.all([getBananoPrice(), getBitcoinPrice()])
        .then((results) => {
            const dto: PriceData = {
                bananoPriceUsd: results[0].data.BAN.quote.USD.price,
                bitcoinPriceUsd: results[1].data.BTC.quote.USD.price,
            };
            return Promise.resolve(dto);
        })
        .catch((err) => {
            return Promise.reject(err);
        });
};

export const cachePriceData = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const t0 = performance.now();
        console.log('[INFO]: Refreshing Price Data');
        getPrice()
            .then((data) => {
                const t1 = performance.now();
                console.log(`[INFO]: Price Data Updated, took ${Math.round(t1 - t0)}ms`);
                AppCache.priceData = data;
                resolve();
            })
            .catch((err) => {
                console.error('Could not reload representatives');
                reject(err);
            });
    });
};
