import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  build: {
    lib: {
      entry: "src/PollWidget.ts",
      name: "PollWidget",
      fileName: "poll-widget",
    },
    rollupOptions: {
      output: {
        // Ensure the widget works as a standalone module
        inlineDynamicImports: true,
      },
    },
  },
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
  ],
});
