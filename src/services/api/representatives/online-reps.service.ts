import { AppCache, NANO_CLIENT } from '@app/config';
import * as RPC from '@dev-ptera/nano-node-rpc';
import { RepresentativeDto } from '@app/types';

/** Returns the list of online representatives.
 *  Whenever invoked, checks if a previously-offline rep has gone online & updates the AppCache accordingly.
 *  This extra step is intended to give representatives the benefit of the doubt as to
 *  not mark their representative as offline when it actually isn't. */
export const getOnlineReps = async (req, res): Promise<void> => {
    const online = new Set<string>();
    const onlineReps = (await NANO_CLIENT.representatives_online()) as RPC.RepresentativesOnlineResponse;

    const offlineTrackedReps = new Map<string, RepresentativeDto>();
    AppCache.trackedReps?.thresholdReps.map((rep) => {
        rep.online ? online.add(rep.address) : offlineTrackedReps.set(rep.address, rep);
    });

    for (const address of onlineReps.representatives) {
        /* Mark this representative as online in the AppCache. */
        if (offlineTrackedReps.has(address)) {
            AppCache.repPings.map.set(address, AppCache.repPings.currPing); // Update last successful ping to current.
            offlineTrackedReps.get(address).online = true; // Manually mark as online.
        }
        online.add(address);
    }

    const response: string[] = [];
    for (const rep of online.values()) {
        response.push(rep);
    }
    res.send(response);
    return Promise.resolve();
};
