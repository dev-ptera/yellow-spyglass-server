import { AppCache, BACKUP_NODES, NANO_CLIENT } from '@app/config';
import * as RPC from '@dev-ptera/nano-node-rpc';
import { RepresentativeDto } from '@app/types';
import axios, { AxiosResponse } from 'axios';
import { LOG_ERR } from '../../log/error.service';

/** Uses BACKUP_NODES to make additional rpc calls. */
const getOnlineRepsFromExternalApi = (url: string): Promise<RPC.RepresentativesOnlineResponse> =>
    axios
        .request<RPC.RepresentativesOnlineResponse>({
            method: 'post',
            timeout: 4000,
            url,
            data: {
                action: 'representatives_online',
            },
        })
        .then((response: AxiosResponse<RPC.RepresentativesOnlineResponse>) => {
            return Promise.resolve(response.data);
        })
        .catch(() =>
            Promise.resolve({
                representatives: [],
            })
        );

/** Makes a handful of async calls to various nodes & fetches a string array of online representatives. */
export const getOnlineRepsPromise = (): Promise<string[]> => {
    const externalCalls: Promise<any>[] = [];
    for (const api of BACKUP_NODES) {
        externalCalls.push(getOnlineRepsFromExternalApi(api));
    }
    return new Promise((resolve) => {
        const onlineRepSet = new Set<string>();
        Promise.all([NANO_CLIENT.representatives_online(false), ...externalCalls])
            .then((data: Array<RPC.RepresentativesOnlineResponse>) => {
                for (const resultSet of data) {
                    if (!resultSet || !resultSet.representatives) {
                        resolve(
                            LOG_ERR('getOnlineRepsPromise', {
                                error: `Malformed response for representatives_online RPC: ${JSON.stringify(
                                    resultSet || ''
                                )}`,
                            })
                        );
                        continue;
                    }
                    for (const rep of resultSet.representatives) {
                        onlineRepSet.add(rep);
                    }
                }
                resolve(Array.from(onlineRepSet));
            })
            .catch((err) => {
                resolve(LOG_ERR('getOnlineRepsPromise', err));
                resolve(Array.from(onlineRepSet));
            });
    });
};

/** Returns the list of online representatives.
 *  Whenever invoked, checks if a previously-offline large (tracked) (100K+) rep has gone online & updates the AppCache accordingly.
 *  This extra step is intended to give representatives the benefit of the doubt as to
 *  not mark their representative as offline when it actually isn't. */
export const getOnlineReps = async (req, res): Promise<void> => {
    const allOnlineReps = new Set<string>();
    const onlineReps = await getOnlineRepsPromise();
    const offlineTrackedReps = new Map<string, RepresentativeDto>();

    AppCache.representatives?.thresholdReps.map((rep) => {
        rep.online ? allOnlineReps.add(rep.address) : offlineTrackedReps.set(rep.address, rep);
    });

    for (const address of onlineReps) {
        if (offlineTrackedReps.has(address)) {
            /* Mark this previously offline representative as online in the AppCache. */
            AppCache.repPings.map.set(address, AppCache.repPings.currPing); // Update last successful ping to current ping.
            offlineTrackedReps.get(address).online = true; // Manually mark as online.
        }
        allOnlineReps.add(address);
    }
    res.send(Array.from(allOnlineReps));
    return Promise.resolve();
};
