import * as express from 'express';
import * as cors from 'cors';
import { IS_PRODUCTION, URL_WHITE_LIST, AppCache, NETWORK_STATS_REFRESH_INTERVAL } from './config';
import { getAccount } from './services/api/account';
import { reloadNetworkStats } from './services/api/get-network-stats';

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
app.get('/account', (req, res) => getAccount(req, res));
app.get('/stats', (req, res) => sendCached(res, reloadNetworkStats, AppCache.networkStats));

const port = process.env.PORT || 3000;
http.createServer(app).listen(port, () => {
    console.log(`Running yellow-spyglass server on port ${port}.`);
    console.log(`Production mode enabled? : ${IS_PRODUCTION}`);

    /* Reload network stats every 5 minutes. */
    setInterval(() => {
        reloadNetworkStats().catch(() => {
            console.error('Could not reload network stats.');
        });
    }, NETWORK_STATS_REFRESH_INTERVAL);
});
