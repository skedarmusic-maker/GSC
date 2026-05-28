require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = 'f05d9158-6991-46cb-99d1-00c43be2949d'; // focus.earts@gmail.com

async function setAdminRole() {
  console.log('Forcing super_admin role and active subscription for focus.earts@gmail.com...');
  
  await supabase.from('user_roles').upsert({
    user_id: userId,
    role: 'super_admin'
  });
  
  await supabase.from('user_credits').upsert({
    user_id: userId,
    subscription_status: 'active'
  });

  console.log('Done!');
}

setAdminRole();
