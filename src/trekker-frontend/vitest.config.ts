import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

// Separate Vitest config — keeps test environment out of the Vite build pipeline.
//
// pool: "vmThreads" avoids the Node 25 native localStorage conflict that occurs
// when Vitest spawns worker subprocesses. vmThreads runs tests in the same Node
// process using vm.Module isolation, which lets jsdom own the localStorage global.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost",
      },
    },
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    pool: "vmThreads",
  },
})
