export interface Command {
    stdout: string;
    data?: unknown;
    err?: string | null;
    stderr?: string;
    code?: string;
    statusCode?: number;
    retryable?: {
        throttling?: boolean;
    };
}

interface SdkError {
    name: string;
    message: string;
    $metadata?: { httpStatusCode?: number };
    $retryable?: { throttling?: boolean };
}

/**
 * Runs an AWS SDK request and turns its outcome into a Command result, for steps
 * that assert on the result rather than on a thrown error.
 */
export async function toCommand(request: Promise<object>): Promise<Command> {
    try {
        const response: { Body?: unknown, $metadata?: { httpStatusCode?: number } } = { ...await request };
        // Bodies are streams, they are not part of the result
        delete response.Body;
        return { stdout: JSON.stringify(response), err: null, statusCode: response.$metadata?.httpStatusCode };
    } catch (error) {
        const { name, message, $metadata, $retryable } = error as SdkError;
        return { stdout: '', err: `${name}: ${message}`, statusCode: $metadata?.httpStatusCode, retryable: $retryable };
    }
}
