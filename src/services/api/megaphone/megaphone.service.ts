import { sendRpc } from '@app/rpc';
import { LOG_ERR, LOG_INFO, sleep } from '@app/services';
import { megaphoneAccounts } from '../../../config/megaphone-accounts';

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

/** Sends messages to selected accounts. */
export const useMegaphone = async (req, res) => {
    const hasLargeRep: string[] = req.body.hasLargeRep || [];
    const hasOfflineRep: string[] = req.body.hasOfflineRep || [];

    console.log(hasLargeRep);
    console.log(hasOfflineRep);

    const readme = megaphoneAccounts.readme;
    const pick = megaphoneAccounts.pickkk;
    const small = megaphoneAccounts.smalll;
    const rep = megaphoneAccounts.repppp;

    for (const address of hasLargeRep) {
        await sendFunds(readme.wallet, readme.address, address, '19000000000000000000000000000');
        await sleep(500);
        await sendFunds(pick.wallet, pick.address, address, '3000000000000000000000000000');
        await sleep(500);
        await sendFunds(small.wallet, small.address, address, '2000000000000000000000000000');
        await sleep(500);
        await sendFunds(rep.wallet, rep.address, address, '1000000000000000000000000000');
    }

    for (const address of hasOfflineRep) {
        // ha.
    }

    res.status(200).send(JSON.stringify({ success: true }));
};
