import { AppCache, IS_PRODUCTION, REPRESENTATIVES_REFRESH_INTERVAL_MS } from '@app/config';
import { RepPingMapData } from '@app/types';
import { LOG_ERR } from '@app/services';
const fs = require('fs');

const dayMaxPings = 86_400_000 / REPRESENTATIVES_REFRESH_INTERVAL_MS;
const weekMaxPings = 604_800_000 / REPRESENTATIVES_REFRESH_INTERVAL_MS;
const monthMaxPings = 2_629_800_000 / REPRESENTATIVES_REFRESH_INTERVAL_MS;
const semiAnnualMaxPings = (6 * 2_629_800_000) / REPRESENTATIVES_REFRESH_INTERVAL_MS;
const yearMaxPings = (12 * 2_629_800_000) / REPRESENTATIVES_REFRESH_INTERVAL_MS;

/** Given a rep address, returns the location o the file to write to store rep uptime. */
const formatDocName = (repAddress: string): string =>
    `src/database/${IS_PRODUCTION ? 'rep-uptime' : 'rep-uptime-dev'}/${repAddress}.json`;

/** Returns data for how long a rep has been online. Either reads from file, or uses internal map if populated. */
const getRepDoc = async (repAddress: string): Promise<RepPingMapData> => {
    if (AppCache.dbRepPings.has(repAddress)) {
        return AppCache.dbRepPings.get(repAddress);
    }
    const newPingMap = {
        day: [],
        week: [],
        month: [],
        semiAnnual: [],
        year: [],
    };

    return new Promise(async (resolve) => {
        await fs.readFile(formatDocName(repAddress), 'utf8', (err, data) => {
            err ? resolve(newPingMap) : resolve(JSON.parse(data));
        });
    });
};

/** Stores updated ping data in local collection of JSON files. */
const writeRepDoc = async (data: RepPingMapData, repAddress: string): Promise<void> => {
    return new Promise(async (resolve) => {
        await fs.writeFile(formatDocName(repAddress), JSON.stringify(data), { flag: 'w' }, (err) => {
            if (err) {
                console.log('[ERROR]: Writing rep-uptime file', err);
                LOG_ERR('representativeUptimeService.writeRepDoc', err, { repAddress });
            }
            resolve();
        });
    });
};

/** Stores representative ping data in a local JSON file. */
export const writeRepStatistics = async (repAddress: string, isOnline: boolean) => {
    const data = await getRepDoc(repAddress);

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

    await writeRepDoc(data, repAddress);
    AppCache.dbRepPings.set(repAddress, data);
    return Promise.resolve();
};
