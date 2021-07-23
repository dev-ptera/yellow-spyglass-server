export type RepresentativeUptimeDto = {
    address: string;
    online: boolean;
    uptimePercentDay: number;
    uptimePercentWeek: number;
    uptimePercentMonth: number;
    uptimePercentSemiAnnual: number;
    uptimePercentYear: number;
    lastOfflineDurationMinutes: number;
    lastOfflineDateMs: number;
    lastOfflineDate: string;
}
