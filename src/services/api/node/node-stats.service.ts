import { ErrorResponse } from '@dev-ptera/nano-node-rpc';
import { LOG_ERR } from '@app/services';
import { AppCache, HOST_NODE_NAME, LEDGER_LOCATION } from '@app/config';
import { HostNodeStatsDto, MonitoredRepDto } from '@app/types';
const getSize = require('get-folder-size');
const spawn = require('child_process');

/** Returns statistics of this explorer's host node. */
export const getNodeStats = (req, res): void => {
    if (!AppCache.representatives) {
        return sendRepresentativesNotLoadedError(res);
    }

    // Find the host node in the list of cached reps.
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
    let ledgerSizeMb = 0;
    try {
        getSize(LEDGER_LOCATION, (err, size) => {
            if (err) {
                throw err;
            }
            ledgerSizeMb = Number((size / 1024 / 1024).toFixed(2));
        });
    } catch (err) {
        LOG_ERR('getNodeStats.getLedgerSize', err);
        const fileReadError: ErrorResponse = {
            error: 'Could not read the ledger size.',
        };
        return res.status(500).send(fileReadError);
    }

    // Calculate free space on host machine
    spawn.exec('node scripts/calc-avail-diskspace', (err, stdout, stderr) => {
        if (err || stderr) {
            const diskAvailableError = err || stderr;
            LOG_ERR('getNodeStats.getDiskspaceAvailable', diskAvailableError);
            return res.status(500).send(diskAvailableError);
        }
        const availableDiskSpaceGb = Number(Number(stdout).toFixed(5));
        return res.send({
            ...hostNode,
            ledgerSizeMb,
            availableDiskSpaceGb,
        } as HostNodeStatsDto);
    });
    getSize(LEDGER_LOCATION, (err, size) => {
        if (err) {
            LOG_ERR('getNodeStats.getLedgerSize', err);
        }
        const ledgerSizeMb = Number((size / 1024 / 1024).toFixed(2));
        return res.send({
            ...hostNode,
            ledgerSizeMb,
        } as HostNodeStatsDto);
    });
};

const sendRepresentativesNotLoadedError = (res): void => {
    const err: ErrorResponse = {
        error: 'Node data not loaded in AppCache.',
    };
    LOG_ERR('getNodeStats', err);
    return res.status(500).send(err);
};
