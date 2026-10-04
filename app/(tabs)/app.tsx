import { ThemeContext } from "@/context/ThemeContext";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Release = {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  assets: {
    name: string;
    browser_download_url: string;
    size: number;
  }[];
};

const DOWNLOADER_CODE = "8044284";

export default function AppScreen() {
  const { t } = useTranslation();
  const c = useContext(ThemeContext);

  const [release, setRelease] = useState<Release | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          "https://api.github.com/repos/ryo08271154/rss-scroll/releases/latest",
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data: Release = await res.json();
        setRelease(data);
      } catch {}
    })();
  }, []);

  const apkAsset = release?.assets.find((a) => a.name.endsWith(".apk"));

  return (
    <>
      <Tabs.Screen options={{ tabBarBadge: undefined }} />
      <ScrollView
        style={{ backgroundColor: c.background }}
        contentContainerStyle={styles.container}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.icon}
          />
          <Text style={[styles.appName, { color: c.title }]}>RSS Scroll</Text>
        </View>

        <View style={styles.card}>
          {apkAsset && (
            <Button
              title="Download APK (Android / Android TV / Google TV)"
              onPress={() => openBrowserAsync(apkAsset.browser_download_url)}
            />
          )}
          <Button
            title="Download for Meta Quest"
            onPress={() =>
              openBrowserAsync(
                "https://www.meta.com/ja-jp/experiences/rss-scroll/27065469556422282",
              )
            }
          />
          <Button
            title="Other Download Options"
            onPress={() =>
              openBrowserAsync(
                "https://github.com/ryo08271154/rss-scroll#%E3%83%80%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%89",
              )
            }
          />
        </View>

        {/* インストール手順 (Android TV) */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="tv-outline" size={18} />
            <Text style={[styles.sectionTitle, { color: c.title }]}>
              {t("installHowToTv")}
            </Text>
          </View>
          <Text style={[styles.stepText, { color: c.text }]}>
            {t("installTvInstructions", { code: DOWNLOADER_CODE })}
          </Text>
        </View>

        {/* GitHub リンク */}
        <TouchableOpacity
          style={styles.githubLink}
          onPress={() =>
            openBrowserAsync("https://github.com/ryo08271154/rss-scroll")
          }
        >
          <Ionicons name="logo-github" size={18} color={c.source} />
          <Text style={{ color: c.source }}>GitHub</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  githubLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  stepText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
