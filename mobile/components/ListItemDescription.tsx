import {ListItemIsland} from "@/components/ListItemIsland";
import {Text} from 'react-native'
import {FC} from "react";

type ListItemDescriptionProps = {
    title: string,
    description: React.ReactNode
}

export const ListItemDescription: FC<ListItemDescriptionProps> = ({description,title})=>{
    return <ListItemIsland style={{padding: 10}}>
        <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>{title}</Text>
        <Text style={{color: 'rgba(235, 235, 245, .60)', lineHeight: 20, fontSize: 14}}>{description}</Text>
    </ListItemIsland>
}