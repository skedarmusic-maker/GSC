import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório para iniciar o fluxo OAuth.' }, { status: 400 });
    }

    const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ADS_CLIENT_ID,
      process.env.GOOGLE_ADS_CLIENT_SECRET,
      redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid'
    ];

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Importante para receber o refresh_token
      scope: scopes,
      include_granted_scopes: true,
      prompt: 'consent', // Força o consentimento para sempre gerar o refresh_token
      state: userId
    });

    return NextResponse.redirect(authorizationUrl);
  } catch (error: any) {
    console.error('Erro ao gerar URL OAuth do Google:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
