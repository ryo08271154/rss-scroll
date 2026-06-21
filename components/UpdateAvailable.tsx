import { ThemeContext } from "@/context/ThemeContext";
import * as Device from "expo-device";
import { openBrowserAsync } from "expo-web-browser";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { Button, StyleSheet, Text, View } from "react-native";

export default function UpdateAvailable() {
  const c = useContext(ThemeContext);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: c.title }]}>
        {t("updateAvailableTitle")}
      </Text>
      <Text style={[styles.description, { color: c.text }]}>
        {t("updateAvailableDescription")}
      </Text>
      <Button
        title={t("updateAvailableButton")}
        color="green"
        onPress={() => {
          if (Device.brand === "oculus") {
            openBrowserAsync(
              "https://www.meta.com/ja-jp/experiences/rss-scroll/27065469556422282",
            );
          } else {
            openBrowserAsync(
              "https://github.com/ryo08271154/rss-scroll/releases/latest",
            );
          }
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "orange",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  description: {
    color: "#666",
  },
});
