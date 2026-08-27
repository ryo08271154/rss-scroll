import ArticleCard from "@/components/ArticleCard";
import CategoryPicker from "@/components/CategoryPicker";
import { SettingsContext } from "@/context/SettingsContext";
import { getRssArticles } from "@/lib/rss";
import { Article } from "@/types/article";
import { Category } from "@/types/categories";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  RefreshControl,
  useWindowDimensions,
  View,
} from "react-native";

export default function FeedScreen() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>({
    name: t("all"),
    keywords: [],
  });

  const [refreshing, setRefreshing] = useState(false);
  const { settings, setSettings, saveSettings, resetSettings } =
    useContext(SettingsContext);

  const router = useRouter();
  const { width } = useWindowDimensions();

  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);

  const updateArticles = useCallback(
    async (useCache: boolean = true): Promise<Article[]> => {
      const articlesData = await getRssArticles(
        useCache,
        settings,
        selectedCategory.name === t("all")
          ? undefined
          : selectedCategory.keywords,
      );
      setArticles(articlesData);

      try {
        flatListRef.current?.scrollToIndex({ animated: true, index: 0 });
      } catch (e) {}
      return articlesData;
    },
    [selectedCategory, settings, t],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    await updateArticles(false);

    setRefreshing(false);
  }, [updateArticles]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateArticles();
  }, [updateArticles]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e: any) => {
      if (navigation.isFocused()) {
        try {
          flatListRef.current?.scrollToIndex({ animated: true, index: 0 });
        } catch (e) {}
      }
    });
    return unsubscribe;
  }, [navigation]);

  // カテゴリー変更で記事を更新
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateArticles(true);
  }, [selectedCategory, updateArticles]);

  return (
    <View style={{ flex: 1 }}>
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          zIndex: 100,
        }}
      >
        <CategoryPicker
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </View>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ArticleCard article={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ref={flatListRef}
        key={width >= 768 ? "grid" : "list"}
        numColumns={width >= 768 ? 2 : 1}
      />
    </View>
  );
}
