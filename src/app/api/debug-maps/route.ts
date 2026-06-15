import { NextResponse } from 'next/server';
import { listLocations } from '@/lib/business';

export const dynamic = 'force-dynamic';

// Rota de diagnóstico temporária - lista todos os locais reais da API Google
export async function GET() {
  try {
    const locations = await listLocations();
    return NextResponse.json({
      total: locations.length,
      locations: locations.map((l: any) => ({
        name: l.name,              // formato: locations/XXXXXXX
        accountId: l.accountId,
        locationId: l.name?.replace('locations/', ''),
        title: l.title,
        website: l.websiteUri
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
