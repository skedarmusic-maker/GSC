import { NextResponse } from 'next/server';
import { inspectURL } from '@/lib/gsc';

export async function POST(request: Request) {
  try {
    const { siteUrl, inspectionUrl } = await request.json();
    const data = await inspectURL(siteUrl, inspectionUrl);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Falha na inspeção' }, { status: 500 });
  }
}
