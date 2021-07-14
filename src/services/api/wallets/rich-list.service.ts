import { AppCache } from '@app/config';

const MAX_RECORDS_PER_PAGE = 25;
const DEFAULT_RECORDS_PER_PAGE = 25;

/** Uses the AppCache to return a section of all known accounts. */
export const getRichList = async (req, res) => {
    if (AppCache.richList.length > 0) {
        const offset = Number(req.query.offset || 0);
        const size = Math.min(MAX_RECORDS_PER_PAGE, req.query.size || DEFAULT_RECORDS_PER_PAGE);
        const end = Number(offset + size);
        const addresses = AppCache.richList.slice(offset, end);
        res.send(addresses);
    } else {
        res.status(500).send({ error: 'Account list not loaded yet' });
    }
};
