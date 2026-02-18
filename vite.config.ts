import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/api/sms": {
          target: "https://sms.arkesel.com",
          changeOrigin: true,
          rewrite: (p) => "/api/v2/sms/send",
          configure: (proxy) => {
            const apiKey = env.ARKESEL_API_KEY || "";
            console.log(
              `[sms-proxy] ARKESEL_API_KEY loaded: ${apiKey ? `"${apiKey.slice(0, 6)}..."` : "⚠️  EMPTY / NOT SET"}`,
            );
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("api-key", apiKey);
              console.log(
                `[sms-proxy] → POST https://sms.arkesel.com/api/v2/sms/send  (key starts with: ${apiKey.slice(0, 6)})`,
              );
            });
          },
        },
      },
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
