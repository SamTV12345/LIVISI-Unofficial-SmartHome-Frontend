import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {Provider} from "react-redux";
import {store} from './store/store'

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
)

export const serverurl = import.meta.env.VITE_SERVER_URL
console.log(serverurl)
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>
);
