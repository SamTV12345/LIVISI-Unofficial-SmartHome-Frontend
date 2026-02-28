import * as SQLite from "expo-sqlite";
import {ConfigData} from "@/models/ConfigData";

export let db: SQLite.SQLiteDatabase;

export type AppconfigData = {
    id: string;
    active: number;
    username: string;
    password: string;
    label: string;
};

const DB_NAME = "databaseName";

const ensureDb = (): SQLite.SQLiteDatabase => {
    if (!db) {
        init();
    }
    return db;
};

const addColumnIfMissing = (statement: string) => {
    try {
        ensureDb().runSync(statement);
    } catch {
        // Column already exists or migration is not needed.
    }
};

export const init = () => {
    if (db) {
        return;
    }

    db = SQLite.openDatabaseSync(DB_NAME);
    db.execSync(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS appconfig (
    id TEXT PRIMARY KEY NOT NULL,
    active INTEGER NOT NULL DEFAULT 0,
    username TEXT NOT NULL DEFAULT '',
    password TEXT NOT NULL DEFAULT '',
    label TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS serverconfig (
    id TEXT PRIMARY KEY NOT NULL,
    basicAuth BOOLEAN NOT NULL,
    oidcConfig TEXT,
    oidcConfigured BOOLEAN NOT NULL
);
`);

    addColumnIfMissing("ALTER TABLE appconfig ADD COLUMN username TEXT NOT NULL DEFAULT ''");
    addColumnIfMissing("ALTER TABLE appconfig ADD COLUMN password TEXT NOT NULL DEFAULT ''");
    addColumnIfMissing("ALTER TABLE appconfig ADD COLUMN label TEXT NOT NULL DEFAULT ''");
};

const normalizeGateway = (gateway: Partial<AppconfigData> & { id: string }): AppconfigData => {
    return {
        id: gateway.id.trim(),
        active: gateway.active ?? 1,
        username: (gateway.username ?? "").trim(),
        password: gateway.password ?? "",
        label: (gateway.label ?? "").trim(),
    };
};

export const getBaseURL = async (): Promise<AppconfigData | null> => {
    init();
    return ensureDb().getFirstSync("SELECT * FROM appconfig WHERE active=1 LIMIT 1") as AppconfigData | null;
};

export const getActiveGatewayConfig = (): AppconfigData | null => {
    init();
    return ensureDb().getFirstSync("SELECT * FROM appconfig WHERE active=1 LIMIT 1") as AppconfigData | null;
};

export const getByBaseURL = (baseUrl: string) => {
    init();
    return ensureDb().getFirstSync("SELECT * FROM appconfig WHERE id=?", baseUrl) as AppconfigData | null;
};

export const getAllBaseURLs = () => {
    init();
    return (ensureDb().getAllSync("SELECT * FROM appconfig ORDER BY COALESCE(NULLIF(label, ''), id) COLLATE NOCASE ASC") || []) as AppconfigData[];
};

export const saveGatewayConfig = (gateway: Partial<AppconfigData> & { id: string }) => {
    init();
    const normalized = normalizeGateway(gateway);
    ensureDb().runSync("UPDATE appconfig SET active=0");
    ensureDb().runSync(
        "INSERT OR REPLACE INTO appconfig (id, active, username, password, label) VALUES (?, ?, ?, ?, ?)",
        normalized.id,
        1,
        normalized.username,
        normalized.password,
        normalized.label
    );
};

export const saveBaseURL = (baseURL: string) => {
    saveGatewayConfig({
        id: baseURL,
        active: 1
    });
};

export const updateGatewayCredentials = (baseURL: string, username: string, password: string, label?: string) => {
    init();
    ensureDb().runSync(
        "UPDATE appconfig SET username=?, password=?, label=COALESCE(?, label) WHERE id=?",
        username.trim(),
        password,
        label?.trim() ?? null,
        baseURL
    );
};

export const setAllInactive = () => {
    init();
    ensureDb().runSync("UPDATE appconfig SET active=0");
};

export const setActive = (baseURL: string) => {
    init();
    setAllInactive();
    ensureDb().runSync("UPDATE appconfig SET active=1 WHERE id=?", baseURL);
};

export const deleteBaseURL = (baseURL: string) => {
    init();
    ensureDb().runSync("DELETE FROM appconfig WHERE id=?", baseURL);
};

export const updateServerConfig = (c: ConfigData, baseURL: string) => {
    init();
    ensureDb().runSync(
        "INSERT OR REPLACE INTO serverconfig (id, basicAuth, oidcConfig, oidcConfigured) VALUES (?,?,?,?)",
        baseURL,
        c.basicAuth,
        c.oidcConfig,
        c.oidcConfigured
    );
};

type ConfigDataDB = {
    basicAuth: number;
    oidcConfig: null;
    oidcConfigured: number;
};

const convertToBoolean = (num: number) => num !== 0;

export const getServerConfig = (baseUrl: string) => {
    init();
    const res = getByBaseURL(baseUrl);
    if (res == null) {
        throw new Error("Base URL is not present");
    }

    const data = ensureDb().getFirstSync("SELECT * FROM serverconfig WHERE id=?", baseUrl) as ConfigDataDB | null;
    if (data === null) {
        throw new Error("Server config is not present");
    }

    return {
        basicAuth: convertToBoolean(data.basicAuth),
        oidcConfigured: convertToBoolean(data.oidcConfigured),
        oidcConfig: data.oidcConfig
    } as ConfigData;
};
