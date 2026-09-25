const js = require("@eslint/js");
const globals = require("globals");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = [
  { ignores: ["node_modules/", "backend/public/uploads/", "frontend/dist/"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "commonjs",
      globals: globals.node,
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", ignoreRestSiblings: true }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  {
    files: ["frontend/**/*.{js,jsx,mjs}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", ignoreRestSiblings: true }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
    },
  },
];
