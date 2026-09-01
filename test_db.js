const { createClient } = require('@supabase/supabase-js');
const { loadEnvLocal } = require('./scripts/load-env-local.cjs');
loadEnvLocal();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { data } = await supabase.from('_siraman_wedding_cms_settings').select('content').eq('id', 'default').maybeSingle();
  console.log(JSON.stringify(data.content.gallery, null, 2));
}
run();
