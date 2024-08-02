import * as SQLite from "expo-sqlite";
import {ConfigData} from "@/models/ConfigData";

export let db: SQLite.SQLiteDatabase



export const init = async () => {
    db = await SQLite.openDatabaseAsync('databaseName');
    await db.execAsync(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS appconfig (id TEXT PRIMARY KEY NOT NULL);
CREATE TABLE IF NOT EXISTS serverconfig(id TEXT PRIMARY KEY NOT NULL, basicAuth BOOLEAN NOT NULL, oidcConfig TEXT, oidcConfigured BOOLEAN NOT NULL); 
`);
}


export const getBaseURL = async (): Promise<{ id: string | null; } | null> => {
    if (!db) {
        await init()
    }

    const result:{ id: string | null; } | null = await db.getFirstSync("SELECT * FROM appconfig")

    if (result == null) {
        return null
    } else  {
        return result
    }
}


export const getByBaseURL =  (baseUrl: string) => {
    return db.getFirstSync("SELECT * FROM appconfig WHERE id=?",baseUrl) as  { id: string | null; } | null
}

export const updateServerConfig = (c: ConfigData, baseURL: string)=>{
    const res = getByBaseURL(baseURL)
    if (res == null) {
        db.runSync("INSERT INTO appconfig (id) VALUES (?)", baseURL)
        db.runSync("INSERT INTO serverconfig (id, basicAuth, oidcConfig, oidcConfigured) VALUES (?,?,?,?)", baseURL,c.basicAuth, c.oidcConfig, c.oidcConfigured)
    } else {
        db.runSync("UPDATE serverconfig  SET basicAuth = ?, oidcConfig = ?, oidcConfigured = ? WHERE id=?",c.basicAuth, c.oidcConfig, c.oidcConfigured, baseURL)
    }
}

type ConfigDataDB = {
    basicAuth: number,
    oidcConfig: null,
    oidcConfigured: number
}


const convertToBoolean = (num: number)=>{
    if(num == 0) {
        return false
    } else {
        return true
    }
}

export const getServerConfig = (baseUrl: string)=>{
    const res = getByBaseURL(baseUrl)
    if (res == null) {
        throw new Error("Somehow the baseurl is not present")
    } else {
        // @ts-ignore
        let dataToReturn: ConfigData = {

        }
        const data = db.getFirstSync("SELECT * FROM serverconfig WHERE id=?", baseUrl) as ConfigDataDB
        dataToReturn.basicAuth = convertToBoolean(data.basicAuth)
        dataToReturn.oidcConfigured = convertToBoolean(data.oidcConfigured)
        dataToReturn.oidcConfig = data.oidcConfig
        return dataToReturn
    }
}