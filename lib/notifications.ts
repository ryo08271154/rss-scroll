import { Article } from "@/types/article";
import Constants from "expo-constants";

const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === "storeClient";

let Notifications: typeof import("expo-notifications") | null = null;

export function initNotifications() {
  if (isExpoGo) return;

  Notifications = require("expo-notifications");
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function getNotifications() {
  return Notifications;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;

  await Notifications.setNotificationChannelAsync("article-notifications", {
    name: "Article Notifications",
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const result = await Notifications.requestPermissionsAsync();
    status = result.status;
  }
  return status === "granted";
}

export async function scheduleArticleNotifications(articles: Article[]) {
  if (!Notifications) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  let seconds = 3600;
  for (const article of articles) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: article.title,
        subtitle: article.source,
        body: article.description,
        data: {
          articleId: article.id,
          url: article.url,
        },
      },

      trigger: {
        channelId: "article-notifications",
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: seconds,
      },
    });

    // 1時間ごとに通知
    seconds += 3600;
  }
}
