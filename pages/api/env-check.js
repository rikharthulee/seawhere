const { SUPABASE_URL, SUPABASE_ANON, SUPABASE_SERVICE } =
  require("../../lib/env").default;

function has(fn) {
  try {
    fn();
    return true;
  } catch (_) {
    return false;
  }
}

function handler(req, res) {
  res.status(200).json({
    NEXT_PUBLIC_SUPABASE_URL: has(SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: has(SUPABASE_ANON),
    SUPABASE_SERVICE_ROLE: has(SUPABASE_SERVICE),
  });
}

module.exports = handler;
module.exports.default = handler;
