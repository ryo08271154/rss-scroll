const MAX_RESPONSE_SIZE = 2 * 1024 * 1024; // 2 MiB
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

function jsonResponse(data: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  // localhost
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "localhost.localdomain"
  ) {
    return true;
  }

  // 既知のクラウド/内部用ホスト名
  const blockedHostnames = [
    "metadata.google.internal",
    "metadata.google",
    "instance-data.ec2.internal",
    "instance-data",
  ];

  if (
    blockedHostnames.some(
      (blocked) => host === blocked || host.endsWith(`.${blocked}`),
    )
  ) {
    return true;
  }

  // IPv4 literal
  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);

  if (ipv4) {
    const [, a, b, c, d] = ipv4.map(Number);

    if (
      [a, b, c, d].some(
        (value) => !Number.isInteger(value) || value < 0 || value > 255,
      )
    ) {
      return true;
    }

    // 0.0.0.0/8
    if (a === 0) return true;

    // 10.0.0.0/8
    if (a === 10) return true;

    // 100.64.0.0/10
    if (a === 100 && b >= 64 && b <= 127) {
      return true;
    }

    // 127.0.0.0/8
    if (a === 127) return true;

    // 169.254.0.0/16
    if (a === 169 && b === 254) {
      return true;
    }

    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) {
      return true;
    }

    // 192.0.0.0/24
    if (a === 192 && b === 0 && c === 0) {
      return true;
    }

    // 192.0.2.0/24
    if (a === 192 && b === 0 && c === 2) {
      return true;
    }

    // 192.168.0.0/16
    if (a === 192 && b === 168) {
      return true;
    }

    // 198.18.0.0/15
    if (a === 198 && (b === 18 || b === 19)) {
      return true;
    }

    // 198.51.100.0/24
    if (a === 198 && b === 51 && c === 100) {
      return true;
    }

    // 203.0.113.0/24
    if (a === 203 && b === 0 && c === 113) {
      return true;
    }

    // multicast / reserved
    if (a >= 224) {
      return true;
    }

    return false;
  }

  // IPv6 loopback / unspecified
  if (host === "::1" || host === "::") {
    return true;
  }

  // IPv4-mapped IPv6
  const mappedIPv4 = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);

  if (mappedIPv4) {
    return isBlockedHostname(mappedIPv4[1]);
  }

  // IPv4-compatible IPv6
  const compatibleIPv4 = host.match(/^::(\d+\.\d+\.\d+\.\d+)$/);

  if (compatibleIPv4) {
    return isBlockedHostname(compatibleIPv4[1]);
  }

  // fc00::/7 - Unique Local Address
  if (host.startsWith("fc") || host.startsWith("fd")) {
    return true;
  }

  // fe80::/10 - Link Local
  if (
    host.startsWith("fe8") ||
    host.startsWith("fe9") ||
    host.startsWith("fea") ||
    host.startsWith("feb")
  ) {
    return true;
  }

  // ff00::/8 - Multicast
  if (host.startsWith("ff")) {
    return true;
  }

  return false;
}

function validateUrl(rawUrl: string): URL {
  if (rawUrl.length > 2048) {
    throw new Error("URL is too long");
  }

  const url = new URL(rawUrl);

  // http / https のみ
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }

  // user:password@host を禁止
  if (url.username || url.password) {
    throw new Error("Credentials in URL are not allowed");
  }

  // localhost / private / metadata 等を拒否
  if (isBlockedHostname(url.hostname)) {
    throw new Error("Private or local URLs are not allowed");
  }

  /**
   * ポート制限はしない。
   *
   * 任意RSSをサポートするため、
   * https://example.com:8443/feed
   * のようなURLも許可する。
   */
  return url;
}

async function fetchWithRedirects(
  initialUrl: URL,
  signal: AbortSignal,
): Promise<Response> {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const response = await fetch(currentUrl.toString(), {
      method: "GET",
      signal,

      headers: {
        "User-Agent": "RSS-Scroll/1.0 (RSS Reader)",

        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },

      /**
       * リダイレクトは自分で処理して、
       * 次のURLを必ず再検証する。
       */
      redirect: "manual",
      cache: "no-store",
    });

    const isRedirect = response.status >= 300 && response.status < 400;

    if (!isRedirect) {
      return response;
    }

    if (redirectCount >= MAX_REDIRECTS) {
      return new Response(null, {
        status: 310,
        statusText: "Too many redirects",
      });
    }

    const location = response.headers.get("Location");

    if (!location) {
      return new Response(null, {
        status: 502,
        statusText: "Redirect location is missing",
      });
    }

    let nextUrl: URL;

    try {
      // 相対Locationにも対応
      nextUrl = new URL(location, currentUrl);

      // リダイレクト先も最初から再検証
      nextUrl = validateUrl(nextUrl.toString());
    } catch {
      throw new Error("Invalid redirect URL");
    }

    currentUrl = nextUrl;
  }

  throw new Error("Too many redirects");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return jsonResponse(
      {
        error: "url parameter is required",
      },
      400,
    );
  }

  let targetUrl: URL;

  try {
    targetUrl = validateUrl(rawUrl);
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Invalid URL",
      },
      400,
    );
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetchWithRedirects(targetUrl, controller.signal);

    if (!response.ok) {
      return jsonResponse(
        {
          error: "Failed to fetch RSS from upstream",
        },
        502,
      );
    }

    if (!response.body) {
      return jsonResponse(
        {
          error: "Upstream response has no body",
        },
        502,
      );
    }

    /**
     * Content-Length がある場合の早期チェック
     */
    const contentLength = response.headers.get("content-length");

    const parsedContentLength = contentLength ? Number(contentLength) : null;

    if (
      parsedContentLength !== null &&
      Number.isFinite(parsedContentLength) &&
      parsedContentLength > MAX_RESPONSE_SIZE
    ) {
      return jsonResponse(
        {
          error: "RSS response is too large",
        },
        413,
      );
    }

    /**
     * ストリームを読みながらサイズ制限
     */
    const reader = response.body.getReader();

    const chunks: Uint8Array[] = [];

    let totalSize = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        if (!value) {
          continue;
        }

        totalSize += value.byteLength;

        if (totalSize > MAX_RESPONSE_SIZE) {
          await reader.cancel();

          return jsonResponse(
            {
              error: "RSS response is too large",
            },
            413,
          );
        }

        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    /**
     * Uint8Arrayを結合
     */
    const body = new Uint8Array(totalSize);

    let offset = 0;

    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }

    /**
     * 重要:
     *
     * 上流Content-Typeは絶対に返さない。
     * application/xml に固定。
     */
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",

        "X-Content-Type-Options": "nosniff",

        /**
         * APIレスポンスをHTML/JSとして
         * 実行されにくくする追加防御。
         */
        "Content-Security-Policy": "default-src 'none'; sandbox",

        "Cache-Control": "public, max-age=300, s-maxage=300",

        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("RSS proxy error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return jsonResponse(
        {
          error: "RSS request timed out",
        },
        504,
      );
    }

    if (
      error instanceof Error &&
      error.message === "RSS response is too large"
    ) {
      return jsonResponse(
        {
          error: "RSS response is too large",
        },
        413,
      );
    }

    return jsonResponse(
      {
        error: "Failed to fetch RSS",
      },
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
