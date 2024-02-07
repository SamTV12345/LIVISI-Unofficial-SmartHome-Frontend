export type SocketMessage = {
    type: string,
    namespace: string,
    desc: string,
    source: string,
    timestamp: string,
    properties: any,
    context: any,
}
