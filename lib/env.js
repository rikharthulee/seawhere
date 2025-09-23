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
  return requireEnv("SUPABASE_SERVICE_ROLE");
}

module.exports = {
  requireEnv,
  SUPABASE_URL,
  SUPABASE_ANON,
  SUPABASE_SERVICE,
};
