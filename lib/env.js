function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function SUPABASE_URL() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

function SUPABASE_ANON() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

function SUPABASE_SERVICE() {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

function USE_GEO_VIEWS() {
  const raw =
    process.env.USE_GEO_VIEWS ?? process.env.NEXT_PUBLIC_USE_GEO_VIEWS ?? "";
  const normalized = String(raw).trim().toLowerCase();
  if (!normalized) return false;
  return ["1", "true", "yes", "on"].includes(normalized);
}

const envExports = {
  requireEnv,
  SUPABASE_URL,
  SUPABASE_ANON,
  SUPABASE_SERVICE,
  USE_GEO_VIEWS,
};

export default envExports;
