import { AppCache } from '@app/config';
import { LOG_ERR, LOG_INFO } from '@app/services';
import {
    ConsensusStatsDto,
    NakamotoCoefficientDto,
    PeerVersionsDto,
    QuorumDto,
    SpyglassAPIQuorumDto,
    SupplyDto,
} from '@app/types';
import axios, { AxiosResponse } from 'axios';

/** Makes call to Spyglass API to get NC. */
const getNakamotoCoefficientPromise = (): Promise<NakamotoCoefficientDto> =>
    new Promise<NakamotoCoefficientDto>((resolve) => {
        axios
            .request({
                method: 'GET',
                url: 'https://api.spyglass.pw/banano/network/nakamoto-coefficient',
            })
            .then((response: AxiosResponse<NakamotoCoefficientDto>) => resolve(response.data))
            .catch((err) => Promise.reject(LOG_ERR('NakamotoCoefficientDto', err)));
    });

/** Makes call to Spyglass API to get peer versions. */
const getPeerVersionsPromise = (): Promise<PeerVersionsDto[]> =>
    new Promise<PeerVersionsDto[]>((resolve) => {
        axios
            .request({
                method: 'GET',
                url: 'https://api.spyglass.pw/banano/network/peers',
            })
            .then((response: AxiosResponse<PeerVersionsDto[]>) => resolve(response.data))
            .catch((err) => Promise.reject(LOG_ERR('getSupplyPromise', err)));
    });

/** Makes call to Spyglass API to get supply. */
const getSupplyPromise = (): Promise<SupplyDto> =>
    new Promise<SupplyDto>((resolve) => {
        axios
            .request({
                method: 'GET',
                url: 'https://api.spyglass.pw/banano/distribution/supply',
            })
            .then((response: AxiosResponse<SupplyDto>) => resolve(response.data))
            .catch((err) => Promise.reject(LOG_ERR('getSupplyPromise', err)));
    });

/** Makes call to Spyglass API to get quorum. */
const getQuorumPromise = (): Promise<SpyglassAPIQuorumDto> =>
    new Promise<SpyglassAPIQuorumDto>((resolve) => {
        axios
            .request({
                method: 'GET',
                url: 'https://api.spyglass.pw/banano/network/quorum',
            })
            .then((response: AxiosResponse<SpyglassAPIQuorumDto>) => resolve(response.data))
            .catch((err) => Promise.reject(LOG_ERR('getQuorumPromise', err)));
    });

/** This is called to update the Network Stats in the AppCache. */
export const cacheNetworkStats = async (): Promise<void> => {
    const start = LOG_INFO('Refreshing Network Stats');
    return new Promise((resolve) => {
        Promise.all([getSupplyPromise(), getPeerVersionsPromise(), getNakamotoCoefficientPromise(), getQuorumPromise()])
            .then((response: [SupplyDto, PeerVersionsDto[], NakamotoCoefficientDto, SpyglassAPIQuorumDto]) => {
                const supply = response[0];
                const peerVersions = response[1];
                const nakamotoCoefficient = response[2].nakamotoCoefficient;
                const remoteQuorum = response[3];

                // TODO: Refactor the front-end to remove usage of quorum / consensus & only use spyglassQuorum.
                const quorum: QuorumDto = {
                    quorumDelta: remoteQuorum.quorumDelta,
                    onlineWeightQuorumPercent: remoteQuorum.onlineWeightQuorumPercent,
                    onlineWeightMinimum: remoteQuorum.onlineWeightMinimum,
                    onlineStakeTotal: remoteQuorum.onlineWeight,
                    peersStakeTotal: remoteQuorum.peersStakeWeight,
                };
                const consensus: ConsensusStatsDto = {
                    onlineAmount: remoteQuorum.onlineWeight,
                    onlinePercent: remoteQuorum.onlinePercent,
                    offlineAmount: remoteQuorum.offlineWeight,
                    offlinePercent: remoteQuorum.offlinePercent,
                    noRepAmount: remoteQuorum.noRepWeight,
                    noRepPercent: remoteQuorum.noRepPercent,
                };
                AppCache.networkStats = {
                    supply,
                    consensus,
                    quorum,
                    nakamotoCoefficient,
                    spyglassQuorum: remoteQuorum,
                    peerVersions,
                    principalRepMinBan: Math.round(quorum.onlineStakeTotal * 0.001),
                    openedAccounts: AppCache.networkStats.openedAccounts,
                };
                resolve(LOG_INFO('Network Stats Updated', start));
            })
            .catch((err) => {
                resolve(LOG_ERR('cacheNetworkStats', err));
            });
    });
};
