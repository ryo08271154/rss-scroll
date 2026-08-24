import CategoryPicker from "@/components/CategoryPicker";
import ReelCard from "@/components/ReelCard";
import { SettingsContext } from "@/context/SettingsContext";
import { useToggleSavedArticle } from "@/hooks/useToggleSavedArticle";
import { scheduleArticleNotifications } from "@/lib/notifications";
import { getRssArticles } from "@/lib/rss";
import { addViewedArticleId, getViewedArticleIds } from "@/lib/viewedArticles";
import { Article } from "@/types/article";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { Stack, Tabs, useNavigation, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Switch,
  Text,
  View,
  useTVEventHandler,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const appIcon = require("@/assets/images/icon.png");

export default function HomeScreen() {
  const [height, setHeight] = useState(0);
  const { t } = useTranslation();

  const indexRef = useRef(0);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(t("all"));

  const [refreshing, setRefreshing] = useState(false);
  const { settings, setSettings, saveSettings, resetSettings } =
    useContext(SettingsContext);

  const router = useRouter();
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);

  const [isFocused, setIsFocused] = useState(false);
  const { toggleSavedArticle } = useToggleSavedArticle();

  const updateArticles = useCallback(
    async (useCache: boolean = true): Promise<Article[]> => {
      const hintArticles: Article[] = [
        {
          id: "1",
          title: t("hint1Title"),
          description: t("hint1Description"),
          imageUrl: appIcon,
          url: "rssscroll://settings",
          pubDate: "2026-05-10 15:30:00",
          summary: t("hint1Summary"),
          source: t("hintSource"),
        },
        {
          id: "2",
          title: t("hint2Title"),
          description: t("hint2Description"),
          imageUrl: appIcon,
          url: "rssscroll://feed",
          pubDate: "2026-05-10 15:30:00",
          summary: t("hint2Summary"),
          source: t("hintSource"),
        },
        {
          id: "3",
          title: t("hint3Title"),
          description: t("hint3Description"),
          imageUrl: appIcon,
          url: "rssscroll://settings",
          pubDate: "2026-05-10 15:30:00",
          summary: t("hint3Summary"),
          source: t("hintSource"),
        },
      ];

      const articlesData = await getRssArticles(
        useCache,
        settings,
        selectedCategory === t("all") ? undefined : selectedCategory,
      );

      const viewedArticleIds = await getViewedArticleIds();

      // 表示された記事を除外
      const unseenArticles = articlesData.filter(
        (article) => !viewedArticleIds.includes(article.id),
      );

      // スクロールせずにもう表示されてるので表示済みに追加
      if (unseenArticles.length > 0) {
        addViewedArticleId(unseenArticles[0].id);
      }

      setArticles(unseenArticles);

      // 一番上にスクロール
      try {
        flatListRef.current?.scrollToIndex({ animated: true, index: 0 });
      } catch (e) {
        console.log(e);
      }

      if (articlesData.length === 0) {
        setArticles(hintArticles);
      }

      if (unseenArticles.length === 0 && articlesData.length > 0) {
        Toast.show({
          type: "info",
          text1: t("noNewArticlesTitle"),
          text2: t("noNewArticlesMessage"),
          position: "bottom",
        });

        setArticles(articlesData);
      }

      //通知設定がオンのとき
      if (
        settings.find((setting) => setting.key === "notifications")?.value &&
        selectedCategory === t("all")
      ) {
        // 通知登録
        await scheduleArticleNotifications(
          [...unseenArticles].reverse().slice(0, 6),
        );
      }

      // 最後までスクロールしたときのための記事を追加
      setArticles((prev) => [
        ...prev,
        {
          id: "0",
          title: t("allArticlesDisplayedTitle"),
          description: t("allArticlesDisplayedDescription"),
          imageUrl: appIcon,
          url: "",
          pubDate: new Date().toISOString(),
          summary: t("allArticlesDisplayedSummary"),
          source: t("hintSource"),
        },
      ]);
      return articlesData;
    },
    [selectedCategory, settings, t],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    await updateArticles(false);

    setRefreshing(false);
  }, [updateArticles]);

  // 初回読み込み
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onRefresh();
    (async () => {
      const savedAutoScroll = await AsyncStorage.getItem("autoScroll");
      if (savedAutoScroll !== null) {
        setAutoScroll(JSON.parse(savedAutoScroll));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ホームタブで再読み込み
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e: any) => {
      if (navigation.isFocused()) {
        onRefresh();
      }
    });
    return unsubscribe;
  }, [navigation, settings, onRefresh]);

  // カテゴリー変更で記事を更新
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateArticles(true);
  }, [selectedCategory, updateArticles]);

  // 自動スクロール
  useEffect(() => {
    if (!autoScroll) {
      if (Platform.OS === "android" || Platform.OS === "ios") {
        deactivateKeepAwake();
      }
      return;
    }

    Toast.show({
      type: "info",
      text1: t("autoScroll"),
      text2: t("autoScrollHint"),
      position: "bottom",
    });

    if (Platform.OS === "android" || Platform.OS === "ios") {
      activateKeepAwakeAsync();
    }

    const interval = setInterval(() => {
      if (indexRef.current < articles.length - 1) {
        flatListRef.current?.scrollToIndex({
          animated: true,
          index: indexRef.current + 1,
        });
      } else {
        onRefresh();
      }
    }, 10000);

    return () => {
      if (Platform.OS === "android" || Platform.OS === "ios") {
        deactivateKeepAwake();
      }
      clearInterval(interval);
    };
  }, [t, autoScroll, articles.length, onRefresh]);

  // 自動スクロールの状態を保存
  useEffect(() => {
    AsyncStorage.setItem("autoScroll", JSON.stringify(autoScroll));
  }, [autoScroll]);

  // TV用
  useTVEventHandler?.((event) => {
    if (!isFocused) return;

    if (event.eventType === "select") {
      router.push(
        `/reader?url=${encodeURIComponent(articles[indexRef.current].url)}`,
      );
    } else if (event.eventType === "down") {
      if (indexRef.current >= articles.length - 1) return;

      flatListRef.current?.scrollToIndex({
        animated: true,
        index: indexRef.current + 1,
      });
    } else if (event.eventType === "up") {
      if (indexRef.current === 0) return;

      flatListRef.current?.scrollToIndex({
        animated: true,
        index: indexRef.current - 1,
      });
    } else if (event.eventType === "longDown") {
      if (indexRef.current >= articles.length - 1) return;

      flatListRef.current?.scrollToIndex({
        animated: true,
        index: indexRef.current + 1,
      });
    } else if (event.eventType === "longUp") {
      if (indexRef.current === 0) return;

      flatListRef.current?.scrollToIndex({
        animated: true,
        index: indexRef.current - 1,
      });
    } else if (event.eventType === "right") {
      if (autoScroll) {
        toggleSavedArticle(articles[indexRef.current].id);
        return;
      }

      setAutoScroll(true);
    } else if (event.eventType === "left") {
      setAutoScroll(false);
    }
  });

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      onFocus={() => {
        setIsFocused(true);
      }}
      onBlur={() => {
        setIsFocused(false);
      }}
    >
      {autoScroll ? (
        <Tabs.Screen options={{ tabBarStyle: { display: "none" } }} />
      ) : (
        <Tabs.Screen options={{ tabBarStyle: { display: "flex" } }} />
      )}

      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView
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
      </SafeAreaView>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={height}
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        snapToAlignment="start"
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <ReelCard
            article={item}
            height={height}
            modalVisible={modalVisible}
            setModalVisible={setModalVisible}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={insets.top + 16}
          />
        }
        ref={flatListRef}
        onMomentumScrollEnd={(e) => {
          // スクロール位置から現在のインデックスを計算
          indexRef.current =
            height > 0 ? Math.round(e.nativeEvent.contentOffset.y / height) : 0;

          // 表示済みに追加
          const article = articles[indexRef.current];

          if (!article) return;

          addViewedArticleId(article.id);
        }}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <Pressable
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.1)",
          }}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 24,
              marginBottom: 50,
              borderRadius: 10,
            }}
          >
            <Text>{t("autoScroll")}</Text>
            <Switch value={autoScroll} onValueChange={setAutoScroll} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
