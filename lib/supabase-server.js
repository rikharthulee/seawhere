const { createClient } = require("@supabase/supabase-js");
const { SUPABASE_URL, SUPABASE_SERVICE } = require("./env");

function getServiceSupabase() {
  return createClient(SUPABASE_URL(), SUPABASE_SERVICE(), {
    auth: {
      persistSession: false,
    },
  });
}

module.exports = {
  getServiceSupabase,
};
