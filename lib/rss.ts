import { Article } from "@/types/article";
import { SettingItem } from "@/types/settings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { XMLParser } from "fast-xml-parser";
import { Alert } from "react-native";
export async function fetchRss(url: string): Promise<any> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata",
    parseTagValue: true,
    isArray: (name) => ["item", "entry", "media:content"].includes(name),
  });

  const res = await fetch(url);
  console.log(`Fetching RSS: ${url} - Status: ${res.status}`);
  const xml = await res.text();

  const parsed = await parser.parse(xml);

  return parsed;
}

export async function fetchAllRss(
  useCache: boolean = true,
  settings: SettingItem[],
): Promise<any[]> {
  const rssSettings = settings.find(
    (setting) => setting.key === "rssFeedUrls",
  ) || { value: [] };

  let feeds: any[] = [];
  for (const url of rssSettings.value) {
    // キャッシュを使用する場合は、まずキャッシュを確認
    if (useCache) {
      const cached = await getCachedRssItems(url);
      if (cached) {
        feeds.push(cached);
        continue;
      }
    }

    // キャッシュがない場合は、RSSをfetchしてキャッシュに保存
    try {
      const feed = await fetchRss(url);
      feeds.push(feed);

      cacheRssItems(url, feed);
    } catch (error) {
      Alert.alert("RSSの取得に失敗", `URL: ${url}\nエラー: ${error}`);
    }
  }
  return feeds;
}
export async function cacheRssItems(url: string, items: any[]) {
  await AsyncStorage.setItem(`rssItems:${url}`, JSON.stringify(items));
}
export async function getCachedRssItems(url: string): Promise<any[] | null> {
  const cached = await AsyncStorage.getItem(`rssItems:${url}`);
  if (cached) {
    return JSON.parse(cached);
  } else {
    return null;
  }
}
export async function clearCachedRssItems() {
  await AsyncStorage.removeItem("rssItems");
}
export async function getRss(
  useCache: boolean = true,
  settings: SettingItem[],
): Promise<any> {
  const feeds = await fetchAllRss(useCache, settings);
  return feeds;
}

function extractImageUrl(item: any): string {
  // 0. image フィールド
  if (item.image) return item.image;

  // 1. media:content
  const mediaContent = item["media:content"];
  if (mediaContent) {
    const url = mediaContent?.["@_url"] ?? mediaContent?.[0]?.["@_url"];
    if (url) return url;
  }

  // 2. enclosure
  const enclosure = item.enclosure;
  if (enclosure?.["@_type"]?.startsWith("image/")) {
    return enclosure["@_url"];
  }

  // 3. description内のimgタグ
  const description = item.description?.__cdata ?? item.description ?? "";
  const imgMatch = description.match(/<img[^>]+src="([^"]+)"/);
  if (imgMatch) return imgMatch[1];

  return "";
}
function extractText(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.__cdata ?? value["#text"] ?? String(value);
}
function extractDescription(item: any): string {
  const raw = item.description?.__cdata ?? item.description ?? "";
  return raw.replace(/<[^>]*>/g, "").trim();
}
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
export async function getRssArticles(
  useCache: boolean = true,
  settings: SettingItem[],
  category?: string,
): Promise<Article[]> {
  const feeds = await getRss(useCache, settings);
  const articles: Article[] = [];

  for (const feed of feeds) {
    const channel = feed?.rss?.channel ?? feed?.feed;
    if (!channel) continue;

    const source = channel.title?.__cdata ?? channel.title ?? "Unknown Feed";
    const items: any[] = [channel.item ?? channel.entry].flat().filter(Boolean);

    for (const item of items) {
      const url = item.link?.["@_href"] ?? item.link ?? "";

      // カテゴリーでフィルタリング
      if (category) {
        const text =
          extractText(item.title) + extractText(item.description) + source;
        if (!text.includes(category)) {
          continue;
        }
      }

      articles.push({
        id: extractText(item.guid) || extractText(item.id) || url,
        title: extractText(item.title) || "No Title",
        description: extractDescription(item)
          .split("\n")
          .slice(0, 2)
          .join("\n"),
        imageUrl: extractImageUrl(item),
        url,
        pubDate: item.pubDate ?? item.published ?? item.updated,
        source,
      });
    }
  }

  return shuffle(articles);
}

