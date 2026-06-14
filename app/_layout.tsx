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
import * as BackgroundTask from "expo-background-task";
import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 通知
  useEffect(() => {
    initNotifications();
    const Notifications = getNotifications();
    if (!Notifications) {
      return;
    }

    (async () => {
      Notifications.setNotificationChannelAsync("article-notifications", {
        name: "Article Notifications",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      requestNotificationPermission();

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
