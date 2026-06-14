import { scheduleArticleNotifications } from "@/lib/notifications";
import { getRssArticles } from "@/lib/rss";
import { getViewedArticleIds } from "@/lib/viewedArticles";
import { SettingItem } from "@/types/settings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as TaskManager from "expo-task-manager";

TaskManager.defineTask("ARTICLE_NOTIFICATIONS_TASK", async () => {
  if (
    Constants.appOwnership === "expo" ||
    Constants.executionEnvironment === "storeClient"
  ) {
    // Expo Goでは通知不可
    return;
  }
  const Notifications = require("expo-notifications");

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

  // 表示された記事を除外してランダム１個
  const article = articles.filter(
    (article) => !viewedArticleIds.includes(article.id),
  )[0];

  if (!article) {
    return;
  }

  scheduleArticleNotifications(
    articles
      .filter((article) => !viewedArticleIds.includes(article.id))
      .slice(1, 6),
  );

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
    },
  });
});
