import { NANO_CLIENT } from '@app/config';

export const sendRpc = async (wallet: string, source: string, destination: string): Promise<any> =>
    // @ts-ignore
    NANO_CLIENT._send('send', {
        wallet: wallet,
        source: source,
        destination: destination,
        amount: '1000000000000000000000000000',
    })
        .then((response: any) => Promise.resolve(response))
        .catch((err) => Promise.reject(err));
