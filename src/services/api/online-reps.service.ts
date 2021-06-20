import { formatError } from '@app/services';
import { representativesOnlineRpc } from '@app/rpc';
import { RepresentativesOnlineWeightResponse } from '@dev-ptera/nano-node-rpc';

const onlineRepsPromise = (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        representativesOnlineRpc()
            .then((data: RepresentativesOnlineWeightResponse) => {
                const reps: string[] = [];
                for (const rep in data.representatives) {
                    reps.push(rep);
                }
                resolve(reps);
            })
            .catch((err) => {
                reject(formatError('onlineRepsPromise', err));
            });
    });
};

export const getOnlineReps = (req, res): void => {
    onlineRepsPromise()
        .then((data: string[]) => {
            res.send(data);
        })
        .catch((err) => {
            console.error(`[ERROR]: Could not fetch online reps.`);
            res.status(500).send(err);
        });
};
