export type Interaction = {
    created: string
    freezeTime: string
    id: string
    modified: string
    name: string
    rules: {
        actions: {
            namespace: string
            params: {
                [key: string]: string
            },
            tags: {
                deviceBySelected: string,
                groupedUid: string,
                type: string
            }
        }[]
    }[],
    tags:{
        category: string,
        homeScreenVisible: string,
        description: string,
    },
    validFrom: string
    validTo: string
}
