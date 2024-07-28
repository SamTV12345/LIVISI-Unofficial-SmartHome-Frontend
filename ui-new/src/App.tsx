import './App.css'
import {Outlet} from "react-router";
import {useEffect} from "react";
import axios, {AxiosResponse} from "axios";
import {AxiosDeviceResponse, useContentModel} from "@/src/store.tsx";
import {NavBar} from "@/src/components/layout/NavBar.tsx";

function App() {


    useEffect(() => {
        axios.get("/api/all")
            .then((v: AxiosResponse<AxiosDeviceResponse>) => {
                useContentModel.getState().setAllThings(v.data)
            })
    }, [])


    return <div className="shadow-2xl" id='content'>
            <NavBar/>

        <Outlet/>
    </div>
}

export default App
