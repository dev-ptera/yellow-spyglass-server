import axios, { AxiosResponse } from 'axios';
import { AppCache } from '@app/config';
import { KnownAccountDto } from '@app/types';
import { LOG_INFO, LOG_ERR } from '@app/services';

/** Makes API call to Kirby's API to fetch known accounts list. */
const getKnownAccountsPromise = (): Promise<KnownAccountDto[]> =>
    new Promise<KnownAccountDto[]>((resolve, reject) => {
        axios
            .request({
                method: 'GET',
                url: 'https://kirby.eu.pythonanywhere.com/api/v1/resources/addresses/all',
            })
            .then((response: AxiosResponse<KnownAccountDto[]>) => resolve(response.data))
            .catch(reject);
    });

/** Saves known accounts in the App Cache. */
export const cacheKnownAccounts = (): Promise<void> => {
    return new Promise((resolve) => {
        const start = LOG_INFO('Refreshing Known Accounts');
        getKnownAccountsPromise()
            .then((data: KnownAccountDto[]) => {
                const knownAddresses = new Set<string>();
                for (const knownAccount of data) {
                    knownAddresses.add(knownAccount.address);
                }
                for (const knownAccount of BANANO_LOOKER_KNOWN_ADDRESSES) {
                    if (!knownAddresses.has(knownAccount.address)) {
                        data.push(knownAccount);
                    }
                }
                data.sort((a, b) => (a.alias > b.alias ? 1 : -1));
                AppCache.knownAccounts = data;
                resolve(LOG_INFO('Known Accounts Updated', start));
            })
            .catch((err) => {
                resolve(LOG_ERR('cacheKnownAccounts', err));
            });
    });
};

