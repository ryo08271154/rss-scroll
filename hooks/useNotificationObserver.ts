import { getNotifications } from "@/lib/notifications";
import { addViewedArticleId } from "@/lib/viewedArticles";
import { Notification } from "expo-notifications";

import { router } from "expo-router";
import { useEffect } from "react";

export default function useNotificationObserver() {
  useEffect(() => {
    const Notifications = getNotifications();
    if (!Notifications) return;

    function redirect(notification: Notification) {
      const id = notification.request.content.data?.articleId;
      const url = notification.request.content.data?.url;

      if (typeof id === "string") {
        setTimeout(() => {
          addViewedArticleId(id);
        }, 1000);
      }
      if (typeof url === "string") {
        setTimeout(() => {
          router.push(`/reader?url=${encodeURIComponent(url)}`);
        }, 1000);
      }
    }

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);
}
