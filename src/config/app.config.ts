import { NanoClient } from '@dev-ptera/nano-node-rpc';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const PATH_ROOT = 'yellowspyglass';
export const URL_WHITE_LIST = [
    'https://yellow-spyglass.web.app',
    'https://www.yellow-spyglass.web.app',
    'https://yellowspyglass.com',
    'https://www.yellowspyglass.com',
    'http://localhost:4200',
];
export const NANO_CLIENT = new NanoClient({
    url: process.env.RPC_URL,
    requestHeaders: {
        Authorization: process.env.RPC_AUTH || '',
    },
});
