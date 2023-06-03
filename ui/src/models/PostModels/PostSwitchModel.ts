import {SwitchParam} from "./PostSwitchParam";

export interface PostSwitchModel {
    namespace: string,
    params: SwitchParam
    target: string
    type: string
}