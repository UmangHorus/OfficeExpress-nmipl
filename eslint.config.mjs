import next from "@next/eslint-plugin-next";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tailwindcss from "eslint-plugin-tailwindcss"; // Add this import

export default [
  {
    plugins: {
      "@next/next": next,
      react: react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      tailwindcss: tailwindcss, // Add this plugin
    },
    rules: {
      // Next.js rules
      "@next/next/no-html-link-for-pages": "error",

      // Tailwind CSS rules
      "tailwindcss/no-custom-classname": "off",
      "tailwindcss/enforces-shorthand": "warn",

      // React rules
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react/react-in-jsx-scope": "off",

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Accessibility rules
      "jsx-a11y/alt-text": "warn",
    },
  },
  {
    ignores: ["node_modules/", ".next/", "out/"],
  },
];
