import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  base: process.env.NODE_ENV === "development" ? "" : "/arjs-project-test/",
  server: { https: true },
  plugins: [basicSsl()],
});
