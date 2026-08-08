import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { seedDesignPlugin } from "@seed-design/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    seedDesignPlugin({ colorMode: "dark-only" }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-192.png", "pwa-512.png", "pwa-maskable-512.png"],
      manifest: {
        name: "하루FC 회비관리",
        short_name: "하루FC 회비",
        description: "조기축구팀 하루FC 회비 입출금 및 회원 납부 현황 관리 대시보드",
        lang: "ko",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#0b0d10",
        background_color: "#0b0d10",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // 오프라인에서도 앱 셸(빌드 산출물)은 열리도록 프리캐시.
        // 데이터는 localStorage 기반이라 별도 API 캐싱 전략은 아직 불필요.
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      },
      devOptions: {
        // 개발 서버(npm run dev)에서도 설치 테스트가 가능하도록 활성화
        enabled: true,
      },
    }),
  ],
});
