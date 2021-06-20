import { formatError } from '@app/services';
import { accountHistoryRpc } from '@app/rpc';
import { ConfirmedTransactionDto, SUBTYPE } from '@app/types';
import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';
import { InsightsDto } from '@app/types';
import { rawToBan } from 'banano-unit-converter';

const MAX_CHART_POINTS = 50;

const confirmedTransactionsPromise = (address: string): Promise<InsightsDto> =>
    //TODO: check block count before doing this; max of 50,000 tx.

    accountHistoryRpc(address, 0, -1, true)
        .then((accountHistory: AccountHistoryResponse) => {
            const transactionCount = accountHistory.history.length;

            // wtf?
            //    const chartIndexIncrement = Math.round(Math.max(1, transactionCount / MAX_CHART_POINTS));
            //    let chartIndex = 0;

            const accountSentMap = new Map<string, number>();
            const accountReceivedMap = new Map<string, number>();
            const insightsDto: InsightsDto = {
                data: [],
                maxAmountReceivedHash: undefined,
                maxAmountReceivedBan: 0,
                maxAmountSentHash: undefined,
                maxAmountSentBan: 0,
                maxBalanceHash: undefined,
                maxBalanceBan: 0,
                mostCommonRecipientAddress: undefined,
                mostCommonSenderAddress: undefined,
                mostCommonRecipientTxCount: 0,
                mostCommonSenderTxCount: 0,
            };

            let balance = 0;
            let index = 0;
            for (const transaction of accountHistory.history) {
                const isLastDp = index === accountHistory.history.length;
                // const addPoint = index++ === chartIndex;
                const addPoint = true;
                if (transaction.amount) {
                    const ban = Number(Number(rawToBan(transaction.amount)).toFixed(6));
                    const addr = transaction.account;
                    if (transaction['subtype'] === 'receive') {
                        balance += ban;
                        accountReceivedMap.has(addr)
                            ? accountReceivedMap.set(addr, accountReceivedMap.get(addr) + 1)
                            : accountReceivedMap.set(addr, 1);
                        if (ban > insightsDto.maxAmountReceivedBan) {
                            insightsDto.maxAmountReceivedBan = ban;
                            insightsDto.maxAmountReceivedHash = transaction.hash;
                        }
                    } else if (transaction['subtype'] === 'send') {
                        balance -= ban;
                        accountSentMap.has(addr)
                            ? accountSentMap.set(addr, accountSentMap.get(addr) + 1)
                            : accountSentMap.set(addr, 1);
                        if (ban > insightsDto.maxAmountSentBan) {
                            insightsDto.maxAmountSentBan = ban;
                            insightsDto.maxAmountSentHash = transaction.hash;
                        }
                    }
                    if (balance >= insightsDto.maxBalanceBan) {
                        insightsDto.maxBalanceBan = balance;
                        insightsDto.maxBalanceHash = transaction.hash;
                    }
                }
                if (addPoint || isLastDp) {
                    //     chartIndex += chartIndexIncrement;
                    const height = Number(transaction.height);
                    const roundedBalance = balance > 100 ? Math.round(balance) : balance;
                    insightsDto.data.push({ balance: Number(roundedBalance.toFixed(3)), height });
                }
            }

            // Set most common sender/recipient.
            let accountMaxSentCount = 0; // Calc Recipient Data
            for (const key of accountSentMap.keys()) {
                if (accountSentMap.get(key) > accountMaxSentCount) {
                    accountMaxSentCount = accountSentMap.get(key);
                    insightsDto.mostCommonRecipientAddress = key;
                    insightsDto.mostCommonRecipientTxCount = accountMaxSentCount;
                }
            }
            let accountMaxReceivedCount = 0; // Calc Sender/Received Data
            for (const key of accountReceivedMap.keys()) {
                if (accountReceivedMap.get(key) > accountMaxReceivedCount) {
                    accountMaxReceivedCount = accountReceivedMap.get(key);
                    insightsDto.mostCommonSenderAddress = key;
                    insightsDto.mostCommonSenderTxCount = accountMaxReceivedCount;
                }
            }
            return Promise.resolve(insightsDto);
        })
        .catch((err) => {
            return Promise.reject(formatError('getAccountInsights.confirmedTransactionPromise', err, { address }));
        });

export const getAccountInsights = async (req, res): Promise<void> => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 1];

    confirmedTransactionsPromise(address)
        .then((insights: InsightsDto) => {
            res.send(insights);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
