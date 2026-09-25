import BottomModal from "@/components/BottomModal";
import { ThemeContext } from "@/context/ThemeContext";
import { Category } from "@/types/categories";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Stack } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Category | null>(null);

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
      <Stack.Screen
        options={{
          headerRight: () => (
            <Ionicons
              name="add"
              size={24}
              color={c.text}
              onPress={() => setIsModalVisible(true)}
            />
          ),
        }}
      />

      <BottomModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        contentStyle={{ width: "100%" }}
      >
        <Text>{t("categoryName")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("categoryName")}
          value={newCategoryName}
          onChangeText={(text) => {
            setNewCategoryName(text);
          }}
        />
        <Text>{t("keywords")}</Text>
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
            setIsModalVisible(false);
          }}
        />
        <Button
          title={t("cancel")}
          onPress={() => {
            setIsModalVisible(false);
          }}
        />
      </BottomModal>

      <DraggableFlatList
        data={categories}
        keyExtractor={(item: Category) => item.name}
        renderItem={({ item, drag }) => (
          <TouchableOpacity
            style={[styles.item, { backgroundColor: c.background }]}
            onPress={() => {
              setRemoveTarget(item);
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

      <BottomModal
        visible={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        contentStyle={{ width: "100%" }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          {t("remove")}
        </Text>
        <Text>
          {`${t("categoryName")}: ${removeTarget?.name}\n${t("keywords")}: ${removeTarget?.keywords.join(", ")}`}
        </Text>
        <Button
          title={t("yes")}
          color="red"
          onPress={() => {
            if (removeTarget) {
              setCategories(
                categories.filter((c) => c.name !== removeTarget.name),
              );
            }
            setRemoveTarget(null);
          }}
        />
        <Button title={t("no")} onPress={() => setRemoveTarget(null)} />
      </BottomModal>
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
