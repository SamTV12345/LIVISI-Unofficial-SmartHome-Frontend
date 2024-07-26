import {Button} from "@/src/components/actionComponents/Button.tsx";
import {useContentModel} from "@/src/store.tsx";
import {useMemo} from "react";
import axios from "axios";
import {ArrowLeft} from 'lucide-react'
import {useNavigate} from "react-router-dom";
export const ErrorPage = () => {
    const navigate = useNavigate()
    const allThings = useContentModel(state => state.allThings)
    const shc = useMemo(()=> {
       return allThings?.devices['00000000000000000000000000000000']
    },    [allThings])


    return <div>
        <button  onClick={()=>navigate(-1)}><ArrowLeft/></button>
        <h2 className="text-2xl">Zentrale neu starten</h2>
        <p>
            Bei Problemen mit Ihrem SmartHome haben Sie hier die Möglichkeit, Ihre Zentrale neu zu starten.
        </p>
        <Button className="w-full h-14 mt-10" onClick={() => {
            axios.post("/action", {
                    id: shc!.id,
                    type: "Restart",
                    target: "/device/" + shc!.id,
                    namespace: "core.RWE",
                    params: {
                        reason: {
                            type: "Constant",
                            value: "User requested to restart smarthome controller."
                        }
                    }
                }
            )
        }}>Neu starten</Button>

        <h2  className="text-2xl mt-10">Internetverbindung</h2>
        <p>Um Verbindungsprobleme als Ursache für Störungen (z.B. Abbrüche, fehlgeschlagene Updates) ihres SmartHomes
            auszuschließen, führen Sie bitte einen Test der Internetverbindung durch und fügen Sie die Ergebnisse (Ping,
            Upload-/Downloadrate) dem jeweiligen Ticket bei.</p>
        <p>Für den Test wird die Seite speedtest.net in einem externen Fenster geöffnet.</p>
        <Button className="w-full h-14 mt-10">
            <a href="https://www.speedtest.net/" target="_blank">Internetverbindung testen</a>
        </Button>
    </div>
}

////{"id":"c929864898e2453cbd375ef3ae4e7881","type":"Restart","target":"/device/00000000000000000000000000000000","namespace":"core.RWE","params":{"reason":{"type":"Constant","value":"User requested to restart smarthome controller."}}}
