import {
    MonitoredRepDto,
    RepresentativeDto,
    SpyglassRepresentativeDto,
} from '@app/types';

export const transformLargeRepsDto = (
    largeReps: SpyglassRepresentativeDto[],
    onlineReps: string[],
    prWeight: number
): RepresentativeDto[] => {
    const onlineSet = new Set(onlineReps);
    const dtos: RepresentativeDto[] = [];
    largeReps.map((rep) => {
        dtos.push({
            address: rep.address,
            weight: rep.weight,
            online: onlineSet.has(rep.address),
            delegatorsCount: rep.delegatorsCount,
            principal: rep.weight >= prWeight,
            lastOutage: rep.uptimeStats.lastOutage,
            uptimePercentDay:  Number(rep.uptimeStats.uptimePercentages.day.toFixed(1)),
            uptimePercentWeek:  Number(rep.uptimeStats.uptimePercentages.week.toFixed(1)),
            uptimePercentMonth:  Number(rep.uptimeStats.uptimePercentages.month.toFixed(1)),
            uptimePercentSemiAnnual: Number(rep.uptimeStats.uptimePercentages.semiAnnual.toFixed(1)),
            uptimePercentYear:  Number(rep.uptimeStats.uptimePercentages.year.toFixed(1)),
            creationUnixTimestamp: rep.uptimeStats.trackingStartUnixTimestamp,
            creationDate: rep.uptimeStats.trackingStartDate,
        });
    });
    return dtos;
};

export const transformMonitoredRepsDto = (monitoredReps: SpyglassRepresentativeDto[]): MonitoredRepDto[] => {
    const dtos: MonitoredRepDto[] = [];
    monitoredReps.map((rep) => {
        dtos.push({
            address: rep.address,
            weight: rep.weight,
            online: true,
            delegatorsCount: rep.delegatorsCount,
            protocolVersion: rep.nodeMonitorStats.version,
            representative: rep.nodeMonitorStats.representative,
            peers: rep.nodeMonitorStats.peers,
            name: rep.nodeMonitorStats.name,
            version: rep.nodeMonitorStats.version,
            currentBlock: rep.nodeMonitorStats.currentBlock,
            uncheckedBlocks: rep.nodeMonitorStats.uncheckedBlocks,
            cementedBlocks: rep.nodeMonitorStats.cementedBlocks,
            systemUptime: String(rep.nodeMonitorStats.nodeUptimeStartup),
            usedMem: rep.nodeMonitorStats.usedMem,
            totalMem: rep.nodeMonitorStats.totalMem,
            systemLoad: rep.nodeMonitorStats.systemLoad,
            nodeUptimeStartup: rep.nodeMonitorStats.nodeUptimeStartup,
            location: rep.nodeMonitorStats.location,
            ip: rep.nodeMonitorStats.ip,
        });
    });
    return sortMonitoredRepsByName(dtos);
};


export const sortMonitoredRepsByName = (onlineReps: MonitoredRepDto[]): MonitoredRepDto[] =>
    onlineReps.sort(function (a, b) {
        if (a.name === undefined) {
            a.name = '';
        }
        if (b.name === undefined) {
            b.name = '';
        }
        const textA = a.name.toUpperCase();
        const textB = b.name.toUpperCase();
        return textA < textB ? -1 : textA > textB ? 1 : 0;
    });
