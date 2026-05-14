import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.HOSTINGER_API_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'Hostinger API Token não configurado no .env' }, { status: 400 });
  }

  const BASE_URL = 'https://developers.hostinger.com/api';

  let domains = [];
  let vps = [];
  let websites = [];

  // 1. Buscar Domínios (DNS Zones)
  try {
    const dnsRes = await fetch(`${BASE_URL}/dns/v1/zones`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (dnsRes.ok) {
      const text = await dnsRes.text();
      if (text) domains = JSON.parse(text).data || [];
    } else {
      console.error('⚠️ Erro DNS:', dnsRes.status, await dnsRes.text());
    }
  } catch (error) {
    console.error('⚠️ Falha crítica ao buscar DNS:', error);
  }

  // 2. Buscar VPS
  try {
    const vpsRes = await fetch(`${BASE_URL}/vps/v1/vps`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (vpsRes.ok) {
      const text = await vpsRes.text();
      if (text) vps = JSON.parse(text).data || [];
    } else {
      console.error('⚠️ Erro VPS:', vpsRes.status, await vpsRes.text());
    }
  } catch (error) {
    console.error('⚠️ Falha crítica ao buscar VPS:', error);
  }

  // 3. Buscar Websites (Hospedagem)
  try {
    const webRes = await fetch(`${BASE_URL}/hosting/v1/websites`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (webRes.ok) {
      const text = await webRes.text();
      if (text) websites = JSON.parse(text).data || [];
    } else {
      console.error('⚠️ Erro Websites:', webRes.status, await webRes.text());
    }
  } catch (error) {
    console.error('⚠️ Falha crítica ao buscar Websites:', error);
  }

  return NextResponse.json({
    domains,
    vps,
    websites,
    timestamp: new Date().toISOString()
  });
}
