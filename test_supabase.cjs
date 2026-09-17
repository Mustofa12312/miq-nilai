const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('/home/mustofa/Workspace/Products/Archive/miq_ujian_tes/nilai miq/.env.local', 'utf-8');
const lines = env.split('\n');
let url = '', key = '';
lines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('examiner_assignments').select('*').limit(5);
  console.log('Assignments Error:', error);
  console.log('Assignments:', data);
}
test();
