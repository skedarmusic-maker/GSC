import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // Este contém o userId do Supabase

  if (error) {
    console.error('Erro no consentimento do Google:', error);
    return NextResponse.redirect(`${new URL(req.url).origin}/?google_connected=false&error=consent_denied`);
  }

  if (!code) {
    return NextResponse.json({ error: 'Código de autorização ausente.' }, { status: 400 });
  }

  if (!state) {
    return NextResponse.json({ error: 'Identificação de estado do usuário perdida.' }, { status: 400 });
  }

  try {
    const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ADS_CLIENT_ID,
      process.env.GOOGLE_ADS_CLIENT_SECRET,
      redirectUri
    );

    // Trocar o código de autorização pelos tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Buscar informações do usuário do Google logado
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const googleEmail = userInfo.data.email || '';

    if (!tokens.refresh_token) {
      console.warn('Google não retornou refresh_token neste fluxo (usuário já havia consentido anteriormente).');
    }

    // Criar cliente Supabase com a Service Role para ignorar RLS e realizar o upsert
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Salvar ou atualizar os tokens na tabela google_integrations
    const updateData: any = {
      user_id: state,
      google_email: googleEmail,
      access_token: tokens.access_token || '',
      expires_at: new Date(Date.now() + (tokens.expiry_date || 3600 * 1000)).toISOString()
    };

    // Só atualizamos o refresh_token se ele for retornado pelo Google neste fluxo
    if (tokens.refresh_token) {
      updateData.refresh_token = tokens.refresh_token;
    }

    // 1. Verificar se a integração para esse usuário já existe no banco
    const { data: existingIntegration, error: checkError } = await adminSupabase
      .from('google_integrations')
      .select('user_id')
      .eq('user_id', state)
      .maybeSingle();

    if (checkError) throw checkError;

    let dbError;
    if (existingIntegration) {
      // Atualizar integração existente
      const { error: updateError } = await adminSupabase
        .from('google_integrations')
        .update(updateData)
        .eq('user_id', state);
      dbError = updateError;
    } else {
      // Inserir nova integração
      const { error: insertError } = await adminSupabase
        .from('google_integrations')
        .insert([updateData]);
      dbError = insertError;
    }

    if (dbError) throw dbError;

    // Redireciona de volta para o dashboard principal informando o sucesso na conexão!
    return NextResponse.redirect(`${new URL(req.url).origin}/?google_connected=true`);
  } catch (err: any) {
    console.error('Erro crítico no callback do Google OAuth2:', err);
    return NextResponse.redirect(`${new URL(req.url).origin}/?google_connected=false&error=callback_failed`);
  }
}
