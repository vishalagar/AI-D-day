import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Integration tests share one live dev DB/Redis (no per-test isolation
    // like a transaction rollback or a dedicated test branch), so files
    // must not run concurrently or their reads/writes race each other.
    fileParallelism: false,
  },
});
