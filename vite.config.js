import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  base: "/arjs-project-test",
  server: { https: true },
  plugins: [basicSsl()],
});
