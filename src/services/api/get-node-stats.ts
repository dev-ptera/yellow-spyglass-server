import { ErrorResponse } from '../../../../nano-node-rpc';
import { formatError } from '../error.service';
import { AppCache } from '../../config';

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
        error: 'Batman missing in monitored rep list. Maybe the list is empty?',
    };
    res.status(500).send(formatError('getNodeStats', err));
};
