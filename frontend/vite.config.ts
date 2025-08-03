import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          wagmi: ["wagmi", "@rainbow-me/rainbowkit"],
          ui: ["framer-motion", "lucide-react"],
        },
      },
    },
    target: "esnext",
    sourcemap: false,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "wagmi", "@rainbow-me/rainbowkit"],
  },
});
