import {MessageProperty} from "./MessageProperty";

export interface Message {
    id: string,
    type: string,
    read: boolean
    namespace:string,
    class: string,
    timestamp: string
    properties?: MessageProperty
}