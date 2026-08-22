/**
 * RSS Proxy API Route
 * GET /api/rss?url=<RSS_URL>
 *
 * Web ブラウザの CORS 制限を回避するため、
 * サーバー側で RSS をフェッチしてクライアントに返すプロキシエンドポイント。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  // url パラメータのバリデーション
  if (!url) {
    return new Response(JSON.stringify({ error: "url parameter is required" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // URL 形式のバリデーション
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // http/https のみ許可
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return new Response(JSON.stringify({ error: "Only http/https URLs are allowed" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "RSS-Scroll/1.0 (RSS Reader)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream error: ${response.status} ${response.statusText}` }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const xml = await response.text();
    const contentType = response.headers.get("Content-Type") ?? "application/xml";

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Failed to fetch RSS: ${String(error)}` }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// CORS プリフライトリクエスト対応
export async function OPTIONS(_request: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
