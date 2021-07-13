const moduleAlias = require('module-alias');
moduleAlias.addAlias('@app/config', __dirname + '/config');
moduleAlias.addAlias('@app/rpc', __dirname + '/rpc');
moduleAlias.addAlias('@app/services', __dirname + '/services');
moduleAlias.addAlias('@app/types', __dirname + '/types');

import * as express from 'express';
import * as cors from 'cors';

const dotenv = require('dotenv');
dotenv.config();
const http = require('http');
const app = express();

import {
    IS_PRODUCTION,
    URL_WHITE_LIST,
    PATH_ROOT,
    AppCache,
    PRICE_DATA_REFRESH_INTERVAL_MS,
    WALLETS_REFRESH_INTERVAL_MS,
    REPRESENTATIVES_REFRESH_INTERVAL_MS,
    KNOWN_ACCOUNTS_REFRESH_INTERVAL_MS,
    NETWORK_STATS_REFRESH_INTERVAL_MS,
} from '@app/config';
import {
    getAccountOverview,
    getConfirmedTransactions,
    getBlockInfo,
    getPendingTransactions,
    cacheRepresentatives,
    getPeersService,
    getNodeStats,
    cacheAccountDistribution,
    getAccountInsights,
    cachePriceData,
    importHistoricHashTimestamps,
    cacheKnownAccounts,
    getRichList,
    getOnlineReps,
    cacheNetworkStats,
    LOG_INFO,
} from '@app/services';

const corsOptions = {
    origin: function (origin, callback) {
        if (IS_PRODUCTION && origin && URL_WHITE_LIST.indexOf(origin) === -1) {
            callback(new Error(`Origin '${origin}' is not allowed by CORS`));
        } else {
            callback(null, true);
        }
    },
};

const sendCached = (res, noCacheMethod: () => Promise<any>, cache): void => {
    cache
        ? res.send(JSON.stringify(cache))
        : noCacheMethod()
              .then((fresh) => res.send(JSON.stringify(fresh)))
              .catch((err) => res.status(500).send(JSON.stringify(err)));
};

app.use(cors(corsOptions));
app.get(`/${PATH_ROOT}/account-overview/*`, (req, res) => getAccountOverview(req, res));
app.get(`/${PATH_ROOT}/peers`, (req, res) => getPeersService(req, res));
app.get(`/${PATH_ROOT}/confirmed-transactions`, (req, res) => getConfirmedTransactions(req, res));
app.get(`/${PATH_ROOT}/pending-transactions`, (req, res) => getPendingTransactions(req, res));
app.get(`/${PATH_ROOT}/node`, (req, res) => getNodeStats(req, res));
app.get(`/${PATH_ROOT}/block/*`, (req, res) => getBlockInfo(req, res));
app.get(`/${PATH_ROOT}/insights/*`, (req, res) => getAccountInsights(req, res));
app.get(`/${PATH_ROOT}/accounts-balance`, (req, res) => getRichList(req, res));
app.get(`/${PATH_ROOT}/online-reps`, (req, res) => getOnlineReps(req, res));

/* Cached Results */
app.get(`/${PATH_ROOT}/known-accounts`, (req, res) => sendCached(res, cacheKnownAccounts, AppCache.knownAccounts));
app.get(`/${PATH_ROOT}/price`, (req, res) => sendCached(res, cachePriceData, AppCache.priceData));
app.get(`/${PATH_ROOT}/representatives`, (req, res) => sendCached(res, cacheRepresentatives, AppCache.trackedReps));
app.get(`/${PATH_ROOT}/network-stats`, (req, res) => sendCached(res, cacheNetworkStats, AppCache.networkStats));
app.get(`/${PATH_ROOT}/representatives-uptime`, (req, res) =>
    sendCached(res, cacheRepresentatives, AppCache.trackedReps)
);
app.get(
    `/${PATH_ROOT}/accounts-distribution`,
    (
        req,
        res // TODO: getAccountsDistribution to handle error when client is still loading
    ) => sendCached(res, cacheAccountDistribution, AppCache.accountDistributionStats || [])
);

const port: number = Number(process.env.PORT || 3000);
const server = http.createServer(app);

server.listen(port, () => {
    LOG_INFO(`Running yellow-spyglass server on port ${port}.`);
    LOG_INFO(`Production mode enabled? : ${IS_PRODUCTION}`);
    // importHistoricHashTimestamps(); // TODO: Prune timestamps after March 18, 2021

    void cacheKnownAccounts();
    setInterval(() => {
        void cacheKnownAccounts();
    }, KNOWN_ACCOUNTS_REFRESH_INTERVAL_MS);

    void cacheRepresentatives();
    setInterval(() => {
        void cacheRepresentatives();
    }, REPRESENTATIVES_REFRESH_INTERVAL_MS);

    /*  I've disabled this operation when developing since I don't develop on the same machine
        that runs the node and inter-network calls are too slow for this run every hour.
    */
    if (IS_PRODUCTION) {
        void cacheAccountDistribution();
        setInterval(() => {
            void cacheAccountDistribution();
        }, WALLETS_REFRESH_INTERVAL_MS);
    }

    void cachePriceData();
    setInterval(() => {
        void cachePriceData();
    }, PRICE_DATA_REFRESH_INTERVAL_MS);

    void cacheNetworkStats();
    setInterval(() => {
        void cacheNetworkStats();
    }, NETWORK_STATS_REFRESH_INTERVAL_MS);
});
