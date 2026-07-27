import * as fs from 'fs/promises';
import * as path from 'path';
import type { RequestLogger } from 'werelogs';

const LOCK_DIR = '/tmp';

interface RunOnceOptions {
    lockName: string;
    logger: RequestLogger;
    timeout?: number;
    pollInterval?: number;
}

interface CompletionRecord {
    performedBy: string;
    error?: string;
}

async function waitForCompletion(
    completedFile: string,
    lockName: string,
    timeout: number,
    pollInterval: number,
): Promise<void> {
    const endTime = timeout === -1 ? Infinity : Date.now() + timeout;
    while (Date.now() < endTime) {
        try {
            const content = await fs.readFile(completedFile, 'utf8');
            const record = JSON.parse(content) as CompletionRecord;
            if (record.error) {
                throw new Error(
                    `Coordinated work '${lockName}' failed on worker ${record.performedBy}: ${record.error}`,
                );
            }
            return;
        } catch (err) {
            if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT') {
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                continue;
            }
            throw err;
        }
    }
    throw new Error(`Timed out after ${timeout}ms waiting for work '${lockName}' to complete.`);
}

/**
 * Executes a task exactly once across all parallel workers.
 * The first worker to acquire the lock runs the task; others wait for it to complete.
 * If the task fails, the error is propagated to all waiting workers.
 */
export async function runOnceAcrossWorkers(
    options: RunOnceOptions,
    workFunction: () => Promise<void>,
): Promise<void> {
    const { lockName, logger, timeout = -1, pollInterval = 250 } = options;
    const workerId = `worker-${process.pid}`;
    const pendingFile = path.join(LOCK_DIR, `ctst-${lockName}.pending`);
    const completedFile = path.join(LOCK_DIR, `ctst-${lockName}.completed`);

    // Fast path: already completed
    try {
        const content = await fs.readFile(completedFile, 'utf8');
        const record = JSON.parse(content) as CompletionRecord;
        if (record.error) {
            throw new Error(`Coordinated work '${lockName}' failed on worker ${record.performedBy}: ${record.error}`);
        }
        return;
    } catch (err) {
        if (!(err instanceof Error) || (err as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw err;
        }
        logger.debug('Work not yet completed, attempting to acquire lock', { lockName });
    }

    // Try to become the executing worker
    try {
        await fs.writeFile(pendingFile, workerId, { flag: 'wx' });
    } catch (error) {
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'EEXIST') {
            await waitForCompletion(completedFile, lockName, timeout, pollInterval);
            return;
        }
        throw error;
    }

    // Holding the lock : run the work
    try {
        logger.debug(`Worker ${workerId} executing work for ${lockName}`);
        await workFunction();
        await fs.writeFile(completedFile, JSON.stringify({ performedBy: workerId }));
        logger.info(`Work for ${lockName} completed by ${workerId}`);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        await fs.writeFile(
            completedFile,
            JSON.stringify({ performedBy: workerId, error: errorMessage }),
        ).catch(() => {});
        throw err;
    } finally {
        await fs.unlink(pendingFile).catch(() => {});
    }
}
