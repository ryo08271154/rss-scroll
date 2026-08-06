import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useWindowDimensions } from "react-native";

export default function TabLayout() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  return (
    <Tabs
      screenOptions={{
        tabBarPosition: width >= 768 ? "left" : "bottom",
        tabBarVariant: width >= 768 ? "material" : "uikit",
        tabBarLabelPosition: "below-icon",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: t("feed"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t("saved"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("settings"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
