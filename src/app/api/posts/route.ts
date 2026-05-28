import { NextResponse } from 'next/server';
import { createLocalPost } from '@/lib/business';

export async function POST(req: Request) {
  try {
    const { accountId, locationId, postText, imageUrl, buttonType, buttonUrl } = await req.json();

    if (!accountId || !locationId || !postText) {
      return NextResponse.json({ error: 'accountId, locationId e postText são obrigatórios' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const success = await createLocalPost(accountId, locationId, {
        text: postText,
        imageUrl,
        buttonType,
        buttonUrl
    }, token);
    
    if (!success) {
      return NextResponse.json({ error: 'Falha ao criar postagem no Google' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /posts error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
