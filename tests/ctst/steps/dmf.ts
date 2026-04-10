import { Then, Given, After } from '@cucumber/cucumber';
import assert from 'assert';
import { execShellCommand } from 'common/utils';
import Zenko from 'world/Zenko';

// The mock-sorbet pod uses a distroless image (no shell, rm, find, etc.),
// so we cannot kubectl exec into it.  Instead, we spin up a short-lived
// busybox pod that mounts the same PVC ('sorbet-data', deployed by
// deploy-sorbet-resources.sh) and run file-system commands there.
async function execOnSorbetPvc(cmd: string): Promise<string> {
    const podName = `dmf-util-${Math.random().toString(36).slice(2, 8)}`;
    const spec = JSON.stringify({
        spec: {
            volumes: [{ name: 'vol', persistentVolumeClaim: { claimName: 'sorbet-data' } }],
            containers: [{
                name: 'util',
                image: 'busybox:1',
                command: ['sh', '-c', cmd],
                volumeMounts: [{ name: 'vol', mountPath: '/cold-data' }],
            }],
        },
    }).replace(/'/g, "'\\''");
    // Use --attach (not -i/--stdin) so kubectl does not wait for stdin EOF,
    // which would hang when called from Node.js exec() whose stdin pipe is
    // never closed by the caller.
    return execShellCommand(
        `kubectl run ${podName} --image=busybox:1 --attach --rm --restart=Never --overrides='${spec}'`,
    );
}

async function cleanDmfVolume() {
    await execOnSorbetPvc('rm -rf /cold-data/*');
}

Then('dmf volume should contain {int} objects',
    { timeout: 2 * 60 * 1000 }, async (objectCount: number) => {
        let conditionOk = false;
        while (!conditionOk) {
            // Getting the number of objects inside the volume used
            // by the mock dmf to store transitioned objects
            const outStr = await execOnSorbetPvc('find /cold-data -type f | wc -l');
            // we store two files per object (content and manifest.json)
            // kubectl may append "pod deleted" to stdout; take only the first line
            const count = Number(outStr.split('\n')[0].trim());
            conditionOk = count === objectCount * 2;
            if (!conditionOk) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        assert(conditionOk);
    });

Given('a flaky backend that will require {int} retries for {string}',
    function (this: Zenko, retryNumber: number, op: string) {
        assert(['restore', 'archive', 'command'].includes(op), `Invalid operation ${op}`);
        assert(retryNumber > 0, `Invalid retry number ${retryNumber}`);

        this.addToSaved('backendFlakinessRetryNumber', retryNumber);
        this.addToSaved('backendFlakiness', op);
    });

After({ tags: '@Dmf' }, async () => {
    await cleanDmfVolume();
});
