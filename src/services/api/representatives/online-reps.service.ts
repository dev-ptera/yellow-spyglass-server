import { AppCache, BACKUP_NODES, NANO_CLIENT } from '@app/config';
import * as RPC from '@dev-ptera/nano-node-rpc';
import axios, { AxiosResponse } from 'axios';
import { LOG_ERR } from '../../log/error.service';
import { LOG_INFO } from '../../log/info.service';

const OFFLINE_AFTER_PINGS = 3;

/**
 * The `representatives_online` RPC call is unreliable, so I mark reps as offline if they have been offline for OFFLINE_AFTER_PINGS pings.
 */
export const isRepOnline = (repAddress: string): boolean =>
    AppCache.repPings.map.get(repAddress) !== undefined &&
    AppCache.repPings.map.get(repAddress) !== 0 &&
    AppCache.repPings.map.get(repAddress) + OFFLINE_AFTER_PINGS >= AppCache.repPings.currPing;

/** Uses BACKUP_NODES to make additional rpc calls. */
const getOnlineRepsFromExternalApi = (url: string): Promise<RPC.RepresentativesOnlineResponse> =>
    axios
        .request<RPC.RepresentativesOnlineResponse>({
            method: 'post',
            timeout: 10000,
            url,
            data: {
                action: 'representatives_online',
            },
        })
        .then((response: AxiosResponse<RPC.RepresentativesOnlineResponse>) => {
            return Promise.resolve(response.data);
        })
        .catch((err) => {
            LOG_ERR('getOnlineRepsFromExternalApi', err);
            return Promise.resolve({
                representatives: [],
            });
        });

/** Makes a handful of async calls to various nodes & fetches a string array of online representatives. */
export const getOnlineRepsPromise = (): Promise<string[]> => {
    const start = LOG_INFO('Updating Online Reps');
    const externalCalls: Promise<any>[] = [];
    for (const api of BACKUP_NODES) {
        externalCalls.push(getOnlineRepsFromExternalApi(api));
    }

    return new Promise((resolve) => {
        const onlineRepSet = new Set<string>();

        Promise.all([NANO_CLIENT.representatives_online(false), ...externalCalls])
            .then((data: Array<RPC.RepresentativesOnlineResponse>) => {
                // Update online pings
                AppCache.repPings.currPing++;
                console.log(AppCache.repPings.currPing);

                // Iterate through the results, add all unique reps to a set.
                for (const resultSet of data) {
                    if (resultSet && resultSet.representatives) {
                        resultSet.representatives.map((rep) => onlineRepSet.add(rep));
                    } else {
                        LOG_ERR('getOnlineRepsPromise', {
                            error: `Malformed response for representatives_online RPC: ${JSON.stringify(
                                resultSet || ''
                            )}`,
                        });
                    }

                    // The following representatives get to increase their last-known ping since they were included in representatives_online result.
                    for (const address of Array.from(onlineRepSet)) {
                        AppCache.repPings.map.set(address, AppCache.repPings.currPing);
                    }

                    // Use the pings to update the AppCache online reps.
                    // TODO: Since I've updated this service to reach out to multiple nodes to check for rep online status, allowing 4 offline-pings might be overkill now.
                    AppCache.representatives.onlineReps = [];
                    for (const rep of AppCache.repPings.map.keys()) {
                        if (isRepOnline(rep)) {
                            AppCache.representatives.onlineReps.push(rep);
                        }
                    }
                }
                LOG_INFO('Online Reps Updated', start);
                resolve(Array.from(onlineRepSet));
            })
            .catch((err) => {
                resolve(LOG_ERR('getOnlineRepsPromise', err));
                resolve(Array.from(onlineRepSet));
            });
    });
};

/** Returns the list of online representatives from AppCache. */
export const getOnlineReps = (req, res): void => {
    res.send(AppCache.representatives.onlineReps);
};
