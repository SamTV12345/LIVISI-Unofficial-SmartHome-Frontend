import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {createBrowserRouter, createRoutesFromElements, Route, RouterProvider} from "react-router-dom";
import {DeviceScreen} from "@/src/pages/DeviceScreen.tsx";
import {I18nextProvider} from "react-i18next";
import App from "@/src/App.tsx";
import {HomeScreen} from "@/src/pages/HomeScreen.tsx";
import {i18next} from "@/src/language/i18n.ts";
import {LoginComponent} from "@/src/components/layout/Login.tsx";
import {Toaster} from "@/src/components/actionComponents/Toaster.tsx";
import {AuthWrapper} from "@/src/components/navigation/AuthWrapper.tsx";

const router = createBrowserRouter(createRoutesFromElements(
    <Route path="/">
        <Route element={<AuthWrapper/>}>
        <Route path="" element={<App/>}>
            <Route index element={<HomeScreen/>}/>
            <Route path="home" element={<HomeScreen/>}/>
            <Route path="devices" element={<DeviceScreen/>}/>
        </Route>
        </Route>
        <Route path="logincom" element={<LoginComponent/>}/>
    </Route>
), {
    basename: import.meta.env.BASE_URL
})


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <I18nextProvider i18n={i18next}>
            <RouterProvider router={router}/>
            <Toaster/>
        </I18nextProvider>
    </React.StrictMode>,
)
