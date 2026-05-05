import { NextResponse } from 'next/server';
import { listSites } from '@/lib/gsc';

export async function GET() {
  try {
    const sites = await listSites();
    return NextResponse.json(sites);
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao buscar sites' }, { status: 500 });
  }
}
