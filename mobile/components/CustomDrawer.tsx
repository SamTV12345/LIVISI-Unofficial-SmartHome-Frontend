import {createDrawerNavigator} from "@react-navigation/drawer";
import * as React from "react";

const {Navigator} = createDrawerNavigator();

export function Drawer({children}: { children: React.ReactNode | React.ReactNode[] }) {
    return <Navigator>{children}</Navigator>;
}
