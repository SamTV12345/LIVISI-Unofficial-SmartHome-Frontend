import {DefaultTheme, ThemeProvider} from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import {useEffect} from 'react';
import 'react-native-reanimated';
import {getBaseURL, getServerConfig, init, updateServerConfig} from "@/utils/sqlite";
import {Slot, useRouter} from 'expo-router';
import {useContentModel} from "@/store/store";
import {QueryClientProvider} from "@tanstack/react-query";
import {queryClient} from "@/lib/queryClient";
import {createGatewayQueryClient} from "@/lib/openapi/client";
import {ConfigData} from "@/models/ConfigData";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const bootstrap = async () => {
      init();

      try {
        const activeGateway = await getBaseURL();
        if (!activeGateway) {
          router.replace("/login");
          return;
        }

        const gateway = {
          baseURL: activeGateway.id,
          username: activeGateway.username ?? "",
          password: activeGateway.password ?? "",
          label: activeGateway.label ?? ""
        };

        useContentModel.getState().setGateway(gateway);

        let oldConfig: unknown;
        try {
          oldConfig = getServerConfig(activeGateway.id);
        } catch {
          oldConfig = undefined;
        }

        const gatewayApi = createGatewayQueryClient(gateway);
        const config = await queryClient.fetchQuery(
          gatewayApi.queryOptions("get", "/api/server", undefined, {staleTime: 0})
        ) as ConfigData;
        if (JSON.stringify(oldConfig) !== JSON.stringify(config)) {
          updateServerConfig(config, gateway.baseURL);
        }

        useContentModel.getState().setConfig(config);
        router.replace("/main/devices/(tabs)");
      } catch {
        router.replace("/login");
      } finally {
        SplashScreen.hideAsync();
      }
    };

    void bootstrap();
  }, [router]);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider value={DefaultTheme}>
                <Slot>
                </Slot>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
