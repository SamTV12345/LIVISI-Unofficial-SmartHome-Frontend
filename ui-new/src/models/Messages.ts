export type Message = {
    id: string,
    type: string,
    class?: string,
    namespace?: string,
    timestamp: string,
    read: boolean,
    devices?: string[],
    messages?: string[],
    capabilities?: string[],
    properties?: Record<string, unknown>
}
