import { sendRpc } from '@app/rpc';
import { LOG_ERR, LOG_INFO } from '@app/services';
import { megaphoneAccounts } from '../../../config/megaphone-accounts';

/** Wait interval in milliseconds. */
export const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const sendFunds = (wallet: string, source: string, destination: string, amount: string): Promise<any> =>
    new Promise((resolve) => {
        const start = LOG_INFO(`Sending BAN to account ${destination}`);
        sendRpc(wallet, source, destination, amount)
            .then(() => {
                LOG_INFO('Sent funds successfully', start);
                resolve();
            })
            .catch((err) => {
                LOG_ERR('useMegaphone', err);
                resolve();
            });
    });

/** Sends selected accounts messages. */
export const useMegaphone = async (req, res) => {
    const hasLargeRep: string[] = req.body.hasLargeRep || [];
    const hasOfflineRep: string[] = req.body.hasOfflineRep || [];

    console.log(hasLargeRep);
    console.log(hasOfflineRep);

    const picka = megaphoneAccounts.picka;
    const small = megaphoneAccounts.small;
    const repboi = megaphoneAccounts.repboi;

    for (const address of hasLargeRep) {
        await sendFunds(picka.wallet, picka.address, address, '1000000000000000000000000000');
        await sleep(2000);
        await sendFunds(small.wallet, small.address, address, '2000000000000000000000000000');
        await sleep(2000);
        await sendFunds(repboi.wallet, repboi.address, address, '3000000000000000000000000000');
    }

    const offlineRep = megaphoneAccounts.hasOfflineRepMessage;
    for (const address of hasOfflineRep) {
        await sendFunds(offlineRep.wallet, offlineRep.address, address, '1000000000000000000000000000');
    }

    res.status(200).send(JSON.stringify({ success: true }));
};
