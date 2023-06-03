import axios from "axios";
import {serverurl} from "../main";
import {User} from "./User";
import {useAppDispatch, useAppSelector} from "../store/hooks";
import {setUser} from "../login/loginSlice";
import {useEffect} from "react";
import "tailwindcss/tailwind.css"


export const UserView = () => {
    const accessToken = useAppSelector(state => state.loginReducer.accesstoken)
    const dispatch = useAppDispatch()
    const user = useAppSelector(state => state.loginReducer.user)

    const loadUser = async () => {
        const userInResponse: User = await new Promise<User>(resolve => {
            axios.get(serverurl + "/user", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            })
                .then(resp => resolve(resp.data))
                .catch((error) => {
                    console.log(error)
                })
        })
        if (userInResponse !== undefined) {
            dispatch(setUser(userInResponse))
        }
    }

    useEffect(() => {
        if (!user) {
            loadUser()
        }
    }, [])

    if (!user) {
        return <div>

        </div>
    }
    return <div className="flex h-full">
        <div className="m-auto grid grid-cols-2">
            <div>
                Name
            </div>
            <div>
                {user.accountName}
            </div>
            <div>
                Tenant-ID
            </div>
            <div>
                {user.tenantId}
            </div>
            <div>
                TaCAccpeted
            </div>
            <div>
                {user.data.latestTaCAccepted}
            </div>
            <div>
                Password
            </div>
            <div>
                {user.password}
            </div>
        </div>
    </div>

}
