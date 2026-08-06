import { ThemeContext } from "@/context/ThemeContext";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Stack, useLocalSearchParams, useRoute } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { Share, TouchableOpacity, View } from "react-native";

export default function ReaderLayout() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const { t } = useTranslation();
  const c = useContext(ThemeContext);
  const route = useRoute();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t("settingReaderModeName"),
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity onPress={() => openBrowserAsync(url)}>
                <Ionicons name="open-outline" size={24} color={c.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () =>
                  await Share.share({
                    title: route.name,
                    url: url,
                    message: url,
                  })
                }
              >
                <Ionicons name="share-outline" size={24} color={c.text} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
    </Stack>
  );
}
