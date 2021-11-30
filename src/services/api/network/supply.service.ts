import { SupplyDto } from '@app/types';
import { LOG_ERR } from '@app/services';
import axios, { AxiosResponse } from 'axios';

export const getSupplyPromise = (): Promise<SupplyDto> =>
    axios
        .request<SupplyDto>({
            method: 'get',
            timeout: 5000,
            url: 'https://api.spyglass.pw/banano/distribution/supply',
        })
        .then((response: AxiosResponse<SupplyDto>) => {
            response.data.totalAmount = response.data.devFundAmount + response.data.circulatingAmount;
            return Promise.resolve(response.data);
        })
        .catch((err) => {
            return Promise.reject(LOG_ERR('getSupplyPromise', err));
        });

/** Returns circulating, burned, and core-team controlled supply statistics. */
export const getSupply = (req, res): void => {
    getSupplyPromise()
        .then((supply: SupplyDto) => {
            res.send(supply);
        })
        .catch((err) => {
            res.status(500).send(LOG_ERR('getSupply', err));
        });
};
