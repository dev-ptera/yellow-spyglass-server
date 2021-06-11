import { formatError } from '@app/services';
import { accountHistoryRpc } from '@app/rpc';
import { ConfirmedTransactionDto, SUBTYPE } from '@app/types';
import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';
import { InsightsDto } from '../../types/dto/InsightsDto';
import { rawToBan } from 'banano-unit-converter';

const MAX_CHART_POINTS = 50;

const confirmedTransactionsPromise = (address: string): Promise<InsightsDto> =>
    //TODO: check block count before doing this; max of 50,000 tx.

    accountHistoryRpc(address, 0, -1, true)
        .then((accountHistory: AccountHistoryResponse) => {
            const transactionCount = accountHistory.history.length;

            // wtf?
            const chartIndexIncrement = Math.round(Math.max(1, transactionCount / MAX_CHART_POINTS));
            let chartIndex = 0;

            const insightsDto: InsightsDto = {
                data: [],
                maxAmountReceivedHash: undefined,
                maxAmountReceivedBan: 0,
                maxAmountSentHash: undefined,
                maxAmountSentBan: 0,
                maxBalanceHash: undefined,
                maxBalanceBan: 0,
            };

            let balance = 0;
            let index = 0;
            for (const transaction of accountHistory.history) {
                const addPoint = index++ === chartIndex;
                if (transaction.amount) {
                    const ban = Number(Number(rawToBan(transaction.amount)).toFixed(6));
                    if (transaction['subtype'] === 'receive') {
                        balance += ban;
                        if (ban > insightsDto.maxAmountReceivedBan) {
                            insightsDto.maxAmountReceivedBan = ban;
                            insightsDto.maxAmountReceivedHash = transaction.hash;
                        }
                    } else if (transaction['subtype'] === 'send') {
                        balance -= ban;
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
                if (addPoint) {
                    chartIndex += chartIndexIncrement;
                    const height = Number(transaction.height);
                    const roundedBalance = balance > 100 ? Math.round(balance) : balance;
                    insightsDto.data.push({ balance: roundedBalance, height });
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