export async function getArticleById(
  settings: SettingItem[],
  id: string,
): Promise<Article | undefined> {
  const articles = await getRssArticles(true, settings);
  return articles.find((article) => article.id === id);
}

export function getCategories(articles: Article[]): string[] {
  const categories: string[] = [];
  const excludedWords = [
    "、",
    "。",
    "しました",
    "です",
    "ます",
    "する",
    "した",
    "ついて",
    "なった",
    "いる",
    "よると",
    "dass",
    "diese",
    "dieser",
    "und",
    "nicht",
    "mit",
    "für",
    "dann",
    "auch",
    "une",
    "dans",
    "pour",
    "avec",
    "mais",
    "comme",
    "cette",
    "tous",
    "entre",
    "nous",
    "vous",
    "sobre",
    "como",
    "porque",
    "desde",
    "cuando",
    "donde",
    "todos",
    "este",
    "estas",
    "también",
    "그리고",
    "대한",
    "합니다",
    "있는",
    "있다",
    "입니다",
    "하는",
    "하고",
    "이번",
    "더",
    "또",
    "questo",
    "questa",
    "questi",
    "queste",
    "anche",
    "dove",
    "quando",
    "sono",
    "molto",
    "più",
    "tra",
    "senza",
    "para",
    "onde",
    "porque",
    "muito",
    "também",
    "menos",
    "News",
    "news",
    "ニュース",
    "some",
    "have",
    "and",
    "the",
    "for",
    "with",
    "from",
    "that",
    "this",
    "are",
    "not",
    "but",
    "they",
    "their",
    "there",
    "which",
    "what",
    "when",
    "where",
    "who",
    "whom",
    "whose",
    "been",
    "being",
    "has",
    "had",
    "will",
    "would",
    "can",
    "could",
    "should",
    "make",
    "into",
    "just",
    "about",
    "like",
    "time",
    "year",
    "also",
    "even",
    "much",
    "many",
    "more",
    "most",
    "other",
    "such",
    "only",
    "very",
    "then",
    "than",
    "them",
    "these",
    "those",
    "well",
    "back",
    "down",
    "here",
    "over",
    "under",
    "while",
    "again",
    "away",
    "each",
    "every",
    "next",
    "last",
    "new",
    "old",
    "out",
    "still",
    "through",
    "upon",
    "within",
    "without",
    "your",
    "we",
    "our",
    "us",
    "you",
    "he",
    "him",
    "his",
    "she",
    "her",
    "it",
    "its",
    "am",
    "is",
    "was",
    "were",
    "be",
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
    "sixth",
    "info",
  ];

  for (const article of articles) {
    const text = `
      ${article.title}
      ${article.description}
    `;
    categories.push(article.source ?? "Unknown Source");
    const words =
      text.match(
        /[A-Z]?[a-z]+|[A-Z]+(?![a-z])|[一-龠]+|[ぁ-ん]+|[ァ-ヶー]+|\d+/g,
      ) ?? [];
    for (const word of words) {
      if (word.length <= 3) {
        continue;
      }

      if (excludedWords.some((excludedWord) => word.includes(excludedWord))) {
        continue;
      }

      categories.push(word);
    }
  }

  // 出現回数を数える
  const counts = new Map<string, number>();

  for (const category of categories) {
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  // 10回以上出たものだけ残す
  const filtered = categories.filter(
    (category) => (counts.get(category) ?? 0) >= 10,
  );

  // 重複削除
  return Array.from(new Set(filtered));
}
