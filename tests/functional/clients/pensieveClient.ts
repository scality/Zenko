interface SwaggerOperation {
    operationId?: string;
    [key: string]: unknown;
}

interface SwaggerSpec {
    basePath?: string;
    paths: Record<string, Record<string, SwaggerOperation>>;
}

interface UserV1 {
    userName: string;
    email: string;
}

interface EndpointV1 {
    hostname: string;
    locationName: string;
}

interface LocationV1 {
    name: string;
    locationType: string;
    details: Record<string, unknown>;
}

export interface UserResponse {
    id: string;
    userName: string;
}

export class PensieveClient {
    private readonly endpoint: string;
    private readonly token: string;
    private readonly operationPaths = new Map<string, { method: string; path: string }>();

    constructor(endpoint: string, token: string) {
        this.endpoint = endpoint;
        this.token = token;
    }

    async init(): Promise<void> {
        const response = await fetch(`${this.endpoint}/swagger.json`, {
            headers: { 'X-Authentication-Token': this.token },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch swagger spec: ${response.status} ${response.statusText}`);
        }
        const spec = await response.json() as SwaggerSpec;
        const basePath = (spec.basePath ?? '').replace(/\/$/, '');
        for (const [path, pathItem] of Object.entries(spec.paths)) {
            for (const [method, operation] of Object.entries(pathItem)) {
                if (operation.operationId) {
                    this.operationPaths.set(operation.operationId, { method, path: `${basePath}${path}` });
                }
            }
        }
        console.log(`[pensieve] Loaded ${this.operationPaths.size} operations from swagger spec`);
    }

    private buildUrl(operationId: string, pathParams: Record<string, string>): { url: string; method: string } {
        const op = this.operationPaths.get(operationId);
        if (!op) {
            throw new Error(`Unknown swagger operation: ${operationId}`);
        }
        const resolvedPath = Object.entries(pathParams).reduce(
            (p, [k, v]) => p.replace(`{${k}}`, v),
            op.path,
        );
        return { url: `${this.endpoint}${resolvedPath}`, method: op.method.toUpperCase() };
    }

    private async call<T>(operationId: string, pathParams: Record<string, string>, body: unknown): Promise<T> {
        const { url, method } = this.buildUrl(operationId, pathParams);
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Authentication-Token': this.token,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(
                `${operationId} failed [${response.status} ${response.statusText}]\n` +
                `  URL: ${method} ${url}\n` +
                `  Response: ${text || '(empty)'}`
            );
        }
        const text = await response.text();
        return (text ? JSON.parse(text) : {}) as T;
    }

    async createUser(uuid: string, userName: string): Promise<UserResponse> {
        const user: UserV1 = { userName, email: `${userName}@zenko.local` };
        return this.call<UserResponse>('createConfigurationOverlayUser', { uuid }, user);
    }

    async createEndpoint(uuid: string, hostname: string, locationName: string): Promise<void> {
        const endpoint: EndpointV1 = { hostname, locationName };
        await this.call<unknown>('createConfigurationOverlayEndpoint', { uuid }, endpoint);
    }

    async createLocation(uuid: string, location: LocationV1): Promise<void> {
        if (!location.details.bootstrapList) {
            location.details.bootstrapList = [];
        }
        await this.call<unknown>('createConfigurationOverlayLocation', { uuid }, location);
    }
}
