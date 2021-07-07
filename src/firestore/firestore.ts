import { AppCache, REPRESENTATIVES_REFRESH_INTERVAL_MS } from '@app/config';
import { serviceAccount } from './serviceAccountKey';
import { RepPingMapData } from '@app/types';
import { formatError } from '@app/services';
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const dayMaxPings = 86400000 / REPRESENTATIVES_REFRESH_INTERVAL_MS;
const weekMaxPings = 604_800_000 / REPRESENTATIVES_REFRESH_INTERVAL_MS;
const monthMaxPings = 2_419_200_000 / REPRESENTATIVES_REFRESH_INTERVAL_MS;
const semiAnnualMaxPings = (6 * 2_419_200_000) / REPRESENTATIVES_REFRESH_INTERVAL_MS;
const yearMaxPings = (12 * 2_419_200_000) / REPRESENTATIVES_REFRESH_INTERVAL_MS;

const getRepDoc = async (collection: string, repAddress: string): Promise<RepPingMapData> => {
    const repDoc = await db.collection(collection).doc(repAddress);
    return repDoc
        .get()
        .then((doc) => {
            if (doc.exists) {
                return Promise.resolve(doc.data());
            } else {
                return Promise.resolve({
                    day: [],
                    week: [],
                    month: [],
                    semiAnnual: [],
                    year: [],
                });
            }
        })
        .catch((error) => {
            console.log('Error getting document:', error);
            return Promise.reject(error);
        });
};

/** Stores representative ping data in a firestore database. */
export const writeRepStatistics = async (repAddress: string, isOnline: boolean) => {
    const collection = process.env.FIRESTORE_REP_PING_COLLECTION;

    /* If the AppCache does not have the representative populated, go fetch it from firebase. */
    if (!AppCache.firestoreRepPings.has(repAddress)) {
        const repDoc = await getRepDoc(collection, repAddress).catch((err) => Promise.reject(err));
        if (repDoc) {
            AppCache.firestoreRepPings.set(repAddress, repDoc);
        } else {
            return Promise.reject();
        }
    }

    const docRef = db.collection(collection).doc(repAddress);
    let data = AppCache.firestoreRepPings.get(repAddress);

    // Remove older pings
    if (data.day.length > dayMaxPings) {
        data.day.shift();
    }
    if (data.week.length > weekMaxPings) {
        data.week.shift();
    }
    if (data.month.length > monthMaxPings) {
        data.month.shift();
    }
    if (data.semiAnnual.length > semiAnnualMaxPings) {
        data.semiAnnual.shift();
    }
    if (data.year.length > yearMaxPings) {
        data.year.shift();
    }

    // 1 === ONLINE | 0 === OFFLINE
    data.day.push(isOnline ? 1 : 0);
    data.week.push(isOnline ? 1 : 0);
    data.month.push(isOnline ? 1 : 0);
    data.semiAnnual.push(isOnline ? 1 : 0);
    data.year.push(isOnline ? 1 : 0);
    await docRef.set(data).catch((err) => formatError('writeRepStatistics', err));
    AppCache.firestoreRepPings.set(repAddress, data);
};
