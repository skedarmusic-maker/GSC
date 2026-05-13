
import { NextResponse } from 'next/server';
import { createLocalPost } from '@/lib/business';

export const dynamic = 'force-dynamic';

const AUTH_KEY = "gsc_auto_2026_x92"; // Chave de segurança para o n8n

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-api-key');
    
    if (authHeader !== AUTH_KEY) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { accountId, locationId, text, imageUrl } = await req.json();

    if (!accountId || !locationId || !text) {
      return NextResponse.json({ error: 'Faltam campos obrigatórios (accountId, locationId, text)' }, { status: 400 });
    }

    console.log(`🤖 Automação: Iniciando postagem para ${locationId}...`);

    const success = await createLocalPost(accountId, locationId, {
      text,
      imageUrl,
      buttonType: 'LEARN_MORE',
      buttonUrl: 'https://paganicustomfloripa.com.br' // URL padrão ou envie via n8n
    });

    if (!success) {
      return NextResponse.json({ error: 'Falha ao postar no Google' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Postagem realizada com sucesso via automação!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na API de automação:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
