import axios, { AxiosResponse } from 'axios';
import {MonitoredRepDto, PeerMonitorStats} from "../../types";
import {getPeersRpc, Peers} from "../../rpc/calls/peers";


// Given peer IP, queries banano node monitor stats.
const getPeerMonitorStats = (ip: string): Promise<PeerMonitorStats> =>
    axios
        .request<PeerMonitorStats>({
            method: 'get',
            timeout: 4000,
            url: `http://${ip}/api.php`,
        })
        .then((response: AxiosResponse<PeerMonitorStats>) => Promise.resolve(response.data))
        .catch(() => Promise.resolve(undefined));

// Prunes/Grooms data that is returned to client.
const groomDto = (allPeerStats: PeerMonitorStats[]): MonitoredRepDto[] => {
    const groomedDetails: MonitoredRepDto[] = [];
    for (const peerStats of allPeerStats) {
        if (peerStats) {
            groomedDetails.push({
                address: peerStats.nanoNodeAccount,
                representative: peerStats.repAccount,
                weight: 0,
                delegators: 0,
                name: peerStats.nanoNodeName,
                peers: peerStats.numPeers,
                online: true,
                cementedBlocks: peerStats.cementedBlocks,
                confirmationInfo: peerStats.confirmationInfo,
                ip: peerStats.ip,
                version: peerStats.version,
                location: peerStats.nodeLocation,
                nodeUptimeStartup: peerStats.nodeUptimeStartup,
                confirmedBlocks: peerStats.confirmedBlocks,
                uncheckedBlocks: peerStats.uncheckedBlocks,
                currentBlock: peerStats.currentBlock,
                systemLoad: peerStats.systemLoad,
                totalMem: peerStats.totalMem,
                usedMem: peerStats.usedMem,
            });
        }
    }
    return groomedDetails;
};

// Sample: [::ffff:178.128.46.252]:7071
const extractIpAddress = (dirtyIp: string): string => dirtyIp.replace('::ffff:', '').match(/(?<=\[).+?(?=\])/)[0];

// Fetches banano peer details, then sends groomed response.
const getRepDetails = (rpcData: Peers): Promise<MonitoredRepDto[]> => {
    const PeerMonitorStatsPromises: Array<Promise<PeerMonitorStats>> = [];
    for (const dirtyIp in rpcData.peers) {
        const ip = extractIpAddress(dirtyIp);
        const rpcDetails = rpcData.peers[dirtyIp];
        if (ip && rpcDetails) {
            PeerMonitorStatsPromises.push(getPeerMonitorStats(ip));
        }
    }
    return Promise.all(PeerMonitorStatsPromises)
        .then((data) => Promise.resolve(groomDto(data)))
        .catch((err) => Promise.reject(err));
};

// banano creeper does not have a api.php.
export const getPeersService = async (req, res): Promise<void> =>
    new Promise((resolve, reject) => {
        getPeersRpc()
            .then((peers: Peers) => {
                getRepDetails(peers).then((details: MonitoredRepDto[]) => {
                    res.send(JSON.stringify(details));
                    return Promise.resolve();
                }).catch(reject);
            })
            .catch(reject);
    });