import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {createBrowserRouter, createRoutesFromElements, Route, RouterProvider} from "react-router-dom";
import {DeviceScreen} from "@/src/pages/DeviceScreen.tsx";
import {I18nextProvider} from "react-i18next";
import {HomeScreen} from "@/src/pages/HomeScreen.tsx";
import {i18next} from "@/src/language/i18n.ts";
import {LoginComponent} from "@/src/components/layout/Login.tsx";
import {Toaster} from "@/src/components/actionComponents/Toaster.tsx";
import {Page404} from "@/src/pages/404Page.tsx";
import {AuthWrapper} from "@/src/components/navigation/AuthWrapper.tsx";
import {Root} from "@/src/components/actionComponents/Root.tsx";
import {NewsScreen} from "@/src/pages/NewsScreen.tsx";
import {HelpPage} from "@/src/pages/HelpPage.tsx";
import {AboutPage} from "@/src/pages/AboutPage.tsx";
import {ErrorPage} from "@/src/pages/ErrorPage.tsx";
import {SocketMessage} from "@/src/models/SocketMessage.ts";
import {SettingsPage} from "@/src/pages/SettingsPage.tsx";
import {DeviceDetailPage} from "@/src/pages/DeviceDetailPage.tsx";
import {ScenarioScreen} from "@/src/pages/ScenarioScreen.tsx";
import {DeviceDrivers} from "@/src/components/actionComponents/DeviceDrivers.tsx";
import {NetworkPage} from "@/src/components/actionComponents/NetworkPage.tsx";
import {LANPage} from "@/src/pages/LANPage.tsx";
import {DeviceLocations} from "@/src/pages/DeviceLocations.tsx";
import {LocationUpdateScreen} from "@/src/pages/LocationUpdateScreen.tsx";
import {ServicesScreen} from "@/src/pages/ServicesScreen.tsx";
import {MobileAccessScreen} from "@/src/components/actionComponents/MobileAccessScreen.tsx";
import {EmailPage} from "@/src/pages/EmailPage.tsx";
import {Imprint} from "@/src/pages/Imprint.tsx";

const router = createBrowserRouter(createRoutesFromElements(
    <Route path="/">
        <Route path="" element={<AuthWrapper>
            <Root/>
        </AuthWrapper>}>
            <Route index element={<HomeScreen/>}/>
            <Route path="home" element={<HomeScreen/>}/>
            <Route path="devices">
                <Route index element={<DeviceScreen/>}/>
                <Route path=":id" element={<DeviceDetailPage/>}/>
            </Route>
            <Route path="services">
                <Route index element={<ServicesScreen/>}/>
                <Route path="mobile-access" element={<MobileAccessScreen/>}/>
            </Route>
            <Route path="scenarios">
                <Route index element={<ScenarioScreen/>}/>
            </Route>
            <Route path="news" element={<NewsScreen/>}/>
            <Route path="settings">
                <Route index={true} element={<SettingsPage/>}/>
                <Route path="deviceDrivers" element={<DeviceDrivers/>}/>
                <Route path="network" element={<NetworkPage/>}/>
                <Route path="lan" element={<LANPage/>}/>
                <Route path="deviceLocations" element={<DeviceLocations/>}/>
                <Route path="deviceLocations/:id" element={<LocationUpdateScreen/>}/>
                <Route path="email" element={<EmailPage/>}/>
                <Route path="imprint" element={<Imprint/>}/>
            </Route>
            <Route path="help">
                <Route index element={<HelpPage/>}/>
                <Route path="about" element={<AboutPage/>}/>
                <Route path="errors" element={<ErrorPage/>}/>
            </Route>

        </Route>
        <Route path="logincom" element={<LoginComponent/>}/>
        <Route path="*" element={<Page404/>}/>
    </Route>
), {
    basename: import.meta.env.BASE_URL
})

let ws
const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws"
if (import.meta.env.MODE === "development") {
    console.log("development mode")
    console.log("connecting to " + wsProtocol + "://" + window.location.host + "/websocket")
    ws = new WebSocket(wsProtocol + "://" + "localhost:8000" + "/websocket")

} else {
    ws = new WebSocket(wsProtocol + "://" + window.location.host + "/websocket")

}

ws.onerror = (e) => {
    console.log(e)
}
ws.onopen = () => {
    console.log("connected")
}

ws.onmessage = (e: MessageEvent<SocketMessage>) => {
    console.log(e.data)
}

ws.onclose = () => {
    console.log("disconnected")
}


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <I18nextProvider i18n={i18next}>
            <RouterProvider router={router}/>
            <Toaster/>
        </I18nextProvider>
    </React.StrictMode>,
)
