import { NextResponse } from 'next/server';
import { replyToReview } from '@/lib/business';

export async function POST(req: Request) {
  try {
    const { reviewName, replyText } = await req.json();

    if (!reviewName || !replyText) {
      return NextResponse.json({ error: 'reviewName e replyText são obrigatórios' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const success = await replyToReview(reviewName, replyText, token);
    
    if (!success) {
      return NextResponse.json({ error: 'Falha ao enviar resposta para o Google' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /reviews/reply error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
