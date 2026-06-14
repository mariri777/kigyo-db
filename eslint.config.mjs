import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // localStorage など SSR 非対応な外部状態を初期化する典型パターンで頻発する。
      // hydration mismatch を避けるため意図的に useEffect 内で setState する箇所が多いので警告に留める。
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".open-next/**",
    ".wrangler/**",
    "drizzle/**",
  ]),
]);
