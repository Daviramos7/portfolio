import { defineConfig, searchForWorkspaceRoot } from "vite"
import { realpathSync } from "node:fs"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    fs: {
      // Linked worker dependencies resolve outside their worktree. Allow only
      // the installed font package, preserving Vite's workspace boundary.
      allow: [
        searchForWorkspaceRoot(fileURLToPath(new URL(".", import.meta.url))),
        realpathSync(fileURLToPath(new URL("./node_modules/@fontsource-variable/geist", import.meta.url))),
      ],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
