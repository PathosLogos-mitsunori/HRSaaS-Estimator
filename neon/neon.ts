import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  preview: {
    functions: {
      api: {
        name: "HR SaaS Flow Finder API",
        source: "./functions/api.ts"
      }
    }
  }
});
