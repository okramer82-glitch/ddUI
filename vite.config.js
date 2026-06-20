import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Served from https://okramer82-glitch.github.io/ddUI/ on GitHub Pages.
  base: "/ddUI/",
  plugins: [react()],
  server: { port: 5173, open: true },
});
