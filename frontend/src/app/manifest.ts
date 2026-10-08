import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kigyou-list | 日本企業データベース・営業リスト",
    short_name: "Kigyou-list",
    description: "日本全国500万社以上の企業情報を網羅した国内最大級のB2Bデータベース・営業リスト",
    start_url: "/ja",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1B4F8A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
