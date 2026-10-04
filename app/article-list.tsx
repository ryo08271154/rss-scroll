import ArticleFlatList from "@/components/ArticleFlatList";
import { SettingsContext } from "@/context/SettingsContext";
import { getRssArticles } from "@/lib/rss";
import { Article } from "@/types/article";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

export default function ArticleListScreen() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const { settings } = useContext(SettingsContext);
  const { keywords } = useLocalSearchParams<{ keywords: string }>();

  useEffect(() => {
    (async () => {
      const articlesData = await getRssArticles(
        true,
        settings,
        keywords.split(",").map((keyword) => keyword.trim()),
      );
      setArticles(articlesData);
    })();
  }, [keywords, settings]);

  const nativeGesture = Gesture.Native();

  const swipeRight = Gesture.Fling()
    .runOnJS(true)
    .direction(Directions.RIGHT)
    .onEnd(() => {
      router.back();
    });

  const composed = Gesture.Exclusive(swipeRight, nativeGesture);

  return (
    <>
      <Stack.Screen options={{ title: keywords }} />
      <GestureDetector gesture={composed}>
        <ArticleFlatList articles={articles} />
      </GestureDetector>
    </>
  );
}
