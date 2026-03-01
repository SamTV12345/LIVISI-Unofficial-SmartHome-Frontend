import {Device} from "@/models/Device";
import {LocationResponse} from "@/models/Location";

type LocationLookups = {
    byReference: Map<string, LocationResponse>;
    byDeviceId: Map<string, LocationResponse>;
};

const LOCATION_PATH_SEGMENT = "/location/";

export const normalizeLocationReference = (value?: string): string | undefined => {
    if (!value) {
        return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }

    const segmentIndex = trimmed.indexOf(LOCATION_PATH_SEGMENT);
    if (segmentIndex >= 0) {
        return trimmed.slice(segmentIndex + LOCATION_PATH_SEGMENT.length);
    }
    return trimmed;
};

const locationCandidates = (reference?: string): string[] => {
    if (!reference) {
        return [];
    }
    const normalized = normalizeLocationReference(reference);
    const values = [reference, normalized, normalized ? `${LOCATION_PATH_SEGMENT}${normalized}` : undefined];
    return values.filter((entry): entry is string => Boolean(entry));
};

export const buildLocationLookups = (locations: LocationResponse[]): LocationLookups => {
    const byReference = new Map<string, LocationResponse>();
    const byDeviceId = new Map<string, LocationResponse>();

    for (const location of locations) {
        for (const candidate of locationCandidates(location.id)) {
            byReference.set(candidate, location);
        }
        for (const deviceId of location.devices ?? []) {
            byDeviceId.set(deviceId, location);
        }
    }

    return {
        byReference,
        byDeviceId
    };
};

export const resolveDeviceLocation = (
    device: Pick<Device, "id" | "location" | "locationData">,
    lookups: LocationLookups
): LocationResponse | undefined => {
    const fromDeviceList = lookups.byDeviceId.get(device.id);
    if (fromDeviceList) {
        return fromDeviceList;
    }

    for (const candidate of locationCandidates(device.location)) {
        const resolved = lookups.byReference.get(candidate);
        if (resolved) {
            return resolved;
        }
    }

    return device.locationData;
};
