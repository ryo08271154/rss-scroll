import {
  cancelAllNotifications,
  getNotifications,
  initNotifications,
  scheduleArticleNotifications,
} from "@/lib/notifications";
import { getRssArticles } from "@/lib/rss";
import { getViewedArticleIds } from "@/lib/viewedArticles";
import { SettingItem } from "@/types/settings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as TaskManager from "expo-task-manager";

TaskManager.defineTask("ARTICLE_NOTIFICATIONS_TASK", async () => {
  initNotifications();
  const Notifications = getNotifications();
  if (!Notifications) {
    return;
  }

  // 通知を送信する時間帯を制限する
  const date = new Date();
  if (date.getHours() < 6 || date.getHours() > 22) {
    return;
  }

  const data = await AsyncStorage.getItem("settings");
  if (!data) {
    return;
  }
  const settings = JSON.parse(data) as SettingItem[];
  if (!settings.find((setting) => setting.key === "notifications")?.value) {
    return;
  }

  const articles = await getRssArticles(false, settings);
  const viewedArticleIds = await getViewedArticleIds();

  if (!articles || articles.length === 0) {
    return;
  }

  await cancelAllNotifications();

  await scheduleArticleNotifications(
    articles
      .filter((article) => !viewedArticleIds.includes(article.id))
      .slice(0, 6),
  );
});
