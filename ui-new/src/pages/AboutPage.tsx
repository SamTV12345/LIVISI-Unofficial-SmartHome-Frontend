import {ArrowLeft} from "lucide-react";
import {useNavigate} from "react-router-dom";

export const AboutPage = ()=>{
    const navigate = useNavigate()

    return <div>
        <button onClick={() => navigate(-1)}><ArrowLeft/></button>
        <h1 className="text-2xl ">Projekt</h1>
        <a className="before:absolute before:block before:w-full before:h-[2px]
              before:bottom-0 before:left-0 before:bg-black
              before:hover:scale-x-100 before:scale-x-0 before:origin-top-left
              before:transition before:ease-in-out before:duration-300" target="_blank"
           href="https://github.com/SamTV12345/LIVISI-Unofficial-SmartHome-Frontend">Projekt Link</a>
        <h1>Entwickler</h1>
        <p>SamTV12345</p>
    </div>
}
