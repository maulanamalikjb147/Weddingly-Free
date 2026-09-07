const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envLocal.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching current Supabase config...");
  const { data, error: fetchErr } = await supabase.from('wedding_cms_settings').select('content').eq('id', 'default').single();
  
  if (fetchErr && fetchErr.code !== 'PGRST116') { // PGRST116 is not found
    console.error("Fetch error:", fetchErr);
    return;
  }
  
  let currentContent = data ? data.content : {};
  
  // Overwrite specific fields
  currentContent.coupleNames = "Anisa & Maulana";
  currentContent.eventDate = "2026-09-24T00:00:00";
  currentContent.groom = "maulana";
  currentContent.groomBio = "putra.....";
  currentContent.bride = "Anisa Syafitri";
  currentContent.brideBio = "putri bp.....";
  currentContent.brideGroomGreeting = "Assalamualaikum Warahmatullahi wabarakatuh";
  currentContent.brideGroomText = "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra/putri kami";
  
  if (!currentContent.holyMatrimony) currentContent.holyMatrimony = {};
  currentContent.holyMatrimony.time = "12.00";
  
  if (!currentContent.weddingReception) currentContent.weddingReception = {};
  currentContent.weddingReception.time = "15.00";

  console.log("Updating Supabase...");
  const { error } = await supabase.from('wedding_cms_settings').upsert({ id: 'default', content: currentContent });
  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Successfully updated Supabase 'default' content!");
  }
}

run();
