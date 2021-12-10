import { RepresentativesResponseDto } from '@app/types';
import { AppCache } from '@app/config';
import { getMonitoredReps, getOnlineRepsPromise, getOnlineWeight, LOG_ERR, LOG_INFO } from '@app/services';
import { getLargeReps } from './large-reps.service';

/** Representatives Promise aggregate; makes all calls required to populate the rep data in AppCache. */
const getRepresentativesDto = async (): Promise<RepresentativesResponseDto> => {
    const onlineReps = await getOnlineRepsPromise();
    AppCache.representatives.onlineReps = onlineReps;

    // Subsequent functions may make additions to onlineReps.
    const monitoredReps = await getMonitoredReps();

    // TODO: In V23, reevaluate if smaller representatives once again appear in the representatives_online call.
    //  If so, monitored reps doesn't have to be passed into he getLargeReps call anymore.
    const largeReps = await getLargeReps(monitoredReps);
    const onlineWeight = await getOnlineWeight();
    const offlineWeight = AppCache.networkStats.spyglassQuorum.offlineWeight;
    return {
        thresholdReps: largeReps,
        monitoredReps,
        onlineWeight,
        microReps: [],
        onlineReps,
        offlineWeight,
    };
};

/** This is called to update the representatives list in the AppCache. */
export const cacheRepresentatives = async (): Promise<void> => {
    return new Promise((resolve) => {
        const start = LOG_INFO('Refreshing Representatives');
        getRepresentativesDto()
            .then((data: RepresentativesResponseDto) => {
                AppCache.representatives = data;
                resolve(LOG_INFO('Representatives Updated', start));
            })
            .catch((err) => {
                resolve(LOG_ERR('cacheRepresentatives', err));
            });
    });
};
