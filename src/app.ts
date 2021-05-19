import * as express from 'express';
import * as cors from 'cors';
import { IS_PRODUCTION, URL_WHITE_LIST, AppCache, NETWORK_STATS_REFRESH_INTERVAL, PATH_ROOT } from './config';
import { reloadNetworkStats, getAccountOverview, getConfirmedTransactions } from './services';
import {getRepresentativesOnlineApi} from "./services/api/get-representatives-online";

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
app.get(`/${PATH_ROOT}/account-overview`, (req, res) => getAccountOverview(req, res)); // TODO: rename these to [get-name-service], and rpc [action-rpc]
app.get(`/${PATH_ROOT}/representatives-online`, (req, res) => getRepresentativesOnlineApi(req, res));
app.get(`/${PATH_ROOT}/confirmed-transactions`, (req, res) => getConfirmedTransactions(req, res));
app.get(`/${PATH_ROOT}/stats`, (req, res) => sendCached(res, reloadNetworkStats, AppCache.networkStats));

const port: number = Number(process.env.PORT || 3000);
const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Running yellow-spyglass server on port ${port}.`);
    console.log(`Production mode enabled? : ${IS_PRODUCTION}`);

    /* Reload network stats every 5 minutes. */
    setInterval(() => {
        reloadNetworkStats().catch(() => {
            console.error('Could not reload network stats.');
        });
    }, NETWORK_STATS_REFRESH_INTERVAL);
});
