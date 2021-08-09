import axios, { AxiosResponse } from 'axios';
import { MonitoredRepDto, PeerMonitorStats } from '@app/types';
import { peersRpc, Peers } from '@app/rpc';
import { isRepOnline, LOG_ERR, populateDelegatorsCount } from '@app/services';
import { MANUAL_PEER_MONITOR_IPS, NANO_CLIENT } from '@app/config';
import * as RPC from '@dev-ptera/nano-node-rpc';
import { on } from 'cluster';

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

            /* Remove non-banano representatives from the peers list. */
            if (!response.data.repAccount.includes('ban_')) {
                return Promise.resolve(undefined);
            }

            return Promise.resolve(response.data);
        })
        .catch(() => Promise.resolve(undefined));

// Prunes/Grooms data that is returned to client.
const groomDto = async (allPeerStats: PeerMonitorStats[]): Promise<MonitoredRepDto[]> => {
    const groomedDetails: MonitoredRepDto[] = [];
    const delegatorsCountMap = new Map<string, { delegatorsCount: number }>();

    // Get all online reps from nano rpc.
    const onlineReps = (await NANO_CLIENT.representatives_online()) as RPC.RepresentativesOnlineResponse;
    const onlineSet = new Set<string>();
    for (const rep of onlineReps.representatives) {
        onlineSet.add(rep);
    }

    for (const peerStats of allPeerStats) {
        if (
            peerStats &&
            peerStats.nanoNodeAccount &&
            // Only show monitors that are actually online;
            // isRepOnline won't return correct results on initial load due to race condition, so we use reps_online rpc call too as a failsafe.
            (isRepOnline(peerStats.nanoNodeAccount) || onlineSet.has(peerStats.nanoNodeAccount))
        ) {
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
    const duplicateIpSet = new Set<string>();

    // This service includes the ability to manually hard-code peer monitor ips.
    // Even if this node isn't directly connected to these monitors as a peer, we can still display their node stats.
    MANUAL_PEER_MONITOR_IPS.map((ip: string) => {
        peerMonitorStatsPromises.push(getPeerMonitorStats(ip));
        duplicateIpSet.add(ip);
    });

    // Add all peer ips to the list of ips to fetch
    for (const dirtyIp in rpcData.peers) {
        const ip = extractIpAddress(dirtyIp);
        const rpcDetails = rpcData.peers[dirtyIp];
        if (ip && rpcDetails && !duplicateIpSet.has(ip)) {
            peerMonitorStatsPromises.push(getPeerMonitorStats(ip));
            duplicateIpSet.add(ip);
        }
    }
    return Promise.all(peerMonitorStatsPromises)
        .then((data) =>
            groomDto(data)
                .then((groomed) => Promise.resolve(groomed))
                .catch((err) => Promise.reject(LOG_ERR('getMonitoredReps.groomDto', err)))
        )
        .catch((err) => Promise.reject(LOG_ERR('getMonitoredReps.getRepDetails', err)));
};

// banano creeper does not have a api.php.
export const getPeers = (req, res): void => {
    peersRpc()
        .then((peers: Peers) => {
            getRepDetails(peers)
                .then((details: MonitoredRepDto[]) => {
                    res.send(JSON.stringify(details));
                })
                .catch((err) => {
                    res.status(500).send(LOG_ERR('getPeers', err));
                });
        })
        .catch((err) => {
            res.status(500).send(LOG_ERR('getPeers', err));
        });
};

/** Using a combination of hard-coded ips & the peers RPC command, returns a list of representatives running the Nano Node Monitor software. */
export const getMonitoredReps = async (): Promise<MonitoredRepDto[]> =>
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
                    .catch((err) => reject(LOG_ERR('getMonitoredReps', err)));
            })
            .catch((err) => reject(LOG_ERR('getMonitoredReps', err)));
    });
