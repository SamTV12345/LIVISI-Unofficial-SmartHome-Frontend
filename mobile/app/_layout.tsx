import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {useEffect, useState} from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import {View} from "react-native";
import {getBaseURL, getServerConfig, updateServerConfig} from "@/utils/sqlite";
import {Redirect, Slot, Stack, useNavigationContainerRef, useRootNavigationState, useRouter} from 'expo-router';
import {SafeAreaView} from "react-native-safe-area-context";
import {useContentModel} from "@/store/store";
import {fetchAPIConfig} from "@/lib/api";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });


  useEffect(() => {
    getBaseURL().then(c=> {
        if (c == null) {
            console.log("config is null")
            SplashScreen.hideAsync();
            setImmediate(() => {
                router.replace('/login')
            })
        } else {
            useContentModel.getState().setBaseURL(c.id!)
            let oldConfig: any
            try {
                 oldConfig = getServerConfig(c.id!)
            } catch (e) {
                console.log("Error getting config")
            }
            fetchAPIConfig(c.id!)
                .then(r => {
                    if (JSON.stringify(oldConfig) === JSON.stringify(r)) {
                        setImmediate(() => {
                            SplashScreen.hideAsync();
                            return router.replace('/main/home');
                        })
                    } else {
                        updateServerConfig(r, c.id!)
                        setImmediate(() => {
                            SplashScreen.hideAsync();
                            return router.replace('/main/home');
                        })
                    }
                    useContentModel.getState().setConfig(r)
                }).catch((reason) => {
                console.log(reason)
            })
      }
    })
  }, []);

  return (
    <ThemeProvider value= {DarkTheme}>
        <Slot>
        </Slot>
    </ThemeProvider>
  );
}
