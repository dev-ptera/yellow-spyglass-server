import { NanoClient } from '@dev-ptera/nano-node-rpc';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** API served from this root, example: https://api.yellowspyglass.com/yellowspyglass/representatives */
export const PATH_ROOT = 'yellowspyglass';

/** Domains allowed to use this API */
export const URL_WHITE_LIST = [
    'https://yellow-spyglass.web.app',
    'https://www.yellow-spyglass.web.app',
    'https://yellowspyglass.com',
    'https://www.yellowspyglass.com',
    'http://localhost:4200',
];

/** Used to read data from the BANANO node */
export const NANO_CLIENT = new NanoClient({
    url: process.env.RPC_URL,
    requestHeaders: {
        Authorization: process.env.RPC_AUTH || '',
    },
});

const calcMinutes = (mins: number) => 60000 * mins;
export const REPRESENTATIVES_REFRESH_INTERVAL_MS = calcMinutes(5);
export const WALLETS_REFRESH_INTERVAL_MS = calcMinutes(60);
export const KNOWN_ACCOUNTS_REFRESH_INTERVAL_MS = calcMinutes(60);
export const PRICE_DATA_REFRESH_INTERVAL_MS = calcMinutes(15);

/** List of monitored representatives to counter-act low peer count. */
export const MANUAL_PEER_MONITOR_IPS = [
    '108.39.249.5', //batman
    '45.77.190.142', // Cabbit
    'banano.nifni.net',
    '192.210.243.189', // hentai
];
