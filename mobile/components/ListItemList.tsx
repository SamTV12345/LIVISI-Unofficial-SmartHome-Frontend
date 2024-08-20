import {FC, useEffect, useMemo} from "react";
import {Text, TextInput, TouchableOpacity, View} from "react-native";

type ListItemListProps = {
    values: string[],
    onChange: ((v: string[])=>void)
    addNewItemText: string
}

type LogoOptions = {
    onPress?: ()=>void
}

const RemoveLogo: FC<LogoOptions> = ({onPress})=>{
    return <TouchableOpacity onPress={onPress} style={{position: 'absolute', left: 10, top: 17, borderRadius: 2000, backgroundColor: 'red', width: 15, height: 15, display: 'flex'}}>
        <Text style={{position: 'absolute', left: '35%', bottom: '-5%',  color: 'white', textAlign: 'center'}}>-</Text>
    </TouchableOpacity>
}


const AddLogo: FC<LogoOptions> = ({onPress})=>{

    return <TouchableOpacity onPress={onPress} style={{position: 'absolute', left: 10, top: 14, borderRadius: 2000, backgroundColor: 'green', width: 15, height: 15, display: 'flex'}}>
        <Text style={{position: 'absolute', left: '25%', bottom: '-5%', color: 'white', textAlign: 'center'}}>+</Text>
    </TouchableOpacity>
}


const TextInputForList: FC<{
    text: string,
    onChange: (v: string)=>void
}> = ({text, onChange})=>{
    const displayedText  = useMemo(()=>{
        return text
    }, [text])

    return <TextInput onChangeText={(v)=>{
        onChange(v)
    }} style={{paddingTop: 10, paddingBottom: 10, marginLeft: 30, color: 'white'}} value={text}/>
}

export const ListItemList: FC<ListItemListProps> = ({onChange,values, addNewItemText})=>{

    return <View style={{display: 'flex', flexDirection: 'column'}}>
        {
            values.map((v,index)=>{
                return <View key={index} style={{position: 'relative'}}>
                    <RemoveLogo onPress={()=>{
                        const newArr  = []
                        for (let i = 0;i<values.length;i++) {
                            if (index === i) {
                                continue
                            }
                            newArr.push(values[i])
                            onChange(newArr)
                        }
                    }}/>
                    <TextInputForList text={v} onChange={(v)=>{
                        const newArr  = []
                        for (let i = 0;i<values.length;i++) {
                            if (index === i) {
                                newArr.push(v)
                                continue
                            }
                            newArr.push(values[i])

                        }
                        console.log(newArr)
                        onChange(newArr)
                    }}/>
                </View>
            })
        }
        <View style={{position: 'relative'}}>
            <AddLogo onPress={()=>{
                const newArr  = []
                for (let val of values) {
                    newArr.push(val)
                }

                newArr.push("")
                onChange(newArr)
            }}/>
            <Text key={addNewItemText} style={{paddingTop: 10, paddingBottom: 10, marginLeft: 30, color: 'white'}}>{addNewItemText}</Text>
        </View>
    </View>
}