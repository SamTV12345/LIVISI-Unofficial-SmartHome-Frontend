import './App.css'
import {LinkNav} from "./components/navigation/Link.tsx";
import {Outlet} from "react-router";

function App() {

    return <div className="ml-96 mr-96">
        <div className="flex header">
        <div>Logo</div>
        <div className="ml-20 flex gap-10 text-2xl">
            <LinkNav to={'/home'}>Home</LinkNav>
            <LinkNav to={'/devices'}>Geräte</LinkNav>
            <LinkNav to={'/scenarios'}>Szenarien</LinkNav>
            <LinkNav to={'/services'}>Dienste</LinkNav>
            <LinkNav to={'/states'}>Zustände</LinkNav>
            <LinkNav to={'/news'}>Nachrichten</LinkNav>
        </div>

    </div>
        <Outlet />
    </div>
}
export default App
