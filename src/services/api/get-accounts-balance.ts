import { AppCache } from '../../config';

const MAX_RECORDS_PER_PAGE = 25;
export const getAccountsBalance = async (req, res): Promise<void> => {
    if (AppCache.richList.length > 0) {
        const offset = req.query.offset;
        const addresses = AppCache.richList.slice(
            offset * MAX_RECORDS_PER_PAGE,
            offset * MAX_RECORDS_PER_PAGE + MAX_RECORDS_PER_PAGE
        );
        res.send(addresses);
    } else {
        res.status(500).send('Account list not loaded yet');
    }
};
