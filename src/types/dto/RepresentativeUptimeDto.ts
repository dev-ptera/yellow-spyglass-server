export type RepresentativeUptimeDto = {
    address: string;
    online: boolean;
    uptimePercentDay: number;
    uptimePercentWeek: number;
    uptimePercentMonth: number;
    uptimePercentSemiAnnual: number;
    uptimePercentYear: number;
    lastOfflineDurationMinutes: number;

    /* Not provided if representative has been offline. */
    lastOfflineDateMs?: number;
    lastOfflineDate?: string;
};
