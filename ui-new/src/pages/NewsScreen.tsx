import {useContentModel} from "@/src/store.tsx";
import {formatTime} from "@/src/utils/timeUtils.ts";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {cn} from "@/src/utils/cn-helper.ts";
import {determineTitleAndDescription} from "@/src/utils/messageDetermining.ts";



export const NewsScreen = ()=>{
    const allthings = useContentModel(state=>state.allThings)




    return <PageComponent title="Nachrichten">
        {
            allthings?.messages?.length===0?<PageBox title="Keine Nachrichten vorhanden"></PageBox>:null
        }
        {allthings?.messages?.sort((a,b)=>b.timestamp.localeCompare(a.timestamp))
            .map((message,i)=>{
                const {title, description} = determineTitleAndDescription(message)
                console.log(message.read, message.id)
                return <PageBox key={message.id} className={"relative p-10 " + message.read?'':'text-black'} variant={i%2 == 0 ? 'gray': undefined} to={"/news/"+message.id}>
                    <div className={cn("pl-10 pr-10", message.read && 'text-gray-400')}>
                        <h2>{title}</h2>
                        <p>{description}</p>
                    <span className="absolute right-5 top-2/3">{formatTime(message.timestamp)}</span>
                        {!message.read &&<span className="bg-green-green rounded-2xl h-6 w-6 absolute left-2 top-1/3"></span>}
                    </div>
                </PageBox>
            })
        }

    </PageComponent>
}
