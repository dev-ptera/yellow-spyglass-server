import { MonitoredRepDto, PeerMonitorStats, RepresentativeDto } from '@app/types';
import { isRepOnline } from '@app/services';
import { AppCache } from '@app/config';

/** This file contains just random helpers to help clean up the logic from various rep-based services. */

export const sortRepByWeight = (reps: RepresentativeDto[]): RepresentativeDto[] =>
    reps.sort(function (a, b) {
        const weightA = a.weight;
        const weightB = b.weight;
        return weightA < weightB ? 1 : weightA > weightB ? -1 : 0;
    });

export const sortMonitoredRepsByName = (onlineReps: MonitoredRepDto[]): MonitoredRepDto[] =>
    onlineReps.sort(function (a, b) {
        const textA = a.name.toUpperCase();
        const textB = b.name.toUpperCase();
        return textA < textB ? -1 : textA > textB ? 1 : 0;
    });

export const sortMonitoredRepsByStatus = (onlineReps: PeerMonitorStats[]): PeerMonitorStats[] =>
    onlineReps.sort((a, b) => {
        if (isRepOnline(a.nanoNodeAccount) && !isRepOnline(b.nanoNodeAccount)) {
            return -1;
        }
        if (isRepOnline(b.nanoNodeAccount) && !isRepOnline(a.nanoNodeAccount)) {
            return 1;
        }
        return 0;
    });

/** Given a weight (non-raw), returns if it's enough to be a considered a Principal Representative. */
export const isRepPrincipal = (weight: number): boolean => weight > AppCache.networkStats.principalRepMinBan;
