import { AppCache } from '@app/config';

/** Using the AppCache, send a list of online rep addresses. */
export const getOnlineReps = (req, res): void => {
    const reps: string[] = [];
    if (AppCache.representatives?.representatives) {
        AppCache.representatives.representatives.map((rep) => {
            if (rep.online) {
                reps.push(rep.address);
            }
        });
    }
    res.send(reps);
};
