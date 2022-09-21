import {useAppSelector} from "../store/hooks";
import {ActionDecider} from "../action/ActionDecider";

export const Dashboard = ()=>{
    const locations = useAppSelector(state=>state.commonReducer.locations)
    const devices = useAppSelector(state=>state.commonReducer.devices)
    const capabilityStates = useAppSelector(state=>state.commonReducer.capabilityStates)

    return (
        <div className="grid grid-cols-1 p-6 gap-y-20 gap-x-2 h-full w-full">
            {locations.map(location=><div key={location.id}>
                <h2 className="text-4xl mb-5">{location.config.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {devices.filter(device=>device.location && device.location.includes(location.id) && device.config.protocolId!=='Virtual').map(deviceInLocation=>
                    <div key={deviceInLocation.id}
                        className={"block p-6 max-w-sm rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-gray-800 border-gray-700 hover:bg-gray-700"}>
                        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 text-white">{deviceInLocation.config.name}</h5>
                        <div className="font-normal text-gray-400">
                                <ActionDecider device={deviceInLocation} capabiltyStates={capabilityStates.filter(capabilityState=>deviceInLocation
                                     .capabilities.find(capability=>capability.includes(capabilityState.id)))}/>
                        </div>
                    </div>
                )}
                </div>
            </div>)
            }
        </div>
    )
}