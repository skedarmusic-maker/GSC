import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { count, error } = await supabase
      .from('gbp_analyses')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      status: 'ok',
      supabase_url: url || 'MISSING',
      has_service_key: hasKey,
      total_records: count || 0,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      message: e.message,
      supabase_url: url || 'MISSING',
      has_service_key: hasKey
    }, { status: 500 });
  }
}
