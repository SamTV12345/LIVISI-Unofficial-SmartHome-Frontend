import {PostHeatingParam} from "./PostHeatingParam";

export interface PostHeatingModel {
    namespace: string,
    params: PostHeatingParam
    target: string
    type: string
}