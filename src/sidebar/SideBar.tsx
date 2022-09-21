import {useAppSelector} from "../store/hooks";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export const SideBar  = ()=>{
    const sideBarCollapsed = useAppSelector(state=>state.commonReducer.sideBarCollapsed)
    const navigate = useNavigate()
    const {t} = useTranslation()

    const highlightIfSelected = (path:string)=>{
        if(window.location.href.includes(path)){
            return 'bg-gray-700'
        }
        return ''
    }

    return <aside className={`w-full h-full float-left ${sideBarCollapsed?'hidden': 'grid-cols-1'}`} aria-label="Sidebar">
        <div className="py-4 px-3 bg-gray-800 h-full w-full">
            <ul className="space-y-2">
                <li>
                    <a onClick={()=>navigate("/dashboard")
                    }
                       className={`flex items-center p-2 text-base font-normal rounded-lg text-white hover:bg-gray-700 ${highlightIfSelected("/dashboard")}`}>
                        <svg aria-hidden="true"
                             className="w-6 h-6 transition duration-75 text-white group-hover:text-white"
                             fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                        </svg>
                        <span className="ml-3">{t('dashboard')}</span>
                    </a>
                </li>
                <li>
                    <a onClick={()=>navigate('devices')}
                       className={`flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${highlightIfSelected("/devices")}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                             stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>
                        </svg>

                        <span className="flex-1 ml-3 whitespace-nowrap">{t('devices')}</span>
                    </a>
                </li>
                <li>
                    <a href="#"
                       className={`flex items-center p-2 text-base font-normal text-white rounded-lg hover:bg-gray-700 ${highlightIfSelected("/locations")}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                             stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                        </svg>

                        <span className="flex-1 ml-3 whitespace-nowrap">{t('locations')}</span>
                    </a>
                </li>
                <li>
                    <a href="#"
                       className="flex items-center p-2 text-base font-normal text-white rounded-lg hover:bg-gray-700">
                        <svg aria-hidden="true"
                             className="flex-shrink-0 w-6 h-6 transition duration-75 text-white dark:group-hover:text-white"
                             fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                  clipRule="evenodd"></path>
                        </svg>
                        <span className="flex-1 ml-3 whitespace-nowrap">{t('scenarios')}</span>
                    </a>
                </li>
                <li>
                    <a href="#"
                       className="flex items-center p-2 text-base font-normal  rounded-lg text-white hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                             stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"/>
                        </svg>

                        <span className="flex-1 ml-3 whitespace-nowrap">{t('status')}</span>
                    </a>
                </li>
                <li>
                    <a onClick={()=>navigate("/accounts")}
                       className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>

                        <span className="flex-1 ml-3 whitespace-nowrap">Accounts</span>
                    </a>
                </li>
                <li>
                    <a onClick={()=>navigate("/messages")}
                       className={`flex items-center p-2 text-base font-normal  rounded-lg text-white hover:bg-gray-700 ${highlightIfSelected("/messages")}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                        <span className="flex-1 ml-3 whitespace-nowrap">{t('messages')}</span>
                    </a>
                </li>
            </ul>
        </div>
    </aside>
}