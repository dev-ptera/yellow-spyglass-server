import { AppCache } from '@app/config';

/** Using the AppCache, sends a list of online representative addresses. */
export const getOnlineReps = (req, res): void => {
    const reps: string[] = [];
    for (const rep of AppCache.onlineReps.values()) {
        reps.push(rep);
    }
    res.send(reps);
};
