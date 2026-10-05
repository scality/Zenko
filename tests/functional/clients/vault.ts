import VaultIAMClient from 'vaultclient/lib/IAMClient';
import { AWSCredentials } from './aws';

export interface VaultConnection {
    host: string;
    port: number;
    https: boolean;
    credentials: AWSCredentials;
}

export interface VaultAccount {
    id: string;
    name: string;
    arn: string;
}

export interface RolesForWebIdentity {
    data: {
        IsTruncated: boolean;
        Accounts: {
            Name: string;
            CreationDate: string;
            Roles: {
                Name: string;
                Arn: string;
            }[];
        }[];
        Marker?: string;
    };
}

function createClient({ host, port, https, credentials }: VaultConnection): VaultIAMClient {
    return new VaultIAMClient(host, port, https, undefined, undefined, undefined, true,
        credentials.accessKeyId, credentials.secretAccessKey, undefined, undefined, credentials.sessionToken);
}

function call<T>(fn: (callback: (err: unknown, data: T) => void) => void): Promise<T> {
    return new Promise<T>((resolve, reject) => fn((err, data) => (err ? reject(err) : resolve(data))));
}

/**
 * Vault admin API (account management), authenticated with admin credentials.
 */
export class VaultAdminClient {
    private readonly client: VaultIAMClient;

    constructor(connection: VaultConnection) {
        this.client = createClient(connection);
    }

    createAccount(accountName: string): Promise<{ account: VaultAccount }> {
        const options = { email: `${accountName}@scality.com`, quota: '' };
        return call(cb => this.client.createAccount(accountName, options, cb));
    }

    getAccount(accountName: string): Promise<VaultAccount> {
        return call(cb => this.client.getAccount({ accountName }, cb));
    }

    async deleteAccount(accountName: string): Promise<void> {
        await call(cb => this.client.deleteAccount(accountName, cb));
    }

    async generateAccountAccessKey(accountName: string): Promise<AWSCredentials> {
        const key = await call<{ id: string, value: string }>(
            cb => this.client.generateAccountAccessKey(accountName, cb, {}));
        return { accessKeyId: key.id, secretAccessKey: key.value };
    }

    getRolesForWebIdentity(webIdentityToken: string, marker?: string): Promise<RolesForWebIdentity> {
        return call(cb => this.client.getRolesForWebIdentity(webIdentityToken, { maxItems: 1000, marker }, cb));
    }
}

/**
 * Vault auth API, authenticated with a regular user's credentials (IAM on admin routes).
 */
export class VaultAuthClient {
    private readonly client: VaultIAMClient;

    constructor(connection: VaultConnection) {
        this.client = createClient(connection).enableIAMOnAdminRoutes();
    }

    getAccountsByName(accountNames: string[]): Promise<unknown> {
        return call(cb => this.client.getAccounts(accountNames, undefined, undefined, { accountNames: true }, cb));
    }
}
