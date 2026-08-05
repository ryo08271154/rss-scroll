import { SettingsContext } from "@/context/SettingsContext";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
export default function ReaderScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const { url } = useLocalSearchParams<{ url: string }>();
  const { settings, setSettings, saveSettings, resetSettings } =
    useContext(SettingsContext);

  useEffect(() => {
    if (!url) {
      router.back();
      return;
    }
    if (!settings.find((item) => item.key === "readerMode")?.value) {
      openBrowserAsync(url);
      router.back();
    }
  }, [settings, url, router]);

  function handleNavigationStateChange(navState: WebViewNavigation) {
    if (navState.title) {
      setTitle(navState.title.trim());
    }
  }
  return (
    <>
      {title && (
        <Stack.Screen
          options={{
            headerTitle: () => <Text adjustsFontSizeToFit>{title}</Text>,
          }}
        />
      )}
      <WebView
        style={{ flex: 1 }}
        source={{ uri: url }}
        cacheEnabled={true}
        injectedJavaScript={`
        document.querySelector("header")?.remove();
        document.querySelector(".ad-banner")?.remove();
        document.querySelector("footer")?.remove();

        document.querySelectorAll(".popup, .modal, .overlay").forEach(el => el.remove());

        document.querySelectorAll('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"]').forEach(el => el.remove());

        document.querySelectorAll("*").forEach(el => {
          const style = getComputedStyle(el);
          if (style.position === "fixed" || style.position === "sticky") {
            el.remove();
          }
        });

        const observer = new MutationObserver(() => {
          document.querySelectorAll('a[target="_blank"]').forEach(el => {
            el.removeAttribute("target");
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        true;
      `}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={(request) => {
          if (!url) return false;
          try {
            const hostname = new URL(request.url).hostname;
            const articleHostname = new URL(url).hostname;

            if (hostname !== articleHostname) {
              Alert.alert(
                t("externalLink.title"),
                t("externalLink.message", { hostname }),
                [
                  {
                    text: t("cancel"),
                    style: "cancel",
                  },
                  {
                    text: t("ok"),
                    onPress: () => {
                      openBrowserAsync(request.url);
                    },
                  },
                ],
              );
              return false;
            }
          } catch (error) {
            return false;
          }
          return true;
        }}
        setSupportMultipleWindows={false}
      />
    </>
  );
}
