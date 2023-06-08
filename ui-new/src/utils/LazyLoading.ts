import {lazy} from "react";

export const HomeViewLazyLoad = lazy(()=>import('../pages/HomeScreen').then(module=> {
    return{default:module["HomeScreen"]}
}))

export const AppViewLazyLoad = lazy(()=>import('../App').then(module=> {
    return{default:module["default"]}
}))
