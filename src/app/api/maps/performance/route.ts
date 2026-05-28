import { NextResponse } from 'next/server';
import { getLocationPerformance } from '@/lib/business';

export async function POST(request: Request) {
  try {
    const { locationName, days, startDate, endDate } = await request.json();
    
    if (!locationName) {
      return NextResponse.json({ error: 'locationName é obrigatório' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const perf = await getLocationPerformance(locationName, days, startDate, endDate, token);
    
    if (!perf) {
      return NextResponse.json({ totals: { calls: 0, directions: 0, websiteClicks: 0 }, chartData: [] });
    }

    return NextResponse.json(perf);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
