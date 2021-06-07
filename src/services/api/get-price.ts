import { cmcApiKey } from '../../config/cmc-api-key';
import { formatError } from '../error.service';
import axios, {AxiosError, AxiosResponse} from 'axios';
import {CMCPriceData} from "../../types/model/CMCPriceData";
import {PriceData} from "../../types";

const method = 'GET';
const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
const headers = {
    'X-CMC_PRO_API_KEY': cmcApiKey,
};

const getBananoPrice = (): Promise<CMCPriceData> =>
    new Promise<CMCPriceData>((resolve, reject) => {
        axios
            .request({
                method, url, headers,
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
                method, url, headers,
                params: {
                    symbol: 'BTC',
                },
            })
            .then((response: AxiosResponse<CMCPriceData>) => resolve(response.data))
            .catch((err: AxiosError) => {
                reject(formatError('getBitcoinPrice', err));
            });
    });

export const getPrice = (req, res): void => {
    Promise.all([getBananoPrice(), getBitcoinPrice()]).then((results) => {
        console.log(results[0].data.BAN.quote);
        const dto: PriceData = {
            bananoPriceUsd: results[0].data.BAN.quote.USD.price,
            bitcoinPriceUsd: results[1].data.BTC.quote.USD.price,
        }
        res.send(dto);
    }).catch((err) => {
        res.status(500).send(err);
    })
}