// import { defineConfig } from "vite";
// import tailwindcss from "@tailwindcss/vite";
// import react from "@vitejs/plugin-react";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss(), "prettier-plugin-tailwindcss"],
//   server: {
//     proxy: {
//       "/api": "http://localhost:3030",
//     },
//   },
// });

// import { defineConfig } from "vite";
// import tailwindcss from "@tailwindcss/vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react(), tailwindcss(), "prettier-plugin-tailwindcss"],
//   server: {
//     port: 5174,
//     proxy: {
//       "/api": {
//         target: "http://localhost:8080",
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
// });

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5174,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:8080",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      "process.env": env,
    },
  };
});
