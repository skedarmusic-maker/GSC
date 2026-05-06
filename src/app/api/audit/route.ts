import { NextResponse } from 'next/server';
import { getLocationDetails } from '@/lib/business';

export async function POST(req: Request) {
  try {
    const { accountId, locationId } = await req.json();

    if (!accountId || !locationId) {
      return NextResponse.json({ error: 'Faltam dados de identificação' }, { status: 400 });
    }

    const locationName = `accounts/${accountId}/locations/${locationId}`;
    const details = await getLocationDetails(locationName);

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

    return NextResponse.json({ 
      score,
      grade,
      color,
      checklist
    });

  } catch (error) {
    console.error('Erro na auditoria:', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}
