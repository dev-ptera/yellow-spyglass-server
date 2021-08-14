import { ErrorResponse } from '@dev-ptera/nano-node-rpc';
import { LOG_ERR } from '@app/services';
import { AppCache, HOST_NODE_NAME, LEDGER_LOCATION } from '@app/config';
import { HostNodeStatsDto, MonitoredRepDto } from '@app/types';
const getSize = require('get-folder-size');

/** Returns statistics of this explorer's host node. */
export const getNodeStats = (req, res): void => {
    if (!AppCache.representatives) {
        return sendRepresentativesNotLoadedError(res);
    }

    // Find the hostNode in the list of cached reps.
    let hostNode: MonitoredRepDto = undefined;
    for (const dto of AppCache.representatives.monitoredReps) {
        if (dto.name === HOST_NODE_NAME) {
            hostNode = dto;
        }
    }
    if (!hostNode) {
        return sendRepresentativesNotLoadedError(res);
    }

    // Calculate ledger size.
    try {
        getSize(LEDGER_LOCATION, (err, size) => {
            if (err) {
                throw err;
            }
            const ledgerSizeMb = Number((size / 1024 / 1024).toFixed(2));
            return res.send({
                ...hostNode,
                ledgerSizeMb,
            } as HostNodeStatsDto);
        });
    } catch (err) {
        LOG_ERR('getNodeStats.getLedgerSize', err);
        const fileReadError: ErrorResponse = {
            error: 'Could not read the ledger size.',
        };
        res.status(500).send(fileReadError);
    }
};

const sendRepresentativesNotLoadedError = (res): void => {
    const err: ErrorResponse = {
        error: 'Node data not loaded in AppCache.',
    };
    LOG_ERR('getNodeStats', err);
    return res.status(500).send(err);
};