const BANANO_LOOKER_KNOWN_ADDRESSES = [
    {
        address: 'ban_3a1dokzzuc334kpsedakxz5hw4cauexjori8spcf7pninujry43dxkbam4o6',
        alias: 'BNswap',
    },
    {
        address: 'ban_1bananobh5rat99qfgt1ptpieie5swmoth87thi74qgbfrij7dcgjiij94xr',
        alias: 'Genesis',
        type: 'Representative',
    },
    {
        address: 'ban_1cake36ua5aqcq1c5i3dg7k8xtosw7r9r7qbbf5j15sk75csp9okesz87nfn',
        alias: 'Official Rep - Cake',
        type: 'Representative',
    },
    {
        address: 'ban_1fomoz167m7o38gw4rzt7hz67oq6itejpt4yocrfywujbpatd711cjew8gjj',
        alias: 'Official Rep - FOMO',
        type: 'Representative',
    },
    {
        address: 'ban_3runnerrxm74165sfmystpktzsyp7eurixwpk59tejnn8xamn8zog18abrda',
        alias: 'Banano Runner',
    },
    {
        address: 'ban_3fundbxxzrzfy3k9jbnnq8d44uhu5sug9rkh135bzqncyy9dw91dcrjg67wf',
        alias: 'Giveaway Fund 3',
    },
    {
        address: 'ban_1fundm3d7zritekc8bdt4oto5ut8begz6jnnt7n3tdxzjq3t46aiuse1h7gj',
        alias: 'Giveaway Fund 1',
    },
    {
        address: 'ban_3fo1d1ng6mfqumfoojqby13nahaugqbe5n6n3trof4q8kg5amo9mribg4muo',
        alias: 'Folding',
        type: 'Development',
    },
    {
        address: 'ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w',
        alias: 'Burn',
        type: 'Burn',
    },
    {
        address: 'ban_1monkeyt1x77a1rp9bwtthajb8odapbmnzpyt8357ac8a1bcron34i3r9y66',
        alias: 'MonkeyTalks',
    },
    {
        address: 'ban_1ka1ium4pfue3uxtntqsrib8mumxgazsjf58gidh1xeo5te3whsq8z476goo',
        alias: 'Kalium',
        type: 'Representative',
    },
    {
        address: 'ban_1boompow14irck1yauquqypt7afqrh8b6bbu5r93pc6hgbqs7z6o99frcuym',
        alias: 'BoomPoW',
    },
    {
        address: 'ban_1faucetjuiyuwnz94j4c7s393r95sk5ac7p5usthmxct816osgqh3qd1caet',
        alias: 'Banano Faucet',
        type: 'Distribution',
    },
    {
        address: 'ban_1nrcne47secz1hnm9syepdoob7t1r4xrhdzih3zohb1c3z178edd7b6ygc4x',
        alias: 'CoinEx',
        type: 'Exchange',
    },
    {
        address: 'ban_1oaocnrcaystcdtaae6woh381wftyg4k7bespu19m5w18ze699refhyzu6bo',
        alias: 'Kuyumcu',
        type: 'Exchange',
    },
    {
        address: 'ban_1tipbotgges3ss8pso6xf76gsyqnb69uwcxcyhouym67z7ofefy1jz7kepoy',
        alias: 'Banano Tipbots',
        type: 'Representative',
    },
    {
        address: 'ban_1sebrep1mbkdtdb39nsouw5wkkk6o497wyrxtdp71sm878fxzo1kwbf9k79b',
        alias: 'sebrock19.de',
        type: 'Representative',
    },
    {
        address: 'ban_3px37c9f6w361j65yoasrcs6wh3hmmyb6eacpis7dwzp8th4hbb9izgba51j',
        alias: 'Banano Italio - La Giungla',
        type: 'Representative',
    },
    {
        address: 'ban_1wha1enz8k8r65k6nb89cxqh6cq534zpixmuzqwbifpnqrsycuegbmh54au6',
        alias: 'bananode.eu',
        type: 'Representative',
    },
    {
        address: 'ban_3p3sp1ynb5i3qxmqoha3pt79hyk8gxhtr58tk51qctwyyik6hy4dbbqbanan',
        alias: 'BananOslo',
        type: 'Representative',
    },
    {
        address: 'ban_3batmanuenphd7osrez9c45b3uqw9d9u81ne8xa6m43e1py56y9p48ap69zg',
        alias: 'batman',
        type: 'Representative',
    },
    {
        address: 'ban_1creepi89mp48wkyg5fktgap9j6165d8yz6g1fbe5pneinz3by9o54fuq63m',
        alias: 'creeper.banano.cc',
        type: 'Representative',
    },
    {
        address: 'ban_3grayknbwtrjdsbdgsjbx4fzds7eufjqghzu6on57aqxte7fhhh14gxbdz61',
        alias: 'Gray',
        type: 'Representative',
    },
    {
        address: 'ban_3m8mdu1jxuntoe19wemgohduss3cn7ctxbt41ioh87mfjz9ho8o15yhjas96',
        alias: 'Cabbit Node',
        type: 'Representative',
    },
    {
        address: 'ban_1fnx59bqpx11s1yn7i5hba3ot5no4ypy971zbkp5wtium3yyafpwhhwkq8fc',
        alias: 'banano.nifni.net',
        type: 'Representative',
    },
    {
        address: 'ban_1bestrep6gq14bt4bi7w446m9knc6matfad7qcii7edeb33iipooh46dotdz',
        alias: 'node.banano.ch',
        type: 'Representative',
    },
    {
        address: 'ban_3binance1adje7uwzjmsyxsqxjt8c471i33xo39k94twkipntmrqt1ii5t57',
        alias: 'Unofficial Binance Representative 1',
        type: 'Representative',
    },
    {
        address: 'ban_1banbet1hxxe9aeu11oqss9sxwe814jo9ym8c98653j1chq4k4yaxjsacnhc',
        alias: 'BananoBet Rep',
        type: 'Representative',
    },
    {
        address: 'ban_3srechjntpdomi9dbaksfxkpk4o134kchii8iozd98aa5f3txbej96wb77mg',
        alias: 'Yellow Trust',
        type: 'Representative',
    },
    {
        address: 'ban_1ce1ery6hqwyqqyh15m4atcoaywd8rycyapjjooqeg7gi149kmatjbb3wiwx',
        alias: 'Dev Salary',
    },
    {
        address: 'ban_3pp1antnfudas6ad44kwpad4jb376cihftskq9ne76hazosi654gjdohriai',
        alias: 'Banano Powerplant',
        type: 'Distribution',
    },
    {
        address: 'ban_1crane864e1cn1g3p9mrduf49hp86gfgfosp8rib43smxxuqp3phq1yiu58k',
        alias: 'Crane Faucet',
        type: 'Distribution',
    },
    {
        address: 'ban_1b1ack1188caohzjdj65uarnk4kobzrnr3q3oc3bew5rfkyqxzu81zhjgp1e',
        alias: 'Black Monkey',
        type: 'Distribution',
    },
    {
        address: 'ban_36e1qnwo5faf7uapp6gbzzmzt3bgz6a93txuukmr45pmodcy4q7pwaray1u9',
        alias: 'Atomars Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_1fxc48dynhbjb69uuyue4bsfuymxick8js14synwznduy61g6i9esdeasmem',
        alias: 'GJ Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_16tduo1cu9ydp8ris3o5w4rm96myqics5o8tjw8s13ja8owba6xfpwc8399r',
        alias: 'Banroulettecom Hot Wallet',
        type: 'Distribution',
    },
    {
        address: 'ban_1gooj14qko1u6md87aga9c53nf4iphyt1ua7x3kq1wnkdh49u5mndqygbr1q',
        alias: 'Ataix Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_16bfuppfebtmgh1t8ktpk4eq4dyz5m1ztxesznagd916jzk8b87qity3habz',
        alias: 'Unnamed Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_3yafcjcq79cjfm4wio5db6drffmf61jh8cosoijmg3eppzmbxb4kej8t3dze',
        alias: 'qtrade Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_1bujgzb69qr4owkcm3qu35mb843qtwnx4zf8q3myjw1dui7br5k87k84e54d',
        alias: 'ViteX Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_1gtkt1ekpazojhxwnym9ur61cz4w7n8yez5yq81id6cb8k63bhwx7axhtsxx',
        alias: 'Bitmesh Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_3wwd51yoxeafubpn84gy7tje7yw6ccqcach9m4yfn46sf15itnysap9dd1xc',
        alias: 'Citex Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_3w6yatruhkxgu4bhx1d8zggpwafrq3z7xyrqchuw8h5xa9aqhnrj7mi79mtu',
        alias: 'Qbtc Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_3x1o69xsppjb1d9owsn8x6uqr8a1ttpitsu3yya7iyimaboqhb9urb8x61y8',
        alias: 'Txbit Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_31dhbgirwzd3ce7naor6o94woefws9hpxu4q8uxm1bz98w89zqpfks5rk3ad',
        alias: 'Mercatox Cold Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_3k76rawffjm79qedoc54nhk3edkq5makoyp73b1t6q6j9yjeq633q1xck9g8',
        alias: 'Mercatox Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_1banbet955hwemgsqrb8afycd3nykaqaxsn7iaydcctfrwi3rbb36y17fbcb',
        alias: 'Bananobet Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_1w5q77ocgfrjn6sqwudfuygtomwyij8ijes3y5g8kaydxsf8f4jpz4n9q9a3',
        alias: 'Nanogames Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_3iejwmk1n3fqdntwcgudhmddo9bpwa8jzx6g361iq6rzbsrzonekmdus9yj5',
        alias: 'Bananoroyale Hot Wallet',
        type: 'Exchange',
    },
    {
        address: 'ban_1nrcne47secz1hnm9syepdoob7t1r4xrhdzih3zohb1c3z178edd7b6ygc4x',
        alias: 'Coinex Deposits',
        type: 'Exchange',
    },
    {
        address: 'ban_1gxx3dbrprrh9ycf1p5wo9qgmftppg6z7688njum14aybjkaiweqmwpuu9py',
        alias: 'BananoLooker Donations',
        type: 'Explorer',
    },
];
