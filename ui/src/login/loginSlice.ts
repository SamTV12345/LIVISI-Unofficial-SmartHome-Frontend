import { createSlice } from '@reduxjs/toolkit'
import {User} from "../user/User";

// Define a type for the slice state
interface LoginProps {
    username: string | null,
    accesstoken: string | null,
    refreshToken: string| null,
    expires_in: number,
    user: User|undefined
}

// Define the initial state using that type
const initialState: LoginProps = {
    username: localStorage.getItem("username"),
    accesstoken: localStorage.getItem("access_token"),
    refreshToken: localStorage.getItem("refresh_token"),
    expires_in: 0,
    user: undefined
}

export const loginSlice = createSlice({
    name: 'login',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        setUsername: (state, action)=>{
            state.username = action.payload
            localStorage.setItem("username", action.payload)
        },
        setAccessToken: (state, action)=>{
            state.accesstoken = action.payload
            localStorage.setItem("access_token", action.payload)
        },
        setRefreshToken: (state, action)=>{
            state.refreshToken = action.payload
            localStorage.setItem("refresh_token", action.payload)
        },
        setExpiresIn:(state, action)=>{
            console.log(action.payload)
            state.expires_in = action.payload
            const secondsSinceEpoch = new Date().getTime()/1000
            console.log(secondsSinceEpoch+action.payload)
            localStorage.setItem("expires_in", secondsSinceEpoch+action.payload)
        },
        setUser: (state, action)=>{
            state.user = action.payload
        }
    }
})

export const { setExpiresIn,setAccessToken,setRefreshToken,setUser } = loginSlice.actions

export const loginReducer = loginSlice.reducer
