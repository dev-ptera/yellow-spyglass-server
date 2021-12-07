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
const bodyParser = require('body-parser');
const morgan = require('morgan');
process.env.UV_THREADPOOL_SIZE = String(16);

app.use(morgan('dev'));

app.use(bodyParser.json()); //utilizes the body-parser package

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
    getNodeStats,
    cacheAccountDistribution,
    getAccountInsights,
    cachePriceData,
    cacheKnownAccounts,
    getRichList,
    cacheNetworkStats,
    LOG_INFO,
    useMegaphone,
    getAliases,
    sleep,
    cacheRichList,
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

const sendCached = (res, cacheKey: keyof AppCache): void => res.send(JSON.stringify(AppCache[cacheKey]));

app.use(cors(corsOptions));

/* Set response headers to text-json */
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});

/* Real time results */
app.get(`/${PATH_ROOT}/account-overview/*`, (req, res) => getAccountOverview(req, res));
app.get(`/${PATH_ROOT}/aliases`, (req, res) => getAliases(req, res));
app.get(`/${PATH_ROOT}/block/*`, (req, res) => getBlockInfo(req, res));
app.get(`/${PATH_ROOT}/confirmed-transactions`, (req, res) => getConfirmedTransactions(req, res));
app.get(`/${PATH_ROOT}/insights/*`, (req, res) => getAccountInsights(req, res));
app.post(`/${PATH_ROOT}/megaphone`, (req, res) => useMegaphone(req, res));
app.get(`/${PATH_ROOT}/node`, (req, res) => getNodeStats(req, res));
app.get(`/${PATH_ROOT}/pending-transactions`, (req, res) => getPendingTransactions(req, res));

/* Cached Results */
app.get(`/${PATH_ROOT}/accounts-distribution`, (req, res) => sendCached(res, 'accountDistributionStats'));
app.get(`/${PATH_ROOT}/known-accounts`, (req, res) => sendCached(res, 'knownAccounts'));
app.get(`/${PATH_ROOT}/network-stats`, (req, res) => sendCached(res, 'networkStats'));
app.get(`/${PATH_ROOT}/price`, (req, res) => sendCached(res, 'priceData'));
app.get(`/${PATH_ROOT}/representatives`, (req, res) => sendCached(res, 'representatives'));
app.get(`/${PATH_ROOT}/accounts-balance`, (req, res) => getRichList(req, res));

const port: number = Number(process.env.PORT || 3000);
const server = http.createServer(app);

export const staggerServerUpdates = async (cacheFns: Array<{ method: Function; interval: number }>) => {
    for (const fn of cacheFns) {
        await fn.method();
        setInterval(() => fn.method(), fn.interval);
        await sleep(2000);
    }
};

server.listen(port, () => {
    LOG_INFO(`Running yellow-spyglass server on port ${port}.`);
    LOG_INFO(`Production mode enabled? : ${IS_PRODUCTION}`);
    // importHistoricHashTimestamps(); // TODO: Prune timestamps after March 18, 2021

    const networkStats = {
        method: cacheNetworkStats,
        interval: NETWORK_STATS_REFRESH_INTERVAL_MS,
    };

    const priceData = {
        method: cachePriceData,
        interval: PRICE_DATA_REFRESH_INTERVAL_MS,
    };

    const representatives = {
        method: cacheRepresentatives,
        interval: REPRESENTATIVES_REFRESH_INTERVAL_MS,
    };

    const knownAccounts = {
        method: cacheKnownAccounts,
        interval: KNOWN_ACCOUNTS_REFRESH_INTERVAL_MS,
    };

    const accountDistribution = {
        method: cacheAccountDistribution,
        interval: WALLETS_REFRESH_INTERVAL_MS,
    };

    const richList = {
        method: cacheRichList,
        interval: WALLETS_REFRESH_INTERVAL_MS,
    };

    /* Updating the network metrics are now staggered so that each reset interval not all calls are fired at once. */
    void staggerServerUpdates([networkStats, knownAccounts, priceData, representatives, accountDistribution, richList]);
});
