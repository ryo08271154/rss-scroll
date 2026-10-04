import ArticleCard from "@/components/ArticleCard";
import { Article } from "@/types/article";
import { useNavigation } from "expo-router";
import { useEffect, useRef } from "react";
import { FlatList, RefreshControl, useWindowDimensions } from "react-native";

type Props = {
  articles: Article[];
  refreshing: boolean;
  onRefresh?: () => void;
};

export default function ArticleFlatList({
  articles,
  refreshing,
  onRefresh,
}: Props) {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    try {
      flatListRef.current?.scrollToIndex({ animated: true, index: 0 });
    } catch (e) {}
  }, [articles]);

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

  return (
    <FlatList
      data={articles}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ArticleCard article={item} />}
      refreshControl={
        onRefresh && (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        )
      }
      ref={flatListRef}
      key={width >= 768 ? "grid" : "list"}
      numColumns={width >= 768 ? 2 : 1}
    />
  );
}
