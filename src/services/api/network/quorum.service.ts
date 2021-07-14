import { ConfirmationQuorumResponse, UnitConversionResponse } from '@dev-ptera/nano-node-rpc';
import { Quorum } from '@app/types';
import { NANO_CLIENT } from '@app/config';
import { LOG_ERR } from '@app/services';

export const getQuorumPromise = async (): Promise<Quorum> => {
    let rawQuorum: ConfirmationQuorumResponse;
    await NANO_CLIENT.confirmation_quorum()
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

/** Returns statistics about amount of BAN required to confirm transactions, online staking weight, etc. */
export const getQuorum = (req, res): void => {
    getQuorumPromise()
        .then((quorumData: Quorum) => {
            res.send(quorumData);
        })
        .catch((err) => {
            res.status(500).send(LOG_ERR('getQuorum', err));
        });
};
