import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps asset paths relative, so the build works at
// https://<user>.github.io/piano-path/ and from a local file alike.
export default defineConfig({
  base: "./",
  plugins: [react()],
  // abcjs (~510 kB, Study's reading passages only) is split into its own chunk and loaded on demand
  build: { chunkSizeWarningLimit: 600 },
});
