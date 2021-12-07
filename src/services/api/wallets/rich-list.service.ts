import { AppCache } from '@app/config';
import { LOG_ERR, LOG_INFO } from '@app/services';
import { AccountBalanceDto } from '@app/types';
import axios, { AxiosResponse } from 'axios';

const MAX_RECORDS_PER_PAGE = 25;
const DEFAULT_RECORDS_PER_PAGE = 25;

/** Calls Spyglass API to get account rich list. */
const getRichListPromise = (): Promise<AccountBalanceDto[]> =>
    new Promise<AccountBalanceDto[]>((resolve) => {
        axios
            .request({
                method: 'GET',
                url: 'https://api.spyglass.pw/banano/distribution/rich-list-snapshot',
            })
            .then((response: AxiosResponse<AccountBalanceDto[]>) => resolve(response.data))
            .catch((err) => {
                LOG_ERR('getRichListPromise', err);
                resolve([]);
            });
    });

/** Call this to repopulate the rich list in the AppCache. */
export const cacheRichList = async (): Promise<void> => {
    LOG_INFO('Updating Rich List Snapshot');
    const richList = await getRichListPromise();
    if (richList.length > 0) {
        AppCache.richList = richList;
        LOG_INFO('Rich List Snapshot Updated');
    }
};

/** Uses the AppCache to return a section of all known accounts. */
export const getRichList = async (req, res) => {
    const offset = Number(req.query.offset || 0);
    const size = Math.min(MAX_RECORDS_PER_PAGE, req.query.size || DEFAULT_RECORDS_PER_PAGE);
    const end = Number(offset + size);
    if (AppCache.richList.length > 0) {
        const addresses = AppCache.richList.slice(offset, end);
        res.send(addresses);
    } else {
        res.status(500).send({ error: 'Account List not loaded yet' });
    }
};
