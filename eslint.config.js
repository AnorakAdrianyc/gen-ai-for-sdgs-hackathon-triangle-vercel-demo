import js from "@eslint/js";
import ts from "typescript-eslint";
import globals from "globals";
import hooks from "eslint-plugin-react-hooks";
export default ts.config(
  { ignores: ["dist", "public/codecs"] },
  js.configs.recommended,
  {
    files: ["server/**/*.mjs", "scripts/**/*.mjs", "tests/**/*.mjs", "vite.config.ts"],
    languageOptions: { globals: globals.node },
  },
  ...ts.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": hooks },
    rules: hooks.configs.recommended.rules,
  },
);
