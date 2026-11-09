/**
 * Error of an API call. AWS SDK service exceptions also carry the HTTP status
 * and whether the request was throttled.
 */
export type ApiError = Error & {
    $metadata?: { httpStatusCode?: number };
    $retryable?: { throttling?: boolean };
};

/**
 * Outcome of an API call, kept on the World between the step that makes the
 * call and the steps that check it.
 */
export interface ApiResult<T = unknown> {
    data?: T;
    error?: ApiError;
}

/**
 * Waits for a request and keeps either its response or its error, for steps
 * whose outcome is checked later rather than thrown.
 */
export async function settle<T>(request: Promise<T>): Promise<ApiResult<T>> {
    try {
        return { data: await request };
    } catch (error) {
        return { error: error as ApiError };
    }
}

/**
 * Whether the call failed with an error whose name or message contains `expected`,
 * e.g. "AccessDenied" or "does not exist".
 */
export function failedWith(result: ApiResult, expected: string): boolean {
    return !!result.error && `${result.error.name}: ${result.error.message}`.includes(expected);
}

/**
 * Whether the call succeeded, or failed with an error containing `expected`
 */
export function succeededOrFailedWith(result: ApiResult, expected: string): boolean {
    return !result.error || failedWith(result, expected);
}
