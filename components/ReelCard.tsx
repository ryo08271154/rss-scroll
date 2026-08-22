import { SavedArticleIdsContext } from "@/context/SavedArticleIdsContext";
import { ThemeContext } from "@/context/ThemeContext";
import { Article } from "@/types/article";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
const styles = StyleSheet.create({
  card: {
    justifyContent: "flex-end",
    padding: 24,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  source: { fontSize: 14, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: "bold", marginBottom: 12 },
  description: { fontSize: 20 },
  summary: { fontSize: 18 },
});

type Props = {
  article: Article;
  height: number;
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
};
export default function ReelCard({
  article,
  height,
  modalVisible,
  setModalVisible,
}: Props) {
  const c = useContext(ThemeContext);
  const router = useRouter();
  const { t } = useTranslation();
  const { toggleSavedArticleId } = useContext(SavedArticleIdsContext);

  const nativeGesture = Gesture.Native();

  const singleTap = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(1)
    .onEnd(() => {
      router.push(`/reader?url=${encodeURIComponent(article.url)}`);
    });

  const doubleTap = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(2)
    .onEnd(async () => {
      const isSaved = await toggleSavedArticleId(article.id);
      if (isSaved) {
        Toast.show({
          type: "success",
          text1: t("add"),
          text2: t("articleSaved"),
          position: "bottom",
        });
      } else {
        Toast.show({
          type: "error",
          text1: t("remove"),
          text2: t("articleRemoved"),
          position: "bottom",
        });
      }
    });

  const longPress = Gesture.LongPress()
    .runOnJS(true)
    .maxDistance(400)
    .onStart(() => {
      setModalVisible(true);
    });

  // 優先順位
  const composed = Gesture.Simultaneous(
    nativeGesture,
    Gesture.Exclusive(longPress, doubleTap, singleTap),
  );

  return (
    <GestureDetector gesture={composed}>
      <View style={[{ height }]}>
        <ImageBackground
          source={article.imageUrl}
          style={[styles.card, { height }]}
          contentFit="cover"
          cachePolicy="memory-disk"
        >
          <LinearGradient
            colors={c.gradientColors}
            locations={[0.4, 1]}
            style={styles.gradient}
          />

          <Text style={[styles.source, { color: c.source }]}>
            {article.source}
            {article.pubDate
              ? ` · ${new Date(article.pubDate).toLocaleString()}`
              : ""}
          </Text>
          <Text style={[styles.title, { color: c.text }]}>{article.title}</Text>
          <Text style={[styles.summary, { color: c.text }]}>
            {article.summary}
          </Text>
          <Text style={[styles.description, { color: c.text }]}>
            {article.description}
          </Text>
        </ImageBackground>
      </View>
    </GestureDetector>
  );
}
