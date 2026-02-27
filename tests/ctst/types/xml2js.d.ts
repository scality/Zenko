declare module 'xml2js' {
    export function parseStringPromise(xml: string): Promise<unknown>;
}
