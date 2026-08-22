import { ThemeContext } from "@/context/ThemeContext";
import { useToggleSavedArticle } from "@/hooks/useToggleSavedArticle";
import { Article as ArticleType } from "@/types/article";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
type Props = {
  article: ArticleType;
  onPress?: () => void;
};

export default function ArticleCard({ article, onPress }: Props) {
  const c = useContext(ThemeContext);
  const router = useRouter();
  const { toggleSavedArticle } = useToggleSavedArticle();

  async function handlePress() {
    if (onPress) {
      onPress();
      return;
    }
    router.push(`/reader?url=${encodeURIComponent(article.url)}`);
  }
  async function handleLongPress() {
    toggleSavedArticle(article.id);
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={styles.pressed}
    >
      <View style={styles.body}>
        <Image
          source={{ uri: article.imageUrl }}
          style={styles.image}
          cachePolicy="memory-disk"
        />
        <Text style={[styles.source, { color: c.source }]}>
          {article.source}
          {article.pubDate
            ? ` · ${new Date(article.pubDate).toLocaleString()}`
            : ""}
        </Text>
        <Text style={[styles.title, { color: c.title }]} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={[styles.summary, { color: c.text }]} numberOfLines={2}>
          {article.summary}
        </Text>
        <Text style={[styles.description, { color: c.text }]} numberOfLines={3}>
          {article.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {},
  pressed: {
    flex: 1,
    opacity: 0.9,
  },
  image: {
    height: 180,
  },
  body: {
    padding: 16,
  },
  source: {
    fontSize: 12,
  },
  title: {
    fontSize: 18,
  },
  summary: {
    fontSize: 14,
  },
  description: {
    fontSize: 13,
  },
});
