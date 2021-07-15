import { AppCache } from '@app/config';
import {ACCOUNT_BALANCE_FILE_NAME} from "./account-distribution.service";
import {LOG_ERR} from "../../log/error.service";
const fs = require('fs');

const MAX_RECORDS_PER_PAGE = 25;
const DEFAULT_RECORDS_PER_PAGE = 25;

/** Uses the AppCache to return a section of all known accounts. */
export const getRichList = async (req, res) => {

    const offset = Number(req.query.offset || 0);
    const size = Math.min(MAX_RECORDS_PER_PAGE, req.query.size || DEFAULT_RECORDS_PER_PAGE);
    const end = Number(offset + size);

    if (AppCache.richList.length > 0) {
        const addresses = AppCache.richList.slice(offset, end);
        res.send(addresses);
    } else {
        fs.readFile(ACCOUNT_BALANCE_FILE_NAME, 'utf8', (err, data) => {
            if (err) {
                res.status(500).send(LOG_ERR(err, { error: 'Account list not loaded yet'}));
            } else {
                res.send(JSON.parse(data).richList.slice(offset, end));
            }
        });
    }
};
