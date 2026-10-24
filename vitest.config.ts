import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

// Muat variabel dari .env.test
dotenv.config({ path: ".env.test" });

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom", // Diperlukan untuk rendering komponen React (unit test)
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    testTimeout: 15000, // Timeout 15 detik untuk request network cloud
    // Jalankan test secara sequential agar file integrasi yang berbagi DB yang sama
    // tidak saling mengganggu (resetTables dari satu file bisa hapus data file lain).
    pool: "forks",
    poolOptions: {
      forks: {
        maxPoolSize: 1,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
