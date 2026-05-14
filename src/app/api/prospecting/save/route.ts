import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST → Salvar uma análise
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from('gbp_analyses')
      .insert([{
        business_name: body.name,
        address: body.address || '',
        score: body.score || 0,
        rating: body.rating || 0,
        reviews: body.reviews || 0,
        website: body.website || '',
        website_status: body.websiteStatus || '',
        phone: body.phone || '',
        category: body.category || '',
        metrics: body.metrics || [],
        competitors: body.competitors || [],
        opportunities: body.opportunities || [],
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET → Listar análises salvas
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('gbp_analyses')
      .select('id, created_at, business_name, score, address, rating, reviews, website_status, opportunities, metrics, competitors, phone, website, category')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ analyses: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE → Apagar uma análise
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const { error } = await supabase.from('gbp_analyses').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
