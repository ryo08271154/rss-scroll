import { SettingsContext } from "@/context/SettingsContext";
import { getCategories, getRssArticles } from "@/lib/rss";
import { Article } from "@/types/article";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Platform, StyleSheet } from "react-native";
import CategoryItem from "./CategoryItem";

type Props = {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
};
export default function CategoryPicker({
  selectedCategory,
  setSelectedCategory,
}: Props) {
  const { t } = useTranslation();
  const { settings, setSettings, saveSettings, resetSettings } =
    useContext(SettingsContext);

  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const categories = useMemo(() => {
    return [t("all"), ...getCategories(allArticles)];
  }, [allArticles, t]);

  // カテゴリー表示用
  useEffect(() => {
    (async () => {
      const allArticlesData = await getRssArticles(true, settings);
      setAllArticles(allArticlesData);
    })();
  }, [settings]);

  if (Platform.isTV) return null;

  return (
    <FlatList
      style={styles.container}
      data={categories}
      renderItem={({ item }) => (
        <CategoryItem
          category={item}
          selected={selectedCategory === item}
          onPress={() => {
            setSelectedCategory(item);
          }}
        />
      )}
      horizontal
      showsHorizontalScrollIndicator={false}
    />
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    position: "relative",
  },
});
