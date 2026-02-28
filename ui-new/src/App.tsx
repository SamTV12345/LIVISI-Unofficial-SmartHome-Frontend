import './App.css'
import {Outlet} from "react-router";
import {NavBar} from "@/src/components/layout/NavBar.tsx";
import {useRealtimeSync} from "@/src/hooks/useRealtimeSync.ts";

function App() {
    useRealtimeSync();


    return <div className="shadow-2xl" id='content'>
            <NavBar/>

        <Outlet/>
    </div>
}

export default App
