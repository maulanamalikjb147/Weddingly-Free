const { loadEnvLocal } = require('./scripts/load-env-local.cjs');
loadEnvLocal();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('_siraman_wedding_cms_settings').select('content').eq('id', 'default').maybeSingle();
  console.log(JSON.stringify(data.content.gallery, null, 2));
}
run();
