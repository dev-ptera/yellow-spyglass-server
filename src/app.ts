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
    getPeers,
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
    getQuorum,
    getSupply,
    getPeerVersions,
    parseRichListFromFile,
    useMegaphone,
    getAliases,
    getRepresentativeUptime,
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

const sendCached = (res, noCacheMethod: () => Promise<void>, cacheKey: keyof AppCache): void => {
    AppCache[cacheKey]
        ? res.send(JSON.stringify(AppCache[cacheKey]))
        : noCacheMethod()
              .then(() => res.send(JSON.stringify(AppCache[cacheKey])))
              .catch((err) => res.status(500).send(JSON.stringify(err)));
};

app.use(cors(corsOptions));

/* Real time results */
app.get(`/${PATH_ROOT}/accounts-balance`, (req, res) => getRichList(req, res));
app.get(`/${PATH_ROOT}/account-overview/*`, (req, res) => getAccountOverview(req, res));
app.get(`/${PATH_ROOT}/aliases`, (req, res) => getAliases(req, res));
app.get(`/${PATH_ROOT}/block/*`, (req, res) => getBlockInfo(req, res));
app.get(`/${PATH_ROOT}/confirmed-transactions`, (req, res) => getConfirmedTransactions(req, res));
app.get(`/${PATH_ROOT}/insights/*`, (req, res) => getAccountInsights(req, res));
app.post(`/${PATH_ROOT}/megaphone`, (req, res) => useMegaphone(req, res));
app.get(`/${PATH_ROOT}/node`, (req, res) => getNodeStats(req, res));
app.get(`/${PATH_ROOT}/online-reps`, (req, res) => getOnlineReps(req, res));
app.get(`/${PATH_ROOT}/peers`, (req, res) => getPeers(req, res));
app.get(`/${PATH_ROOT}/peer-versions`, (req, res) => getPeerVersions(req, res));
app.get(`/${PATH_ROOT}/pending-transactions`, (req, res) => getPendingTransactions(req, res));
app.get(`/${PATH_ROOT}/representative-uptime/*`, (req, res) => getRepresentativeUptime(req, res));
app.get(`/${PATH_ROOT}/quorum`, (req, res) => getQuorum(req, res));
app.get(`/${PATH_ROOT}/supply`, (req, res) => getSupply(req, res));

/* Cached Results */
app.get(`/${PATH_ROOT}/accounts-distribution`, (req, res) =>
    sendCached(res, parseRichListFromFile, 'accountDistributionStats')
);
app.get(`/${PATH_ROOT}/known-accounts`, (req, res) => sendCached(res, cacheKnownAccounts, 'knownAccounts'));
app.get(`/${PATH_ROOT}/network-stats`, (req, res) => sendCached(res, cacheNetworkStats, 'networkStats'));
app.get(`/${PATH_ROOT}/price`, (req, res) => sendCached(res, cachePriceData, 'priceData'));
app.get(`/${PATH_ROOT}/representatives`, (req, res) => sendCached(res, cacheRepresentatives, 'representatives'));

const port: number = Number(process.env.PORT || 3000);
const server = http.createServer(app);

server.listen(port, () => {
    LOG_INFO(`Running yellow-spyglass server on port ${port}.`);
    LOG_INFO(`Production mode enabled? : ${IS_PRODUCTION}`);
    // importHistoricHashTimestamps(); // TODO: Prune timestamps after March 18, 2021


    /* Updating the network metrics are now staggered so that each reset interval not all calls are fired at once. */
    void cacheNetworkStats().then(() => {
        setInterval(() => {
            void cacheNetworkStats();
        }, NETWORK_STATS_REFRESH_INTERVAL_MS);
        void cachePriceData().then(() => {
            setInterval(() => {
                void cachePriceData();
            }, PRICE_DATA_REFRESH_INTERVAL_MS);
            void cacheKnownAccounts().then(() => {
                setInterval(() => {
                    void cacheKnownAccounts();
                }, KNOWN_ACCOUNTS_REFRESH_INTERVAL_MS);
                void cacheRepresentatives().then(() => {
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
                })
            })
        })
    })
});
