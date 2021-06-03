import {getFrontiers, getFrontierCount, getAccountBalanceRpc} from "../../rpc";
import {formatError} from "../error.service";
import {FrontierCountResponse} from "@dev-ptera/nano-node-rpc";
import {rawToBan} from "banano-unit-converter";

export const getFrontiersData = async (): Promise<any> => {
    const frontiersCountResponse: FrontierCountResponse = await getFrontierCount().catch((err) => {
        return Promise.reject(formatError('getAccountDistribution.getFrontiersCount', err));
    });
    const frontiersResponse = await getFrontiers(Number(frontiersCountResponse.count)).catch((err) => {
        return Promise.reject(formatError('getAccountDistribution.getFrontiers', err));
    });

    const addrBalances = [];
    let i = 0;
    for (const addr in frontiersResponse.frontiers) {
        const balanceResponse = await(getAccountBalanceRpc(addr));
        if (balanceResponse.balance !== "0") {
            const ban = Number(rawToBan(balanceResponse.balance));
            if (ban > 100000.000001) {
                addrBalances.push({ addr: addr, bal: ban })
            }
        }
        if (++i % 1000 === 0) {
            console.log('1000 tested' + i);
        }
    }
    console.log(addrBalances);
    return Promise.resolve(addrBalances);
};

export const getAccountDistribution = async (req, res): Promise<void> => {
    getFrontiersData().then((data) => {
        res.send(data);
    }).catch((err) => {
        res.status(500).send(err);
    })
}