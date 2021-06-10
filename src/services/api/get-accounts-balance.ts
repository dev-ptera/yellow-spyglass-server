import { AppCache } from '../../config';

const MAX_RECORDS_PER_PAGE = 25;
export const getAccountsBalance = async (req, res): Promise<void> => {
    if (AppCache.richList.length > 0) {
        const offset = req.query.offset;
        const size = Math.min(MAX_RECORDS_PER_PAGE, req.query.size || 0);
        console.log('size = ' + size);
        const addresses = AppCache.richList.slice(offset, offset + size);
        res.send(addresses);
    } else {
        res.status(500).send('Account list not loaded yet');
    }
};
