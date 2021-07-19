
import { sendRpc } from '@app/rpc';
import { LOG_ERR, LOG_INFO } from '@app/services';
import { megaphoneAccounts } from "../../../config/megaphone-accounts";

const sendFunds = (wallet: string, source: string, destination: string): Promise<any> =>
    new Promise((resolve) => {
        const start = LOG_INFO(`Sending BAN to account ${destination}`);
        sendRpc(wallet, source, destination)
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
    const hasLargeRep: string[] = req.body.hasLargeRep;
    const hasOfflineRep: string[] = req.body.hasOfflineRep;

    console.log(hasLargeRep);
    console.log(hasOfflineRep);

    const largeRep = megaphoneAccounts.hasLargeRepMessage;
    for (const address of hasLargeRep) {
        await sendFunds(largeRep.wallet, largeRep.address, address);
    }

    const offlineRep = megaphoneAccounts.hasOfflineRepMessage;
    for (const address of hasOfflineRep) {
        await sendFunds(offlineRep.wallet, offlineRep.address, address);
    }

    res.status(200).send(JSON.stringify({ success: true }));
};
