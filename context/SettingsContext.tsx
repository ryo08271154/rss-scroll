import { SettingItem } from "@/types/settings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

type SettingsContextType = {
  settings: SettingItem[];
  setSettings: Dispatch<SetStateAction<SettingItem[]>>;
  saveSettings: (data: SettingItem[]) => Promise<void>;
  resetSettings: () => Promise<void>;
};
export const SettingsContext = createContext<SettingsContextType>({
  settings: [],
  setSettings: () => {},
  saveSettings: async (data: SettingItem[]) => {},
  resetSettings: async () => {},
});

export const SettingsProvider: FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { t } = useTranslation();
  const settingItems: SettingItem[] = [
    {
      name: t("settingRssName"),
      description: t("settingRssDescription"),
      type: "urls",
      key: "rssFeedUrls",
      value: [],
    },
    {
      name: t("settingReaderModeName"),
      description: t("settingReaderModeDescription"),
      type: "switch",
      key: "readerMode",
      value: false,
    },
    {
      name: t("settingNotificationsName"),
      description: t("settingNotificationsDescription"),
      type: "switch",
      key: "notifications",
      value: false,
    },
    {
      name: t("version"),
      type: "info",
      key: "version",
      description: Application.nativeApplicationVersion || "",
    },
  ];
  const [settings, setSettings] = useState<SettingItem[]>(settingItems);
  const [isLoaded, setIsLoaded] = useState(false);

  async function loadSettings() {
    const data = await AsyncStorage.getItem("settings");
    if (data) {
      const saved: SettingItem[] = JSON.parse(data);
      const merged = settingItems.map((item) => {
        const savedItem = saved.find((s) => s.key === item.key);
        return savedItem ? { ...item, value: savedItem.value } : item;
      });
      setSettings(merged);
    } else {
      setSettings(settingItems);
      await saveSettings(settingItems);
    }
    setIsLoaded(true);
  }

  async function saveSettings(data: SettingItem[]) {
    await AsyncStorage.setItem("settings", JSON.stringify(data));
  }

  async function resetSettings() {
    await AsyncStorage.removeItem("settings");
    setSettings(settingItems);
    await loadSettings();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSettings();
  }, []);

  if (!isLoaded) return null;
  return (
    <SettingsContext.Provider
      value={{ settings, setSettings, saveSettings, resetSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
