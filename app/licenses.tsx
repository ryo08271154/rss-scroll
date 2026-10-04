import { ThemeContext } from "@/context/ThemeContext";
import { useContext } from "react";
import { ScrollView, Text } from "react-native";
import licenses from "../assets/licenses.json";
export default function LicensesScreen() {
  const c = useContext(ThemeContext);

  return (
    <ScrollView>
      <Text style={{ color: c.text }}>{JSON.stringify(licenses, null, 2)}</Text>
    </ScrollView>
  );
}
