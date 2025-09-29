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
              importNames: ["createServerClient", "getServerSupabase"],
              message:
                "❌ Service client is not allowed. Use getDB() from '@/lib/supabase/server' (server) or createClient() from '@/lib/supabase/client' (client).",
            },
            {
              name: "@/lib/route-params",
              message:
                "Deprecated. Await Next.js App Router params directly: const { slug } = (await props.params) or const { id } = (await ctx.params).",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        // Disallow destructuring { params } in function args in App Router (pages/layouts/route handlers)
        {
          selector:
            "FunctionDeclaration ObjectPattern > Property[key.name='params']",
          message:
            "Do not destructure { params } in the function signature. Use (await props.params) or (await ctx.params) inside the function.",
        },
        {
          selector:
            "FunctionExpression ObjectPattern > Property[key.name='params']",
          message:
            "Do not destructure { params } in the function signature. Use (await props.params) or (await ctx.params) inside the function.",
        },
        {
          selector:
            "ArrowFunctionExpression ObjectPattern > Property[key.name='params']",
          message:
            "Do not destructure { params } in the function signature. Use (await props.params) or (await ctx.params) inside the function.",
        },
      ],
    },
  },
];

export default eslintConfig;
