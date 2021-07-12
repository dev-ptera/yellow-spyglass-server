import { ConfirmationQuorumResponse, UnitConversionResponse } from '@dev-ptera/nano-node-rpc';
import {Quorum} from "@app/types";
import {AppCache, NANO_CLIENT} from "@app/config";

const getQuorum = async (): Promise<Quorum> => {
    let rawQuorum: ConfirmationQuorumResponse;
    await NANO_CLIENT
        .confirmation_quorum()
        .then((quorumResponse: ConfirmationQuorumResponse) => {
            rawQuorum = quorumResponse;
        })
        .catch((err) => Promise.reject(err));

    return Promise.all([
        NANO_CLIENT.mrai_from_raw(rawQuorum.quorum_delta),
        NANO_CLIENT.mrai_from_raw(rawQuorum.online_weight_minimum),
        NANO_CLIENT.mrai_from_raw(rawQuorum.online_stake_total),
        NANO_CLIENT.mrai_from_raw(rawQuorum.peers_stake_required),
        NANO_CLIENT.mrai_from_raw(rawQuorum.peers_stake_total),
    ])
        .then((conversions: UnitConversionResponse[]) => {
            return Promise.resolve({
                onlineWeightQuorumPercent: Number(rawQuorum.online_weight_quorum_percent),
                quorumDelta: Number(conversions[0].amount),
                onlineWeightMinimum: Number(conversions[1].amount),
                onlineStakeTotal: Number(conversions[2].amount),
                peersStakeRequired: Number(conversions[3].amount),
                peersStakeTotal: Number(conversions[4].amount),
            });
        })
        .catch((err) => Promise.reject(err));
};

/** This is called to update the Quorum data in the AppCache. */
export const cacheQuorumData = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const t0 = performance.now();
        console.log('[INFO]: Refreshing Quorum Data');
        getQuorum()
            .then((data) => {
                const t1 = performance.now();
                console.log(`[INFO]: Quorum Data Updated, took ${Math.round(t1 - t0)}ms`);
                AppCache.networkStats.quorum = data;
                resolve();
            })
            .catch((err) => {
                console.error(`[ERROR]: Could not refresh price data.`);
                reject(err);
            });
    });
};