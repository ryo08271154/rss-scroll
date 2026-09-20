import { SavedArticleIdsProvider } from "@/context/SavedArticleIdsContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ThemeProvider as MyThemeProvider } from "@/context/ThemeContext";
import useNotificationObserver from "@/hooks/useNotificationObserver";
import "@/lib/i18n";
import {
  getNotifications,
  initNotifications,
  requestNotificationPermission,
} from "@/lib/notifications";
import "@/tasks/articleNotificationsTask";
import { SettingItem } from "@/types/settings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundTask from "expo-background-task";
import Constants from "expo-constants";
import { Stack, usePathname } from "expo-router";
import Head from "expo-router/head";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Platform, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

function RootLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const pathname = usePathname();

  // 通知
  useEffect(() => {
    initNotifications();
    const Notifications = getNotifications();
    if (!Notifications) {
      return;
    }

    (async () => {
      const data = await AsyncStorage.getItem("settings");
      if (!data) {
        return;
      }
      const settings = JSON.parse(data) as SettingItem[];
      if (!settings.find((setting) => setting.key === "notifications")?.value) {
        return;
      }

      const status = await requestNotificationPermission();
      if (status === false) {
        Toast.show({
          type: "error",
          text1: "Notification permission is required to enable notifications.",
          text2: "Please enable it in settings.",
          position: "bottom",
        });

        return;
      }

      await BackgroundTask.registerTaskAsync("ARTICLE_NOTIFICATIONS_TASK", {
        minimumInterval: 360,
      });
    })();
  }, []);

  // 通知を開いたときの処理
  useNotificationObserver();

  return (
    <>
      {Platform.OS === "web" && (
        <Head>
          <title>
            RSS Scroll{" "}
            {pathname.replace("/", "") === t(pathname.replace("/", ""))
              ? ""
              : t(pathname.replace("/", ""))}
          </title>
        </Head>
      )}
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <MyThemeProvider>
          <SettingsProvider>
            <SavedArticleIdsProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <Stack>
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="reader"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="category-customization"
                    options={{ title: t("settingCategoryCustomizationName") }}
                  />
                  <Stack.Screen name="licenses" />
                </Stack>
                <StatusBar style="auto" />
                <Toast />
              </GestureHandlerRootView>
            </SavedArticleIdsProvider>
          </SettingsProvider>
        </MyThemeProvider>
      </ThemeProvider>
    </>
  );
}

let AppRoot = RootLayout;

if (Constants.executionEnvironment !== "storeClient") {
  const { Observe, ObserveRoot } = require("expo-observe");
  Observe.configure({
    integrations: {
      "expo-router": { filteredParams: ["url"] },
    },
  });
  AppRoot = ObserveRoot.wrap(RootLayout);
}

export default AppRoot;
