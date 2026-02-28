export type SocketMessage = {
    id?: string,
    type: string,
    namespace: string,
    desc: string,
    class?: string,
    source: string,
    timestamp: string,
    properties?: Record<string, unknown>,
    context?: Record<string, unknown>,
    data?: {
        configVersion?: number,
        interactions?: unknown[]
    } | unknown,
    device?: string,
    read?: boolean
}
