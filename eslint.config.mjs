import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/service",
              message:
                "❌ Service client is not allowed. Use getDB() from '@/lib/supabase/server' (server) or createClient() from '@/lib/supabase/client' (client).",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
