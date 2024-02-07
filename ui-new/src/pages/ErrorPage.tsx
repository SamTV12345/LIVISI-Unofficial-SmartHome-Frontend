import {Button} from "@/src/components/actionComponents/Button.tsx";
import {useContentModel} from "@/src/store.tsx";
import {useMemo} from "react";
import axios from "axios";

export const ErrorPage = () => {
    const devices = useContentModel(state => state.devices)
    const shc = useMemo(()=> {
       return devices?.filter(d=>d.id == '00000000000000000000000000000000')[0]!
    },    [devices])


    return <div>
        <h2 className="text-2xl">Zentrale neu starten</h2>
        <p>
            Bei Problemen mit Ihrem SmartHome haben Sie hier die Möglichkeit, Ihre Zentrale neu zu starten.
        </p>
        <Button className="w-full h-14 mt-10" onClick={() => {
            console.log(shc)
            axios.post("/action", {
                id: shc.id,
                type: "Restart",
                target: "/device/"+shc.id,
                namespace: "core.RWE",
                params: {
                    reason: {
                        type: "Constant",
                        value: "User requested to restart smarthome controller."
                    }
                }}

            )}}>Neu starten</Button>
    </div>
}

////{"id":"c929864898e2453cbd375ef3ae4e7881","type":"Restart","target":"/device/00000000000000000000000000000000","namespace":"core.RWE","params":{"reason":{"type":"Constant","value":"User requested to restart smarthome controller."}}}
