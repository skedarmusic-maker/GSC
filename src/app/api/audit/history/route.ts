import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json({ error: 'Falta o parâmetro locationId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('gbp_audit_history')
      .select('*')
      .eq('location_id', locationId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar histórico de auditoria:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Erro na rota de histórico de auditoria:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
