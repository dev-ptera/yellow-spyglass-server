import * as express from 'express';
import * as cors from 'cors';
import { IS_PRODUCTION, URL_WHITE_LIST, PATH_ROOT, AppCache } from './config';
import {
    getAccountOverview,
    getConfirmedTransactions,
    getBlockInfo,
    getPendingTransactions,
    cacheRepresentatives,
    getPeersService,
    getNodeStats,
    cacheAccountDistribution,
} from './services';
const http = require('http');
const app = express();
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
app.get(`/${PATH_ROOT}/account-overview/*`, (req, res) => getAccountOverview(req, res)); // TODO: rename these to [get-name-service], and rpc [action-rpc]
app.get(`/${PATH_ROOT}/representatives`, (req, res) => sendCached(res, cacheRepresentatives, AppCache.representatives));
app.get(`/${PATH_ROOT}/peers`, (req, res) => getPeersService(req, res));
app.get(`/${PATH_ROOT}/confirmed-transactions`, (req, res) => getConfirmedTransactions(req, res));
app.get(`/${PATH_ROOT}/pending-transactions`, (req, res) => getPendingTransactions(req, res));
app.get(`/${PATH_ROOT}/node`, (req, res) => getNodeStats(req, res));
app.get(`/${PATH_ROOT}/block/*`, (req, res) => getBlockInfo(req, res));
app.get(`/${PATH_ROOT}/accounts-distribution`, (req, res) =>
    sendCached(res, cacheAccountDistribution, AppCache.accountDistributionStats)
);

const port: number = Number(process.env.PORT || 3000);
const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Running yellow-spyglass server on port ${port}.`);
    console.log(`Production mode enabled? : ${IS_PRODUCTION}`);

    /* Reload network stats every 5 minutes. */
    void cacheRepresentatives();
    setInterval(() => {
        void cacheRepresentatives();
    }, 60000 * 5);

    /* Reload rich list every 15 minutes. */
    void cacheAccountDistribution();
    setInterval(() => {
        void cacheAccountDistribution();
    }, 60000 * 155);
});
