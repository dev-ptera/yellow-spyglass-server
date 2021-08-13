import { AppCache, NANO_CLIENT } from '@app/config';
import * as RPC from '@dev-ptera/nano-node-rpc';
import { RepresentativeDto } from '@app/types';

/** Returns the list of online representatives.
 *  Whenever invoked, checks if a previously-offline large (tracked) (100K+) rep has gone online & updates the AppCache accordingly.
 *  This extra step is intended to give representatives the benefit of the doubt as to
 *  not mark their representative as offline when it actually isn't. */
export const getOnlineReps = async (req, res): Promise<void> => {
    const allOnlineReps = new Set<string>();
    const rpcOnlineReps = (await NANO_CLIENT.representatives_online(false)) as RPC.RepresentativesOnlineResponse;
    const offlineTrackedReps = new Map<string, RepresentativeDto>();

    AppCache.representatives?.thresholdReps.map((rep) => {
        rep.online ? allOnlineReps.add(rep.address) : offlineTrackedReps.set(rep.address, rep);
    });

    for (const address of rpcOnlineReps.representatives) {
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
