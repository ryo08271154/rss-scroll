import { SavedArticleIdsProvider } from "@/context/SavedArticleIdsContext";
import { SettingsContext, SettingsProvider } from "@/context/SettingsContext";
import { ThemeProvider as MyThemeProvider } from "@/context/ThemeContext";
import useNotificationObserver from "@/hooks/useNotificationObserver";
import "@/lib/i18n";
import {
  getNotifications,
  initNotifications,
  requestNotificationPermission,
} from "@/lib/notifications";
import "@/tasks/articleNotificationsTask";
import * as BackgroundTask from "expo-background-task";
import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { useContext, useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { settings } = useContext(SettingsContext);

  // 通知
  useEffect(() => {
    initNotifications();
    const Notifications = getNotifications();
    if (!Notifications) {
      return;
    }

    (async () => {
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
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <MyThemeProvider>
        <SettingsProvider>
          <SavedArticleIdsProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="reader" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
              <Toast />
            </GestureHandlerRootView>
          </SavedArticleIdsProvider>
        </SettingsProvider>
      </MyThemeProvider>
    </ThemeProvider>
  );
}
