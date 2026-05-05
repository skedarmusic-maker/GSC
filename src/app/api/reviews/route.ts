import { NextResponse } from 'next/server';
import { getReviews } from '@/lib/business';

export async function POST(req: Request) {
  try {
    const { accountId, locationId } = await req.json();

    if (!accountId || !locationId) {
      return NextResponse.json({ error: 'accountId e locationId são obrigatórios' }, { status: 400 });
    }

    const reviews = await getReviews(accountId, locationId);
    
    if (!reviews) {
      return NextResponse.json({ error: 'Falha ao buscar avaliações' }, { status: 500 });
    }

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('API /reviews error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
