import { NanoClient } from '@dev-ptera/nano-node-rpc';

export const IS_PRODUCTION = Boolean(process.env.RPC_AUTH);
export const PATH_ROOT = 'yellowspyglass';
export const URL_WHITE_LIST = [
    'https://yellow-spyglass.web.app',
    'https://yellowspyglass.com',
];
export const RPC_SERVER_PROD_URL = 'http://[::1]:7072';
export const RPC_SERVER_DEV_URL = 'http://[::1]:7072';
export const NANO_CLIENT = new NanoClient({
    url: IS_PRODUCTION ? RPC_SERVER_PROD_URL : RPC_SERVER_DEV_URL,
    requestHeaders: {
        Authorization: process.env.RPC_AUTH || '',
    },
});

export const NETWORK_STATS_REFRESH_INTERVAL = 1000 * 60 * 5;
