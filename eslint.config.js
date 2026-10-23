import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  // contracts/ holds copies of the back ends' schemas, and the types generated from them.
  { ignores: ["dist", "coverage", "playwright-report", "test-results", "contracts"] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      // React Router redirects by throwing a Response, such as `throw redirect("/")`.
      "@typescript-eslint/only-throw-error": [
        "error",
        { allow: [{ from: "lib", name: "Response" }] },
      ],
    },
  },
  {
    files: ["**/*.tsx"],
    extends: [reactHooks.configs.flat["recommended-latest"], reactRefresh.configs.vite],
  },
  {
    // Route modules export their loader and action beside the page or the layout, which is how
    // React Router defines a route; Fast Refresh then reloads the page instead of patching it.
    files: ["src/pages/**/*.tsx", "src/app/*Layout.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    files: ["**/*.{js,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
);
