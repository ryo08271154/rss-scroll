import { ThemeContext } from "@/context/ThemeContext";
import { Category } from "@/types/categories";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";

export default function CategoryCustomizationScreen() {
  const { t } = useTranslation();
  const c = useContext(ThemeContext);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryKeywords, setNewCategoryKeywords] = useState<string>("");

  useEffect(() => {
    AsyncStorage.getItem("categories").then((value) => {
      if (value) {
        setCategories(JSON.parse(value));
      }
    });
  }, []);
  useEffect(() => {
    AsyncStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  return (
    <>
      <Text style={{ color: c.title }}>{t("categoryName")}</Text>
      <TextInput
        style={[styles.input, { color: c.text }]}
        placeholder={t("categoryName")}
        value={newCategoryName}
        onChangeText={(text) => {
          setNewCategoryName(text);
        }}
      />
      <Text style={{ color: c.title }}>{t("keywords")}</Text>
      <TextInput
        style={[styles.input, { color: c.text }]}
        placeholder={t("keywords")}
        value={newCategoryKeywords}
        onChangeText={(text) => {
          setNewCategoryKeywords(text);
        }}
      />
      <Button
        title={t("add")}
        onPress={() => {
          if (!newCategoryName || !newCategoryKeywords) return;
          if (categories.find((c) => c.name === newCategoryName)) return;

          setCategories([
            ...categories,
            {
              name: newCategoryName,
              keywords: newCategoryKeywords
                .split(/[\s,、]+/)
                .filter((k) => k !== ""),
            },
          ]);
          setNewCategoryName("");
          setNewCategoryKeywords("");
        }}
      />

      <Text style={[styles.itemText, { color: c.title }]}>
        {t("settingCategoryCustomizationName")}
      </Text>
      <DraggableFlatList
        data={categories}
        keyExtractor={(item: Category) => item.name}
        renderItem={({ item, drag }) => (
          <TouchableOpacity
            style={[styles.item, { backgroundColor: c.background }]}
            onPress={() => {
              Alert.alert(
                t("remove"),
                `${t("categoryName")}: ${item.name}\n${t("keywords")}: ${item.keywords.join(", ")}`,
                [
                  {
                    text: t("no"),
                    style: "cancel",
                  },
                  {
                    text: t("yes"),
                    style: "destructive",
                    onPress: () => {
                      setCategories(
                        categories.filter((c) => c.name !== item.name),
                      );
                    },
                  },
                ],
              );
            }}
            onLongPress={() => {
              drag();
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemText, { color: c.text }]}>
                {item.name}
              </Text>
              <Text style={{ color: c.text }}>{item.keywords.join(", ")}</Text>
            </View>
            <Ionicons name="reorder-three-outline" size={28} color={c.text} />
          </TouchableOpacity>
        )}
        onDragEnd={({ data }) => setCategories(data)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  item: {
    flexDirection: "row",
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  itemText: {
    fontSize: 20,
  },
});
