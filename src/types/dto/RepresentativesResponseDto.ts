import { RepresentativeDto } from './RepresentativeDto';
import { MonitoredRepDto } from './MonitoredRepDto';

export type RepresentativesResponseDto = {
    representatives: RepresentativeDto[];
    monitoredReps: MonitoredRepDto[];
};
