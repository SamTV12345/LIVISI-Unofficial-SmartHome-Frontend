import './App.css'
import {Outlet} from "react-router";
import {NavBar} from "@/src/components/layout/NavBar.tsx";
import {useRealtimeSync} from "@/src/hooks/useRealtimeSync.ts";
import {apiQueryClient} from "@/src/api/openapiClient.ts";
import {AxiosDeviceResponse, useContentModel} from "@/src/store.tsx";
import {useEffect} from "react";
import {queryClient} from "@/src/api/queryClient.ts";

function App() {
    const setAllThings = useContentModel((state) => state.setAllThings);
    const allThings = useContentModel((state) => state.allThings);
    const {data: allApiData} = apiQueryClient.useSuspenseQuery("get", "/api/all");

    useEffect(() => {
        if (allApiData) {
            setAllThings(allApiData as AxiosDeviceResponse);
        }
    }, [allApiData, setAllThings]);

    useEffect(() => {
        if (!allThings) return;

        queryClient.setQueryData(apiQueryClient.queryOptions("get", "/message").queryKey, allThings.messages);
        queryClient.setQueryData(apiQueryClient.queryOptions("get", "/location").queryKey, allThings.locations);
        queryClient.setQueryData(apiQueryClient.queryOptions("get", "/interaction").queryKey, allThings.interactions ?? []);
    }, [allThings?.interactions, allThings?.locations, allThings?.messages, allThings]);

    useRealtimeSync({skipInitialFetch: true});


    return <div className="shadow-2xl" id='content'>
            <NavBar/>

        <Outlet/>
    </div>
}

export default App
