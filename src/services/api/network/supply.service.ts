import { UnitConversionResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '@app/config';
import { Supply } from '@app/types';
import { LOG_ERR } from '@app/services';

export const getSupplyPromise = (): Promise<Supply> => {
    const burnAddress1 = 'ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w';
    const burnAddress2 = 'ban_1ban116su1fur16uo1cano16su1fur16161616161616161616166a1sf7xw';

    const devFundAddress1 = 'ban_3fundbxxzrzfy3k9jbnnq8d44uhu5sug9rkh135bzqncyy9dw91dcrjg67wf';
    const devFundAddress2 = 'ban_1fundm3d7zritekc8bdt4oto5ut8begz6jnnt7n3tdxzjq3t46aiuse1h7gj';

    return Promise.all([
        NANO_CLIENT.available_supply().then((data) => NANO_CLIENT.mrai_from_raw(data.available)),
        NANO_CLIENT.account_balance(burnAddress1).then((data) => NANO_CLIENT.mrai_from_raw(data.pending)),
        NANO_CLIENT.account_balance(burnAddress2).then((data) => NANO_CLIENT.mrai_from_raw(data.pending)),
        NANO_CLIENT.account_balance(devFundAddress1).then((data) => NANO_CLIENT.mrai_from_raw(data.balance)),
        NANO_CLIENT.account_balance(devFundAddress2).then((data) => NANO_CLIENT.mrai_from_raw(data.balance)),
    ])
        .then((results: UnitConversionResponse[]) => {
            const available = Number(results[0].amount);
            const burned = Number(results[1].amount) + Number(results[2].amount);
            const devFund = Number(results[3].amount) + Number(results[4].amount);
            return Promise.resolve({
                total: available - burned,
                circulating: available - burned - devFund,
                burned,
                devFund,
            });
        })
        .catch((err) => Promise.reject(err));
};

/** Returns circulating, burned, and core-team controlled supply statistics. */
export const getSupply = (req, res): void => {
    getSupplyPromise()
        .then((supply: Supply) => {
            res.send(supply);
        })
        .catch((err) => {
            res.status(500).send(LOG_ERR('getSupply', err));
        });
};
