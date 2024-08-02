export type LocationResponse = {
    config: LocationConfig,
    id: string,
    devices?: string[]
}


type LocationConfig = {
    name: string,
    id: string
}