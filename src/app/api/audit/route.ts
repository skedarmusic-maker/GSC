import { NextResponse } from 'next/server';
import { getLocationDetails } from '@/lib/business';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { accountId, locationId } = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const userSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
      const { data: { user }, error: authError } = await userSupabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
      }
    }

    if (!accountId || !locationId) {
      return NextResponse.json({ error: 'Faltam dados de identificação' }, { status: 400 });
    }

    const locationName = `accounts/${accountId}/locations/${locationId}`;
    const details = await getLocationDetails(locationName, token);

    if (!details) {
      return NextResponse.json({ error: 'Falha ao recuperar dados do Google Maps' }, { status: 500 });
    }

    // Gerando a Auditoria
    const checklist = [
      {
        id: 'phone',
        name: 'Telefone Principal',
        description: 'Um telefone ajuda os clientes a entrarem em contato rapidamente.',
        passed: !!(details.phoneNumbers?.primaryPhone),
        value: details.phoneNumbers?.primaryPhone || 'Não preenchido',
        scoreWeight: 20
      },
      {
        id: 'website',
        name: 'Site da Empresa',
        description: 'Direciona tráfego para a sua página principal de vendas.',
        passed: !!details.websiteUri,
        value: details.websiteUri || 'Não preenchido',
        scoreWeight: 20
      },
      {
        id: 'hours',
        name: 'Horário de Funcionamento',
        description: 'Evita frustrações de clientes indo até a loja fechada.',
        passed: !!(details.regularHours?.periods?.length > 0),
        value: details.regularHours?.periods?.length ? 'Preenchido' : 'Não preenchido',
        scoreWeight: 20
      },
      {
        id: 'description',
        name: 'Descrição da Empresa',
        description: 'Uma boa descrição melhora seu SEO e ajuda o Google a entender o seu negócio.',
        passed: !!(details.profile?.description),
        value: details.profile?.description ? 'Preenchido' : 'Não preenchido',
        scoreWeight: 20
      },
      {
        id: 'category',
        name: 'Categoria Principal',
        description: 'O fator de ranqueamento mais importante do Google Maps.',
        passed: !!(details.categories?.primaryCategory),
        value: details.categories?.primaryCategory?.displayName || 'Não preenchida',
        scoreWeight: 20
      }
    ];

    const score = checklist.reduce((total, item) => total + (item.passed ? item.scoreWeight : 0), 0);
    
    let grade = 'Crítico';
    let color = '#ff4444';
    if (score >= 80) { grade = 'Excelente'; color = '#00C851'; }
    else if (score >= 60) { grade = 'Bom'; color = '#ffbb33'; }

    // Salvar auditoria no histórico do Supabase
    try {
      // 1. Achar o cliente correspondente a essa localização
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('gbp_location_id', locationId)
        .maybeSingle();

      if (client?.id) {
        const currentDate = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        await supabase
          .from('gbp_audit_history')
          .upsert({
            client_id: client.id,
            location_id: locationId,
            date: currentDate,
            score,
            grade,
            color,
            checklist
          }, { onConflict: 'location_id, date' });
      }
    } catch (dbErr) {
      // Falha silenciosa no salvamento de histórico para não quebrar a API principal se a tabela não estiver criada
      console.error('Erro ao registrar histórico de auditoria no Supabase:', dbErr);
    }

    return NextResponse.json({ 
      score,
      grade,
      color,
      checklist,
      mapsUri: details.metadata?.mapsUri || null,
      address: details.storefrontAddress ? `${details.storefrontAddress.addressLines?.join(', ')}, ${details.storefrontAddress.locality} - ${details.storefrontAddress.administrativeArea}` : null
    });

  } catch (error) {
    console.error('Erro na auditoria:', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}
