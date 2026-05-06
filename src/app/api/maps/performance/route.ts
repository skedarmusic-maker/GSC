import { NextResponse } from 'next/server';
import { getLocationPerformance } from '@/lib/business';

export async function POST(request: Request) {
  try {
    const { locationName, days } = await request.json();
    
    if (!locationName) {
      return NextResponse.json({ error: 'locationName é obrigatório' }, { status: 400 });
    }

    const perf = await getLocationPerformance(locationName, days || 28);
    
    if (!perf) {
      return NextResponse.json({ calls: 0, directions: 0, websiteClicks: 0 });
    }

    return NextResponse.json(perf);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
