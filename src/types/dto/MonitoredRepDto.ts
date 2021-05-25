import {RepresentativeDto} from "./RepresentativeDto";

export type MonitoredRepDto = RepresentativeDto & {
    /* Optional (populated from node-monitor) */
    protocolVersion?: string;
    representative?: string;
    peers?: number;
    name?: string;
    version?: string;
    currentBlock?: number;
    uncheckedBlocks?: number;
    cementedBlocks?: number;
    confirmedBlocks?: number;
    systemUptime?: string;
    usedMem?: number;
    totalMem?: number;
    confirmationInfo?: {
        average: number;
    };
    systemLoad?: number;
    nodeUptimeStartup?: number;
    location?: string;
    ip?: string;
}