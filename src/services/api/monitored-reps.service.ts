import axios, { AxiosResponse } from 'axios';
import { MonitoredRepDto, PeerMonitorStats } from '@app/types';
import { peersRpc, Peers } from '@app/rpc';
import { formatError, populateDelegatorsCount } from '@app/services';

// Given peer IP, queries banano node monitor stats.
const getPeerMonitorStats = (ip: string): Promise<PeerMonitorStats> =>
    axios
        .request<PeerMonitorStats>({
            method: 'get',
            timeout: 4000,
            url: `http://${ip}/api.php`,
        })
        .then((response: AxiosResponse<PeerMonitorStats>) => {
            response.data.ip = ip;
            return Promise.resolve(response.data);
        })
        .catch(() => Promise.resolve(undefined));

// Prunes/Grooms data that is returned to client.
const groomDto = async (allPeerStats: PeerMonitorStats[]): Promise<MonitoredRepDto[]> => {
    const groomedDetails: MonitoredRepDto[] = [];
    const delegatorsCountMap = new Map<string, { delegatorsCount: number }>();
    for (const peerStats of allPeerStats) {
        if (peerStats && peerStats.nanoNodeAccount) {
            delegatorsCountMap.set(peerStats.nanoNodeAccount, { delegatorsCount: 0 });
            groomedDetails.push({
                address: peerStats.nanoNodeAccount,
                representative: peerStats.repAccount,
                weight: peerStats.votingWeight,
                delegatorsCount: 0,
                name: peerStats.nanoNodeName,
                peers: Number(peerStats.numPeers),
                online: true,
                cementedBlocks: peerStats.cementedBlocks,
                confirmationInfo: peerStats.confirmationInfo,
                ip: peerStats.ip,
                version: peerStats.version,
                location: peerStats.nodeLocation,
                nodeUptimeStartup: peerStats.nodeUptimeStartup,
                confirmedBlocks: Number(peerStats.confirmedBlocks),
                uncheckedBlocks: Number(peerStats.uncheckedBlocks),
                currentBlock: Number(peerStats.currentBlock),
                systemLoad: peerStats.systemLoad,
                totalMem: peerStats.totalMem,
                usedMem: peerStats.usedMem,
            });
        }
    }

    await populateDelegatorsCount(delegatorsCountMap).catch((err) => Promise.reject(err));
    groomedDetails.map((dto) => (dto.delegatorsCount = delegatorsCountMap.get(dto.address).delegatorsCount));
    return Promise.resolve(groomedDetails);
};

// Sample: [::ffff:178.128.46.252]:7071
const extractIpAddress = (dirtyIp: string): string => dirtyIp.replace('::ffff:', '').match(/(?<=\[).+?(?=\])/)[0];

// Fetches banano peer details, then sends groomed response.
const getRepDetails = (rpcData: Peers): Promise<MonitoredRepDto[]> => {
    const peerMonitorStatsPromises: Array<Promise<PeerMonitorStats>> = [];

    // Include my own node too
    peerMonitorStatsPromises.push(getPeerMonitorStats('108.39.249.5'));
    // Add all peer ips to the list of ips to fetch
    for (const dirtyIp in rpcData.peers) {
        const ip = extractIpAddress(dirtyIp);
        const rpcDetails = rpcData.peers[dirtyIp];
        if (ip && rpcDetails) {
            peerMonitorStatsPromises.push(getPeerMonitorStats(ip));
        }
    }
    return Promise.all(peerMonitorStatsPromises)
        .then((data) =>
            groomDto(data)
                .then((groomed) => Promise.resolve(groomed))
                .catch((err) => Promise.reject(formatError('getMonitoredRepsService.groomDto', err)))
        )
        .catch((err) => Promise.reject(formatError('getMonitoredRepsService.getRepDetails', err)));
};

// banano creeper does not have a api.php.
export const getPeersService = async (req, res): Promise<void> =>
    new Promise((resolve, reject) => {
        peersRpc()
            .then((peers: Peers) => {
                getRepDetails(peers)
                    .then((details: MonitoredRepDto[]) => {
                        res.send(JSON.stringify(details));
                        return Promise.resolve();
                    })
                    .catch((err) => {
                        res.status(500).send(formatError('getPeersService', err));
                        return Promise.resolve();
                    });
            })
            .catch((err) => {
                res.status(500).send(formatError('getPeersService', err));
                return Promise.resolve();
            });
    });

export const getMonitoredRepsService = async (): Promise<MonitoredRepDto[]> =>
    new Promise((resolve, reject) => {
        peersRpc()
            .then((peers: Peers) => {
                getRepDetails(peers)
                    .then((details: MonitoredRepDto[]) => {
                        details.sort(function (a, b) {
                            const textA = a.name.toUpperCase();
                            const textB = b.name.toUpperCase();
                            return textA < textB ? -1 : textA > textB ? 1 : 0;
                        });
                        resolve(details);
                    })
                    .catch((err) => reject(formatError('getMonitoredRepsService', err)));
            })
            .catch((err) => reject(formatError('getMonitoredRepsService', err)));
    });
