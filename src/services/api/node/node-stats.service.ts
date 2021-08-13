import { ErrorResponse } from '@dev-ptera/nano-node-rpc';
import { LOG_ERR } from '@app/services';
import { AppCache } from '@app/config';

/** Returns statistics of this explorer's node. */
export const getNodeStats = (req, res): void => {
    if (AppCache.representatives) {
        for (const dto of AppCache.representatives.monitoredReps) {
            if (dto.name === 'batman') {
                return res.send({
                    ...dto,
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
