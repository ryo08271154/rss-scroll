import { SavedArticleIdsContext } from "@/context/SavedArticleIdsContext";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

export function useToggleSavedArticle() {
  const { t } = useTranslation();
  const { toggleSavedArticleId } = useContext(SavedArticleIdsContext);

  async function toggleSavedArticle(articleId: string) {
    const isSaved = await toggleSavedArticleId(articleId);

    Toast.show({
      type: isSaved ? "success" : "error",
      text1: isSaved ? t("add") : t("remove"),
      text2: isSaved ? t("articleSaved") : t("articleRemoved"),
      position: "bottom",
    });

    return isSaved;
  }

  return { toggleSavedArticle };
}
