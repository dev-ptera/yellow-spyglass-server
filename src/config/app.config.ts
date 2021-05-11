import { NanoClient } from '@dev-ptera/nano-node-rpc';

export const IS_PRODUCTION = Boolean(process.env.RPC_AUTH);
export const URL_WHITE_LIST = [
    'https://is-banano-decentralized.web.app',
    'https://is-banano-decentralized-dev.web.app',
];
export const RPC_SERVER_PROD_URL = 'http://108.39.249.5:1120/banano-rpc';
export const RPC_SERVER_DEV_URL = 'http://localhost:1119/banano-rpc';
export const NANO_CLIENT = new NanoClient({
    url: IS_PRODUCTION ? RPC_SERVER_PROD_URL : RPC_SERVER_DEV_URL,
    requestHeaders: {
        Authorization: process.env.RPC_AUTH || '',
    },
});

export const NETWORK_STATS_REFRESH_INTERVAL = 1000 * 60 * 5;
