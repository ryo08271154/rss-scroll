import { SettingsContext } from "@/context/SettingsContext";
import { getCategories, getRssArticles } from "@/lib/rss";
import { Category } from "@/types/categories";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Platform, StyleSheet } from "react-native";
import CategoryItem from "./CategoryItem";

type Props = {
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
};
export default function CategoryPicker({
  selectedCategory,
  setSelectedCategory,
}: Props) {
  const { t } = useTranslation();
  const { settings, setSettings, saveSettings, resetSettings } =
    useContext(SettingsContext);

  const [categories, setCategories] = useState<Category[]>([]);

  // カテゴリー表示用
  useEffect(() => {
    (async () => {
      if (
        settings.find(
          (setting) => setting.key === "categoryCustomizationEnabled",
        )?.value === true
      ) {
        const userCategories = await AsyncStorage.getItem("categories");
        if (userCategories) {
          setCategories([
            { name: t("all"), keywords: [] },
            ...JSON.parse(userCategories),
          ]);
          return;
        }
      }

      const allArticlesData = await getRssArticles(true, settings);
      const defaultCategories = await getCategories(allArticlesData);

      setCategories([{ name: t("all"), keywords: [] }, ...defaultCategories]);

      await AsyncStorage.setItem(
        "categories",
        JSON.stringify(defaultCategories),
      );
    })();
  }, [settings, t]);

  if (Platform.isTV) return null;

  return (
    <FlatList
      style={styles.container}
      data={categories}
      renderItem={({ item }) => (
        <CategoryItem
          category={item.name}
          selected={selectedCategory.name === item.name}
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
