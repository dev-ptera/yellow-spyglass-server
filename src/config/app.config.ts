import { NanoClient } from '@dev-ptera/nano-node-rpc';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const PATH_ROOT = 'yellowspyglass';
export const URL_WHITE_LIST = ['https://yellow-spyglass.web.app', 'https://yellowspyglass.com'];
export const NANO_CLIENT = new NanoClient({
    url: process.env.RPC_URL,
});
