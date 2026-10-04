import {
  ScrollViewStyleReset,
  useServerDocumentContext,
} from "expo-router/html";
import type { PropsWithChildren } from "react";

const googleTagId = process.env.EXPO_PUBLIC_GOOGLE_TAG_ID;
const appDescription =
  "A sleek RSS reader that shows your feeds in card and list views.";
const supportedLanguages = ["ja", "en", "de", "es", "fr", "it", "ko", "pt"];
const creator = {
  "@type": "Person",
  name: "ryo08271154",
  url: "https://ryo08271154.wordpress.com/",
  sameAs: ["https://github.com/ryo08271154", "https://x.com/ryo08271154"],
};
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "RSS Scroll",
      inLanguage: supportedLanguages,
      isAccessibleForFree: true,
      description: appDescription,
      publisher: creator,
    },
    {
      "@type": "WebApplication",
      name: "RSS Scroll",
      creator,
      applicationCategory: "NewsApplication",
      applicationSubCategory: "RSS Reader",
      operatingSystem: "Web, Android",
      browserRequirements: "Requires JavaScript",
      inLanguage: supportedLanguages,
      isAccessibleForFree: true,
      description: appDescription,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};
const structuredDataJson = JSON.stringify(structuredData).replace(
  /</g,
  "\\u003c",
);

// This file is web-only and used to configure the root HTML for every
// web page during server rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } =
    useServerDocumentContext();

  return (
    <html {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>RSS Scroll</title>
        <meta name="description" content={appDescription} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: structuredDataJson,
          }}
        />

        {googleTagId ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "${googleTagId}");
`,
              }}
            />
          </>
        ) : null}

        {/* Link the PWA manifest file. */}
        <link rel="manifest" href="/manifest.json" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Add any additional <head> elements that you want globally available on web... */}
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
