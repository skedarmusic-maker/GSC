import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasHostinger = !!process.env.HOSTINGER_API_TOKEN;
  const hostingerSuffix = process.env.HOSTINGER_API_TOKEN 
    ? `...${process.env.HOSTINGER_API_TOKEN.slice(-5)}` 
    : 'MISSING';
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { count, error } = await supabase
      .from('gbp_analyses')
      .select('*', { count: 'exact', head: true });

    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const keySuffix = key.length > 5 ? `...${key.slice(-5)}` : 'INVALID';

    return NextResponse.json({
      status: 'ok',
      supabase_url: url || 'MISSING',
      supabase_key_suffix: keySuffix,
      hostinger_token: hostingerSuffix,
      total_records: count || 0,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      message: e.message,
      hostinger_token: hostingerSuffix
    }, { status: 500 });
  }
}
