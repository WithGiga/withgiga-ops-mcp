import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  splitting: false,
  clean: true,
  bundle: true,
  noExternal: [/.*/],
  minify: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
