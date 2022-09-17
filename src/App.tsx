import React from 'react';
import './App.css';
import {useAppSelector} from "./store/hooks";
import {LoginPage} from "./login/LoginPage";
import {SideBar} from "./sidebar/SideBar";

function App() {
    const accessToken = useAppSelector(state => state.loginReducer.accesstoken)
    const expiresIn = localStorage.getItem("expires_in")

    if (!accessToken || !expiresIn || new Date().getTime()/1000> Number(expiresIn)) {
        return <LoginPage/>
    }

    return (
        <div className="grid grid-cols-5 h-full">
            <SideBar/>
            <div className="col-span-4">
                Geklappt
            </div>
        </div>
    )
}

export default App;
