import { AWSCredentials } from 'clients/aws';

export enum IdentityType {
    ACCOUNT = 'account',
    IAM_USER = 'iam_user',
    SERVICE_USER = 'service_role',
    ASSUMED_ROLE = 'assumed_role',
}

export interface IdentityRef {
    type: IdentityType;
    name: string;
    // Account of the identity, required for every type but accounts
    accountName?: string;
}

// Credentials of the identities the tests use, kept for the whole worker so the
// scenarios reuse accounts, users and role sessions instead of creating them
// again. The identity a scenario signs its requests with is kept on its World.
const credentialsByIdentity = new Map<string, AWSCredentials>();

function key(type: IdentityType, name: string, accountName?: string): string {
    if (type === IdentityType.ACCOUNT) {
        return `${type}/${name}`;
    }
    if (!accountName) {
        throw new Error(`Account name is required for ${type} "${name}"`);
    }
    return `${type}/${accountName}/${name}`;
}

export function saveCredentials(
    type: IdentityType, name: string, credentials: AWSCredentials, accountName?: string,
): void {
    credentialsByIdentity.set(key(type, name, accountName), credentials);
}

// Credentials of an identity, or undefined when it has none
export function getCredentials(type: IdentityType, name: string, accountName?: string): AWSCredentials | undefined {
    const credentials = credentialsByIdentity.get(key(type, name, accountName));
    return credentials?.accessKeyId ? credentials : undefined;
}
