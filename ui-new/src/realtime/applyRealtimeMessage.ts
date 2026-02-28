import {SocketMessage} from "@/src/models/SocketMessage.ts";
import {AxiosDeviceResponse} from "@/src/store.tsx";
import {Device} from "@/src/models/Device.ts";
import {Message} from "@/src/models/Messages.ts";
import {Interaction} from "@/src/models/Interaction.ts";

type RealtimePatchResult = {
    nextAllThings: AxiosDeviceResponse | undefined,
    patched: boolean,
    needsRefresh: boolean
}

type CapabilityMatch = {
    deviceId: string,
    capabilityIndex: number
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const isPrimitive = (value: unknown): value is string | number | boolean => {
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
};

const getCapabilityId = (message: SocketMessage): string | undefined => {
    if (message.source?.startsWith("/capability/")) {
        return message.source.replace("/capability/", "");
    }
    if (message.id && !message.id.includes("/")) {
        return message.id;
    }
    return undefined;
};

const findCapabilityMatch = (
    devices: Record<string, Device>,
    capabilityId: string,
    hintedDeviceId?: string
): CapabilityMatch | undefined => {
    if (hintedDeviceId && devices[hintedDeviceId]) {
        const capabilityIndex = (devices[hintedDeviceId].capabilityState ?? [])
            .findIndex((entry) => entry.id === capabilityId);
        if (capabilityIndex >= 0) {
            return {
                deviceId: hintedDeviceId,
                capabilityIndex
            };
        }
    }

    for (const [deviceId, device] of Object.entries(devices)) {
        const capabilityIndex = (device.capabilityState ?? [])
            .findIndex((entry) => entry.id === capabilityId);
        if (capabilityIndex >= 0) {
            return {
                deviceId,
                capabilityIndex
            };
        }
    }

    return undefined;
};

const collectCapabilityUpdates = (
    properties: Record<string, unknown>,
    currentState: Record<string, unknown>
): Record<string, string | number | boolean> => {
    const updates: Record<string, string | number | boolean> = {};

    for (const [key, rawValue] of Object.entries(properties)) {
        if (isPrimitive(rawValue)) {
            updates[key] = rawValue;
            continue;
        }

        if (isRecord(rawValue) && isPrimitive(rawValue.value)) {
            updates[key] = rawValue.value;
        }
    }

    if (!("value" in updates)) {
        return updates;
    }

    if ("value" in currentState) {
        return updates;
    }

    const fallbackKeys = Object.keys(currentState);
    if (fallbackKeys.length === 1) {
        updates[fallbackKeys[0]] = updates.value;
        delete updates.value;
    }

    return updates;
};

const patchCapabilityState = (
    current: AxiosDeviceResponse,
    message: SocketMessage
): RealtimePatchResult => {
    const capabilityId = getCapabilityId(message);
    if (!capabilityId || !isRecord(message.properties)) {
        return {
            nextAllThings: current,
            patched: false,
            needsRefresh: true
        };
    }

    const match = findCapabilityMatch(current.devices, capabilityId, message.device);
    if (!match) {
        return {
            nextAllThings: current,
            patched: false,
            needsRefresh: true
        };
    }

    const device = current.devices[match.deviceId];
    const capabilityStates = device.capabilityState ?? [];
    const capabilityEntry = capabilityStates[match.capabilityIndex];
    const state = (capabilityEntry?.state ?? {}) as Record<string, unknown>;
    const updates = collectCapabilityUpdates(message.properties, state);

    if (Object.keys(updates).length === 0) {
        return {
            nextAllThings: current,
            patched: false,
            needsRefresh: true
        };
    }

    const updatedState = {...state};
    let changed = false;

    for (const [key, value] of Object.entries(updates)) {
        const previous = updatedState[key];
        const previousValue = isRecord(previous) ? previous.value : undefined;
        if (previousValue === value) {
            continue;
        }
        changed = true;
        updatedState[key] = {
            value,
            lastChanged: message.timestamp
        };
    }

    if (!changed) {
        return {
            nextAllThings: current,
            patched: false,
            needsRefresh: false
        };
    }

    const updatedCapabilityEntry = {
        ...capabilityEntry,
        state: updatedState
    };
    const updatedCapabilityStates = [...capabilityStates];
    updatedCapabilityStates[match.capabilityIndex] = updatedCapabilityEntry;
    const updatedDevice = {
        ...device,
        capabilityState: updatedCapabilityStates
    };

    return {
        nextAllThings: {
            ...current,
            devices: {
                ...current.devices,
                [match.deviceId]: updatedDevice
            }
        },
        patched: true,
        needsRefresh: false
    };
};

const buildMessageFromSocket = (message: SocketMessage, existing?: Message): Message | undefined => {
    if (!message.id) {
        return existing;
    }

    const nextMessage: Message = {
        id: message.id,
        type: message.type ?? existing?.type ?? "Unknown",
        class: message.class ?? existing?.class,
        namespace: message.namespace ?? existing?.namespace,
        timestamp: message.timestamp ?? existing?.timestamp ?? new Date().toISOString(),
        read: typeof message.read === "boolean" ? message.read : (existing?.read ?? false),
        devices: existing?.devices,
        messages: existing?.messages,
        capabilities: existing?.capabilities,
        properties: isRecord(message.properties) ? message.properties : existing?.properties
    };

    return nextMessage;
};

const patchMessage = (current: AxiosDeviceResponse, message: SocketMessage): RealtimePatchResult => {
    if (!message.id) {
        return {
            nextAllThings: current,
            patched: false,
            needsRefresh: true
        };
    }

    const currentMessages = current.messages ?? [];
    const existingIndex = currentMessages.findIndex((entry) => entry.id === message.id);
    const existingMessage = existingIndex >= 0 ? currentMessages[existingIndex] : undefined;
    const nextMessage = buildMessageFromSocket(message, existingMessage);

    if (!nextMessage) {
        return {
            nextAllThings: current,
            patched: false,
            needsRefresh: true
        };
    }

    if (existingIndex >= 0) {
        const updatedMessages = [...currentMessages];
        updatedMessages[existingIndex] = nextMessage;
        return {
            nextAllThings: {
                ...current,
                messages: updatedMessages
            },
            patched: true,
            needsRefresh: false
        };
    }

    return {
        nextAllThings: {
            ...current,
            messages: [...currentMessages, nextMessage]
        },
        patched: true,
        needsRefresh: false
    };
};

const patchConfigAndInteractions = (
    current: AxiosDeviceResponse,
    message: SocketMessage
): RealtimePatchResult => {
    const properties = isRecord(message.properties) ? message.properties : undefined;
    const data = isRecord(message.data) ? message.data : undefined;
    const configVersionRaw = data?.configVersion ?? properties?.configVersion;
    const interactionsRaw = data?.interactions;

    const nextConfigVersion = typeof configVersionRaw === "number"
        ? configVersionRaw
        : undefined;
    const nextInteractions = Array.isArray(interactionsRaw)
        ? interactionsRaw as Interaction[]
        : undefined;

    const shouldPatchVersion = typeof nextConfigVersion === "number" && current.status.configVersion !== nextConfigVersion;
    const shouldPatchInteractions = Array.isArray(nextInteractions);

    if (!shouldPatchVersion && !shouldPatchInteractions) {
        return {
            nextAllThings: current,
            patched: false,
            needsRefresh: true
        };
    }

    return {
        nextAllThings: {
            ...current,
            status: shouldPatchVersion
                ? {
                    ...current.status,
                    configVersion: nextConfigVersion
                }
                : current.status,
            interactions: shouldPatchInteractions ? nextInteractions : current.interactions
        },
        patched: true,
        needsRefresh: false
    };
};

export const applyRealtimeMessage = (
    current: AxiosDeviceResponse | undefined,
    message: SocketMessage
): RealtimePatchResult => {
    if (!current) {
        return {
            nextAllThings: current,
            patched: false,
            needsRefresh: true
        };
    }

    if (message.source?.startsWith("/capability/")) {
        return patchCapabilityState(current, message);
    }

    if (message.class === "message" || message.source?.startsWith("/device/00000000000000000000000000000000")) {
        return patchMessage(current, message);
    }

    if (message.type?.toLowerCase().includes("configversion")) {
        return patchConfigAndInteractions(current, message);
    }

    return {
        nextAllThings: current,
        patched: false,
        needsRefresh: true
    };
};
