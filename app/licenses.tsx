import { useEffect } from "react";
import { ScrollView, Text } from "react-native";
import licenses from "../assets/licenses.json";
export default function LicensesScreen() {
  useEffect(() => {}, []);

  return (
    <ScrollView>
      <Text>{JSON.stringify(licenses, null, 2)}</Text>
    </ScrollView>
  );
}
