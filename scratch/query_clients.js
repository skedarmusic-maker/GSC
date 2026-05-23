const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*');

  if (error) {
    console.error('Error fetching clients:', error);
    return;
  }

  console.log('--- CLIENTS IN DATABASE ---');
  clients.forEach(c => {
    console.log(`ID: ${c.id}`);
    console.log(`Name: ${c.name}`);
    console.log(`Project Folder: ${c.project_folder}`);
    console.log(`Stitch Prompt: ${c.stitch_prompt}`);
    console.log(`Local Path: ${c.local_path}`);
    console.log(`Has Design Context Layout: ${c.design_context && !!c.design_context.layout}`);
    if (c.design_context && c.design_context.layout) {
      console.log(`Layout Sample: ${c.design_context.layout.substring(0, 300)}...`);
    }
    console.log('---------------------------');
  });
}

main();
