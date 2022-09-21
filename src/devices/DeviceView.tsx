import {useAppSelector} from "../store/hooks";
import "tailwindcss/tailwind.css"
import {Device} from "../models/Device";

export const DeviceView = ()=>{
    const devices = useAppSelector(state=>state.commonReducer.devices)
    const location = useAppSelector(state=>state.commonReducer.locations)


    const getLocationOfDevice = (device: Device)=>{
        if(device.location!== undefined && device.location.length!==0) {
            return location.filter(l=>device.location.includes(l.id))[0].config.name
        }
        return 'Kein Ort registriert'
    }


    return <div className="flex justify-center p-6">
    <table className="text-sm text-left text-gray-800 p-6 w-full">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400">
        <tr key="deviceHead">
            <th className="py-3 px-6 text-gray-800">
                #
            </th>
            <th className="py-3 px-6 text-gray-800">
                Typ
            </th>
            <th className="py-3 px-6 text-gray-800">
                Produkt
            </th>
        <th className="py-3 px-6 text-gray-800">
            Ort
        </th>
            <th>
                Seriennummer
            </th>
        </tr>
        </thead>
        <tbody>
        {devices.map(device=>
            <tr className="text-xs text-gray-700 even:bg-gray-100" key={device.id}>
                <td>
                    {device.id}
                </td>
                <td>
                    {device.type}
                </td>
                <td>
                    {device.product}
                </td>
                <td>
                    {getLocationOfDevice(device)}
                </td>
                <td>
                    {device.serialNumber}
                </td>
            </tr>
        )}
        </tbody>
    </table>
    </div>
}