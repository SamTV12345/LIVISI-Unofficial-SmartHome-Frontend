import {getAuthorizationHeader} from "@/src/api/authHeaderStore.ts";

type SocketEnvelope<TPayload = unknown> = {
    message: TPayload
}

type SocketClientOptions<TPayload = unknown> = {
    onMessage: (payload: TPayload) => void,
    onConnectionChange: (connected: boolean) => void
}

const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

const buildSocketUrl = (): string => {
    const explicitUrl = import.meta.env.VITE_WS_URL as string | undefined;
    let baseSocketUrl = "";
    if (explicitUrl) {
        baseSocketUrl = explicitUrl;
    } else {
        const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
        if (import.meta.env.MODE === "development") {
            baseSocketUrl = wsProtocol + "://localhost:8000/websocket";
        } else {
            baseSocketUrl = wsProtocol + "://" + window.location.host + "/websocket";
        }
    }

    const authorization = getAuthorizationHeader();
    if (!authorization) {
        return baseSocketUrl;
    }

    const url = new URL(baseSocketUrl, window.location.origin);
    url.searchParams.set("authorization", authorization);
    return url.toString();
};

const parseEnvelope = <TPayload,>(data: string): SocketEnvelope<TPayload> | null => {
    try {
        return JSON.parse(data) as SocketEnvelope<TPayload>;
    } catch (error) {
        console.error("Could not parse websocket payload", error);
        return null;
    }
};

export class SocketClient<TPayload = unknown> {
    private socket: WebSocket | undefined;
    private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    private reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS;
    private stopRequested = false;
    private readonly url: string;
    private readonly options: SocketClientOptions<TPayload>;

    constructor(options: SocketClientOptions<TPayload>) {
        this.options = options;
        this.url = buildSocketUrl();
    }

    public connect() {
        this.stopRequested = false;
        this.openConnection();
    }

    public disconnect() {
        this.stopRequested = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        if (this.socket) {
            this.socket.close();
            this.socket = undefined;
        }
        this.options.onConnectionChange(false);
    }

    private openConnection() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            this.reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS;
            this.options.onConnectionChange(true);
        };

        this.socket.onclose = () => {
            this.options.onConnectionChange(false);
            this.socket = undefined;
            if (!this.stopRequested) {
                this.scheduleReconnect();
            }
        };

        this.socket.onerror = () => {
            this.options.onConnectionChange(false);
        };

        this.socket.onmessage = (event: MessageEvent<string>) => {
            const payload = parseEnvelope<TPayload>(event.data);
            if (!payload) {
                return;
            }
            this.options.onMessage(payload.message);
        };
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = setTimeout(() => {
            this.openConnection();
        }, this.reconnectDelayMs);
        this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, MAX_RECONNECT_DELAY_MS);
    }
}
