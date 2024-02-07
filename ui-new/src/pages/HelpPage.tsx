import {Card} from "@/src/components/layout/Card.tsx";
import {useNavigate} from "react-router-dom";

export const HelpPage = () => {
    const navigate = useNavigate()

    return <div>
        <div className="bg-[#f2f2f0] text-2xl text-blue-500 p-2 rounded border-b-gray-500 border-b-2">Hilfe</div>
        <Card onClick={()=>{
            navigate('/help/about')
        }} className="p-2 pb-5 pt-5 rounded-none arrow-mid relative cursor-pointer">Über das Projekt</Card>
        <Card onClick={()=>{
            navigate('/help/errors')
        }} className="p-2 rounded-none pb-5 pt-5 arrow-mid relative cursor-pointer">Fehlersuche</Card>
    </div>
}

