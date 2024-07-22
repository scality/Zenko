import util from 'util';
import { exec } from 'child_process';

import Zenko from 'world/Zenko';

type InstallConfig = {
    sourceZenkoDrInstance?: string;
    sourceKafkaReplicas?: number;
    sourceConnectorReplicas?: number;
    sinkZenkoDrInstance?: string;
    sinkKafkaReplicas?: number;
    sinkConnectorReplicas?: number;
    kafkaClusterLocation?: string;
    kafkaNodePortStartingPort?: number;
    kafkaPersistenceExistingPv?: string;
    kafkaPersistenceSize?: string;
    kafkaPersistenceStorageClassName?: string;
    kafkaPersistenceAnnotations?: string;
    kafkaPersistenceSelector?: string;
    locations?: string;
    s3Bucket?: string;

    sourceKubeconfigPath?: string;
    sourceKubeconfigData?: string;
    sinkKubeconfigPath?: string;
    sinkKubeconfigData?: string;
    sinkZenkoInstance?: string;
    sinkZenkoNamespace?: string;
    sourceZenkoInstance?: string;
    sourceZenkoNamespace?: string;

    sourceS3Endpoint?: string;
    sourceS3UserSecretName?: string;
    sourceSs3AccessKeyField?: string;
    sourceS3SecretKeyField?: string;
    sourceS3Region?: string;

    sinkS3Endpoint?: string;
    sinkS3UserSecretName?: string;
    sinkSs3AccessKeyField?: string;
    sinkS3SecretKeyField?: string;
    sinkS3Region?: string;
};

type BootstrapDumpConfig = {
    createBucketIfNotExists?: boolean;
    cleanupBucketBeforeDump?: boolean;
    locations?: string[];
    oidcProviders?: string[];
    s3Bucket?: string;
    mongodbHosts?: string[];
    mongodbUsername?: string;
    mongodbPassword?: string;
    mongodbDatabase?: string;
    mongodbReplicaset?: string;
    mongodbReadPref?: string;
    mongodbAuthDatabase?: string;
    s3Endpoint?: string;
    s3AccessKey?: string;
    s3SecretKey?: string;
    s3Region?: string;
};

type BootstrapLoadConfig = {
    mongodbSourceDatabase?: string;
    parallel?: number;
    dropCollections?: boolean;
    s3Bucket?: string;
    mongodbHosts?: string[];
    mongodbUsername?: string;
    mongodbPassword?: string;
    mongodbDatabase?: string;
    mongodbReplicaset?: string;
    mongodbReadPref?: string;
    mongodbAuthDatabase?: string;
    s3Endpoint?: string;
    s3AccessKey?: string;
    s3SecretKey?: string;
    s3Region?: string;
};

type VolumeGetConfig = {
    targetZenkoKubeconfigPath?: string;
    targetZenkoKubeconfigData?: string;
    targetZenkoInstance?: string;
    targetZenkoNamespace?: string;
    volumeName?: string;
    volumeNodeName?: string;
    timeout?: number;
};

type FailoverConfig = {
    wait?: boolean;
    timeout?: number;
    sinkKubeconfigPath?: string;
    sinkKubeconfigData?: string;
    sinkZenkoInstance?: string;
    sinkZenkoNamespace?: string;
};

type UninstallConfig = {
    sinkZenkoDrInstance?: string;
    sourceZenkoDrInstance?: string;
    wait?: boolean;
    timeout?: string;
    sourceKubeconfigPath?: string;
    sourceKubeconfigData?: string;
    sinkKubeconfigPath?: string;
    sinkKubeconfigData?: string;
    sinkZenkoInstance?: string;
    sinkZenkoNamespace?: string;
    sourceZenkoInstance?: string;
    sourceZenkoNamespace?: string;
};

type StatusConfig = {
    sourceKubeconfigPath?: string;
    sourceKubeconfigData?: string;
    sinkKubeconfigPath?: string;
    sinkKubeconfigData?: string;
    sourceZenkoInstance?: string;
    sourceZenkoNamespace?: string;
    sinkZenkoInstance?: string;
    sinkZenkoNamespace?: string;
    sourceZenkoDRInstance?: string;
    sinkZenkoDRInstance?: string;
    output?: string;
};

/**
 * Helper class to run Drctl tool
 */
export default class ZenkoDrctl {
    private world: Zenko;

    constructor(world: Zenko) {
        this.world = world;
    }

    private async runCommand(action: string, params: string, timeout = 600, wait = true) {
        const command = `/ctst/zenko-drctl install ${wait ? '--wait' : ''} ${timeout > 0 ?
            `--timeout ${timeout}` : ''} ${params}`;
        try {
            this.world.logger.debug('running zenko-drctl command', { command });
            const result = await util.promisify(exec)(command);
            this.world.logger.debug('zenko-drctl command result', { result });
            return result.stdout;
        } catch (err) {
            this.world.logger.debug('zenko-drctl command failed', { err });
            throw new Error('Failed to run zenko-drctl command');
        }
    }

    async install(config: InstallConfig) {
        return this.runCommand('install', this.paramToCli(config));
    }

    async uninstall(config: UninstallConfig) {
        return this.runCommand('uninstall', this.paramToCli(config));
    }

    async bootstrapDump(config: BootstrapDumpConfig) {
        return this.runCommand('bootstrap dump', this.paramToCli(config));
    }

    async bootstrapLoad(config: BootstrapLoadConfig) {
        return this.runCommand('bootstrap load', this.paramToCli(config));
    }

    async failover(config: FailoverConfig) {
        return this.runCommand('failover', this.paramToCli(config));
    }

    async status(config: StatusConfig) {
        return this.runCommand('status', this.paramToCli(config));
    }

    // TODO: can we test volume create/delete commands (use metalk8s) in Zenko?
    async kafkaGetVolume(config: VolumeGetConfig) {
        return this.runCommand('get volume', this.paramToCli(config));
    }

    paramToCli(params: Record<string, unknown>): string {
        const command: string[] = [];
        Object.keys(params).forEach(key => {
            const value = params[key];
            if (value !== undefined && value !== null) {
                command.push(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
                command.push(String(value));
            }
        });
        return command.join(' ');
    }
}
