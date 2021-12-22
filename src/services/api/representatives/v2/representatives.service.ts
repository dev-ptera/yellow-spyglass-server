import { MonitoredRepDto, RepresentativesResponseDto, SpyglassRepresentativeDto } from '@app/types';
import { AppCache } from '@app/config';
import axios, { AxiosResponse } from 'axios';
import { transformLargeRepsDto, transformMonitoredRepsDto } from './transform.service';
import {LOG_ERR, LOG_INFO} from "@app/services";

const getMonitoredRepresentativesRemote = (): Promise<MonitoredRepDto[]> =>
    new Promise<MonitoredRepDto[]>((resolve) => {
        axios
            .request({
                method: 'POST',
                url: 'https://api.spyglass.pw/banano/v1/representatives',
                data: {
                    minimumWeight: 1_000,
                    isMonitored: true,
                    isOnline: true,
                    includeNodeMonitorStats: true,
                    includeDelegatorCount: true,
                },
            })
            .then((response: AxiosResponse<MonitoredRepDto[]>) => resolve(response.data))
            .catch((err) => Promise.reject(LOG_ERR('getMonitoredRepresentativesRemote', err)));
    });

/** Makes call to Spyglass API to get Large Representatives. */
const getLargeRepresentativesRemote = (): Promise<SpyglassRepresentativeDto[]> =>
    new Promise<SpyglassRepresentativeDto[]>((resolve) => {
        axios
            .request({
                method: 'POST',
                url: 'https://api.spyglass.pw/banano/v1/representatives',
                data: {
                    minimumWeight: 100_000,
                    includeUptimeStats: true,
                    includeDelegatorCount: true,
                },
            })
            .then((response: AxiosResponse<SpyglassRepresentativeDto[]>) => resolve(response.data))
            .catch((err) => Promise.reject(LOG_ERR('getLargeRepresentativesRemote', err)));
    });

/** Makes call to Spyglass API to get PR Weight. */
const getPRWeight = (): Promise<number> =>
    new Promise<number>((resolve) => {
        axios
            .request({
                method: 'GET',
                url: 'https://api.spyglass.pw/banano/v1/representatives/pr-weight',
            })
            .then((response: AxiosResponse<{  weight: number }>) => resolve(response.data.weight))
            .catch((err) => Promise.reject(LOG_ERR('getPRWeight', err)));
    });

/** Makes call to Spyglass API to get Online Reps. */
const getOnlineRepsRemote = (): Promise<string[]> =>
    new Promise<string[]>((resolve) => {
        axios
            .request({
                method: 'GET',
                url: 'https://api.spyglass.pw/banano/v1/representatives/online',
            })
            .then((response: AxiosResponse<string[]>) => resolve(response.data))
            .catch((err) => Promise.reject(LOG_ERR('getOnlineReps', err)));
    });

/** Makes call to Spyglass API to get Representative Data. */
const getRepresentativesPromise = async (): Promise<RepresentativesResponseDto> => {
    const { onlineReps, thresholdReps, monitoredReps } = await Promise.all([
        getPRWeight(),
        getOnlineRepsRemote(),
        getLargeRepresentativesRemote(),
        getMonitoredRepresentativesRemote(),
    ]).then(([prWeight, online, large, monitored]) => {
        return Promise.resolve({
            onlineReps: online,
            thresholdReps: transformLargeRepsDto(large, online, prWeight),
            monitoredReps: transformMonitoredRepsDto(monitored),
        });
    }).catch((err) => Promise.reject(err));

    AppCache.representatives.onlineReps = onlineReps;
    const quorum = AppCache.networkStats.spyglassQuorum;
    const onlineWeight = Math.round(quorum.onlineWeight);
    const offlineWeight = Math.round(quorum.offlineWeight);

    return {
        thresholdReps,
        monitoredReps,
        onlineWeight,
        microReps: [],
        onlineReps,
        offlineWeight
    };
};

/** This is called to update the representatives list in the AppCache. */
export const cacheRepresentativesV2 = async (): Promise<void> => {
    return new Promise((resolve) => {
        const start = LOG_INFO('Refreshing Representatives');
        getRepresentativesPromise()
            .then((data: RepresentativesResponseDto) => {
                AppCache.representativesV2 = data;
                resolve(LOG_INFO('Representatives Updated', start));
            })
            .catch((err) => {
                resolve(LOG_ERR('cacheRepresentatives', err));
            });
    });
};
