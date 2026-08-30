require('next/dist/compiled/dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('wedding_cms_settings').select('content').eq('id', 'default').maybeSingle();
  console.log(JSON.stringify(data.content.gallery, null, 2));
}
run();
