const { performance } = require('perf_hooks');

const smartFormat = (now: number, start: number): string => {
    const ms = Math.round(now - start);
    if (ms > 10000) {
        return `${Math.round(ms) / 1000} seconds`;
    };
    return `${ms} ms`;
}

export const LOG_INFO = (msg: string, start?: number): number => {
    const now = performance.now();
    if (start) {
        console.log(`[INFO]:\t ${msg}, took ${smartFormat(now, start)}`);
    } else {
        console.log(`[INFO]:\t ${msg}`);
    }
    return now;
}