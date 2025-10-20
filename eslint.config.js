import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: pluginReact,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginReact.configs.flat.recommended.rules,

      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "warn",
    },
    settings: {
      react: {
        version: "detect", // Auto-detects React version
      },
    },
  },
]);
