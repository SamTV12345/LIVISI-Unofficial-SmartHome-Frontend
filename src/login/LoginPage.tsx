import "./login.css"
import {LoginResponse} from "./LoginResponse";
import axios from "axios";
import {useAppDispatch} from "../store/hooks";
import {serverurl} from "../index";
import {useState} from "react";
import {setAccessToken, setExpiresIn, setRefreshToken} from "./loginSlice";


export const LoginPage = () => {
    const dispatch = useAppDispatch()
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>()

    const [errorMessage, setErrorMessage] = useState<string>('')

    const login = async ()=>{
        const loginResponse: LoginResponse = await new Promise<LoginResponse>(resolve=>{
            console.log(serverurl+"/auth/token")
            axios.post(serverurl+"/auth/token",{
                username,
                password,
                grant_type: "password"
            },{
                auth:{
                    username: "clientId",
                    password: "clientPass"
                }
            })
                .then(resp=>resolve(resp.data))
                .catch((error)=>{
                    console.log(error)
                    setErrorMessage(error.response.data.description)})
        })
        if(loginResponse !== undefined){
            dispatch(setAccessToken(loginResponse.access_token))
            dispatch(setRefreshToken(loginResponse.refresh_token))
            dispatch(setExpiresIn(loginResponse.expires_in))
        }
    }


    return (
        <div className="w-screen h-screen flex justify-center items-center bg-gray-100" id="login">
            <form className="p-10 bg-white rounded flex justify-center items-center flex-col shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                     stroke="currentColor" className="w-20 h-20">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963
                           0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>

                <p className="mb-5 text-3xl uppercase text-gray-600">Login</p>
                <input name="email"
                       className="mb-5 p-3 w-80 focus:border-purple-700 rounded border-2 outline-none"
                       autoComplete="off" placeholder="Username" required value={username} onChange={v=>setUsername(v.target.value)}/>
                    <input type="password" name="password"
                           className="mb-5 p-3 w-80 focus:border-purple-700 rounded border-2 outline-none"
                           autoComplete="off" placeholder="Passwort" required value={password} onChange={v=>setPassword(v.target.value)}/>
                        <button type="button" className="bg-purple-600 hover:bg-purple-900 text-white font-bold p-2 rounded w-80"
                                id="login" onClick={()=>login()}><span>Login</span></button>
                {errorMessage && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800"
                     role="alert">
                    <span className="font-medium">An error occurred</span> {errorMessage}.
                </div>}

            </form>
        </div>
)
}