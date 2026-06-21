import { ThemeContext } from "@/context/ThemeContext";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Stack, useLocalSearchParams } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

export default function ReaderLayout() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const { t } = useTranslation();
  const c = useContext(ThemeContext);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t("settingReaderModeName"),
          headerRight: () => (
            <Pressable onPress={() => openBrowserAsync(url)}>
              <Ionicons name="open-outline" size={24} color={c.text} />
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
