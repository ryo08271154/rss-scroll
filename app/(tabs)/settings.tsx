import { SettingsContext } from "@/context/SettingsContext";
import { ThemeContext } from "@/context/ThemeContext";
import { requestNotificationPermission } from "@/lib/notifications";
import { reloadAppAsync } from "expo";
import Constants from "expo-constants";
import { openBrowserAsync } from "expo-web-browser";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  AppState,
  Button,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { settings, setSettings, saveSettings, resetSettings } =
    useContext(SettingsContext);
  const [newUrl, setNewUrl] = useState("");

  const c = useContext(ThemeContext);

  async function handleChange(key: string, value: any) {
    const newSettings = settings.map((item) =>
      item.key === key ? { ...item, value } : item,
    );

    if (key === "notifications" && value === true) {
      const status = await requestNotificationPermission();
      if (status === false) {
        Alert.alert(
          t("error"),
          "Notification permission is required to enable notifications.",
          [
            {
              text: t("ok"),
              onPress: () => {
                Linking.openSettings();
              },
            },
          ],
        );
        return;
      }
    }

    setSettings(newSettings);
    saveSettings(newSettings);
  }

  function handleAddUrl(url: string) {
    if (!url.trim()) {
      return;
    }

    // URLチェック
    try {
      new URL(url.trim());
    } catch (e) {
      Alert.alert("Error", t("invalidUrl"));
      return;
    }

    const currentItem = settings.find((item) => item.key === "rssFeedUrls");
    const urls = Array.isArray(currentItem?.value) ? currentItem.value : [];
    const nextUrls = [...urls, url.trim()];
    handleChange("rssFeedUrls", nextUrls);
    setNewUrl("");
  }

  function handleRemoveUrl(indexToRemove: number) {
    const currentItem = settings.find((item) => item.key === "rssFeedUrls");
    const urls = Array.isArray(currentItem?.value) ? currentItem.value : [];
    const nextUrls = urls.filter((_, index) => index !== indexToRemove);
    handleChange("rssFeedUrls", nextUrls);
  }

  function launchNotice() {
    if (
      Constants.appOwnership === "expo" ||
      Constants.executionEnvironment === "storeClient"
    ) {
      // Expo Goでは表示不可
      Alert.alert(
        "Notice",
        "Open source licenses are not available in Expo Go.",
      );
      return;
    }
    const { ReactNativeLegal } = require("react-native-legal");
    ReactNativeLegal.launchLicenseListScreen("OSS Notice");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {settings.map((item, index) => {
        const setting = settings.find((s) => s.key === item.key) || item;
        return (
          <View key={item.key} style={styles.settingBlock}>
            <Text style={[styles.title, { color: c.title }]}>{item.name}</Text>
            <Text style={[styles.description, { color: c.text }]}>
              {item.description}
            </Text>
            {item.type === "switch" && (
              <Switch
                value={setting.value}
                onValueChange={(newValue) => {
                  handleChange(setting.key, newValue);
                }}
              />
            )}
            {item.type === "text" && (
              <TextInput
                style={styles.input}
                value={setting.value}
                onChangeText={(newValue) => {
                  handleChange(setting.key, newValue);
                }}
                placeholder={t("enterValue")}
              />
            )}
            {item.type === "urls" && (
              <View style={styles.urlsContainer}>
                <TextInput
                  style={[styles.input, { color: c.text }]}
                  value={newUrl}
                  onChangeText={setNewUrl}
                  keyboardType="url"
                  autoCapitalize="none"
                />
                <Button title={t("add")} onPress={() => handleAddUrl(newUrl)} />
                {Array.isArray(setting.value) && setting.value.length > 0 ? (
                  <View style={styles.urlList}>
                    {setting.value.map((url: string, urlIndex: number) => (
                      <View key={`${url}-${urlIndex}`} style={styles.urlRow}>
                        <Text style={[styles.urlText, { color: c.text }]}>
                          {url}
                        </Text>
                        <Button
                          title={t("remove")}
                          onPress={() => handleRemoveUrl(urlIndex)}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyMessage}>{t("noUrls")}</Text>
                )}
              </View>
            )}
          </View>
        );
      })}
      <Button
        title={t("languageSettings")}
        onPress={() => {
          // 設定画面から戻ってきたら再読み込みして言語を反映する
          const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") {
              sub.remove();
              reloadAppAsync();
            }
          });

          Alert.alert(
            "Open Settings",
            "Please open the app settings to change language.",
          );

          try {
            Linking.openSettings();
          } catch (e) {
            console.log(e);
          }
        }}
      />
      <Button title={t("resetSettings")} onPress={resetSettings} />
      <Button
        title="GitHub"
        onPress={() =>
          openBrowserAsync("https://github.com/ryo08271154/rss-scroll")
        }
      />
      <Button onPress={launchNotice} title="Open source licenses" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  settingBlock: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    color: "#666",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  urlsContainer: {
    marginBottom: 12,
  },
  urlList: {
    marginTop: 12,
  },
  urlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  urlText: {
    flex: 1,
    marginRight: 12,
  },
  emptyMessage: {
    color: "#999",
  },
  infoText: {
    color: "#333",
  },
});
