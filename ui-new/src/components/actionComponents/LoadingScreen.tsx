import {createPortal} from "react-dom";
import {ProgressBar} from "@/src/components/actionComponents/ProgressBar.tsx";
import {TOTAL_THINGS_TO_LOAD} from "@/src/constants/FieldConstants.ts";
import {useContentModel} from "@/src/store.tsx";

export const LoadingScreen = ()=>{
    const totalProgress = useContentModel(state=>state.loadingProgress)
    return createPortal(<div>
        <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 z-50 flex flex-col gap-3 justify-center items-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
            <ProgressBar className="w-1/5" value={(totalProgress/TOTAL_THINGS_TO_LOAD)*100}/>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
    </div>,document.getElementById('loading')!)
}
