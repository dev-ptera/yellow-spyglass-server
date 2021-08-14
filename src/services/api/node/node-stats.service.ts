import { ErrorResponse } from '@dev-ptera/nano-node-rpc';
import { LOG_ERR } from '@app/services';
import { AppCache } from '@app/config';
const getSize = require('get-folder-size');

/** Returns statistics of this explorer's node. */
export const getNodeStats = (req, res): void => {
    if (AppCache.representatives) {
        for (const dto of AppCache.representatives.monitoredReps) {
            if (dto.name === 'batman') {
                const myFolder = 'C:\\Windows\\Containers\\serviced';
                getSize(myFolder, (err, size) => {
                    if (err) {
                        throw err;
                    }
                    const ledgerSizeMb = (size / 1024 / 1024).toFixed(2);
                    return res.send({
                        ...dto,
                        ledgerSizeMb,
                    });
                });
            }
        }
    }
    const err: ErrorResponse = {
        error: 'Node data not loaded in AppCache',
    };
    LOG_ERR('getNodeStats', err);
    res.status(500).send(err);
};
