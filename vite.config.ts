import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { seedDesignPlugin } from "@seed-design/vite-plugin";

export default defineConfig({
  plugins: [react(), seedDesignPlugin()],
});
