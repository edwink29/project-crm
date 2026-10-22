import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

// Muat variabel dari .env.test
dotenv.config({ path: ".env.test" });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    testTimeout: 15000, // Timeout 15 detik untuk request network cloud
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
