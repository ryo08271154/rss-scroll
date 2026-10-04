import { ThemeContext } from "@/context/ThemeContext";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Stack, useLocalSearchParams, useRoute } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Platform,
  Pressable,
  Share,
  TouchableOpacity,
  useTVEventHandler,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

const appIcon = require("@/assets/images/icon.png");

export default function ReaderLayout() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const { t } = useTranslation();
  const c = useContext(ThemeContext);
  const route = useRoute();
  const [isQrVisible, setIsQrVisible] = useState(false);

  useTVEventHandler?.((event) => {
    if (!isQrVisible) return;

    setIsQrVisible(false);
  });

  return (
    <>
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
                {!Platform.isTV && (
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
                )}

                {Platform.isTV && (
                  <TouchableOpacity onPress={async () => setIsQrVisible(true)}>
                    <Ionicons name="qr-code-outline" size={24} color={c.text} />
                  </TouchableOpacity>
                )}
              </View>
            ),
          }}
        />
      </Stack>

      {isQrVisible && (
        <Modal
          transparent={true}
          visible={true}
          onRequestClose={() => {
            setIsQrVisible(false);
          }}
        >
          <Pressable
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => setIsQrVisible(false)}
          >
            <QRCode size={300} value={url} logo={appIcon} />
          </Pressable>
        </Modal>
      )}
    </>
  );
}
