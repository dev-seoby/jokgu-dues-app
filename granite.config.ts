import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "jokgu-dues-app",
  brand: {
    displayName: "조기축구팀 회비관리",
    primaryColor: "#3182F6", // 브랜드 강조색: sky. red는 미납/지출 전용으로 예약
    icon: "", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
