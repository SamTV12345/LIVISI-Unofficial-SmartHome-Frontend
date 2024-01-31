import {useNavigate} from "react-router-dom";

export const Page404 = () => {
    const navigate = useNavigate()
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="flex flex-col items-center justify-center bg-white pl-5 pr-5 pt-2 pb-2 rounded-xl">
                <h1 className="text-8xl font-bold">404</h1>
                <p className="text-gray-500">Seite nicht gefunden</p>
                <a onClick={()=>navigate('/')} className="text-blue-500">Zurück zur Startseite</a>
            </div>
        </div>
    )
}
