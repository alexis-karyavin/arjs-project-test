import { defineConfig, loadEnv } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    base: process.env.NODE_ENV === "development" ? "" : "/arjs-project-test/",
    server: { https: true },
    plugins: [basicSsl()],
  });
};
