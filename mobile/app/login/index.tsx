import {SafeAreaView} from "react-native-safe-area-context";
import {StyleSheet, Text} from "react-native";
import {Colors} from "@/constants/Colors";
import {PrimaryButton} from "@/components/PrimaryButton";
import {useContentModel} from "@/store/store";
import {InputField} from "@/components/InputField";
import {fetchAPIConfig} from "@/lib/api";
import {saveBaseURL, updateServerConfig} from "@/utils/sqlite";
import {router} from "expo-router";
import {ThemedView} from "@/components/ThemedView";
import {isValidHttpUrl} from "@/utils/url";
import {useState} from "react";

export default function LoginScreen() {
    const baseURL = useContentModel((state) => state.baseURL);
    const setBaseURL = useContentModel((state) => state.setBaseURL);
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const onLogin = async () => {
        const normalizedBaseURL = (baseURL ?? "").trim().toLowerCase();
        setBaseURL(normalizedBaseURL);

        if (!isValidHttpUrl(normalizedBaseURL)) {
            setError("Bitte eine gültige URL mit http:// oder https:// eingeben.");
            return;
        }

        setError("");
        setIsLoading(true);
        try {
            const config = await fetchAPIConfig(normalizedBaseURL);
            saveBaseURL(normalizedBaseURL);
            updateServerConfig(config, normalizedBaseURL);
            useContentModel.getState().setConfig(config);
            router.replace("/main/devices/(tabs)");
        } catch (reason) {
            setError("Verbindung fehlgeschlagen. Bitte URL und Server prüfen.");
        } finally {
            setIsLoading(false);
        }
    };

    return <SafeAreaView style={{flex: 1}}>
        <ThemedView style={styles.view}>
            <ThemedView style={{backgroundColor: Colors.background, width: "80%"}}>
                <InputField
                    error={error}
                    placeholder="Smarthome-URL"
                    value={baseURL ?? ""}
                    onChange={(value) => {
                        setError("");
                        setBaseURL(value);
                    }}
                />
                <PrimaryButton title={isLoading ? "Verbinden..." : "Login"} onClick={onLogin}/>
                {error.length > 0 && <Text style={styles.errorText}>{error}</Text>}
            </ThemedView>
        </ThemedView>
    </SafeAreaView>;
}

export const styles = StyleSheet.create({
    button: {
        borderRadius: 20,
        alignItems: "center",
        backgroundColor: Colors.color.green,
        color: "#fff"
    },
    view: {
        backgroundColor: Colors.background,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        flexGrow: 1
    },
    errorText: {
        color: "#ff6b6b",
        marginTop: 10
    }
});
