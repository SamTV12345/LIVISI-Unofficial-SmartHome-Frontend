import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {createBrowserRouter, createRoutesFromElements, Route, RouterProvider} from "react-router-dom";
import {HomeScreen} from "./pages/HomeScreen.tsx";
import {DeviceScreen} from "@/src/pages/DeviceScreen.tsx";

const router= createBrowserRouter(createRoutesFromElements(
        <Route path="/" element={<App/>}>
            <Route index element={<HomeScreen/>}/>
            <Route path="home" element={<HomeScreen/>}/>
            <Route path="devices" element={<DeviceScreen/>}/>
        </Route>
), {
    basename: import.meta.env.BASE_URL
})


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
        <RouterProvider router={router}/>
  </React.StrictMode>,
)
