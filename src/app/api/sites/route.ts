import { NextResponse } from 'next/server';
import { listSites } from '@/lib/gsc';
import { listLocations } from '@/lib/business';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    // 1. Tentar buscar do banco de dados (Supabase)
    let { data: dbClients, error: dbError } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (dbError) throw dbError;

    // 2. Se o banco estiver vazio, fazemos o seeding automático (Primeiro Acesso)
    if (!dbClients || dbClients.length === 0) {
      console.log('🔄 Banco de dados vazio. Iniciando sincronização inicial...');
      
          }
        }
      }

      // Se não achou vínculo no Maps, adiciona como site "Somente GSC"
      if (!foundMatch) {
        unifiedList.push({
          id: site.siteUrl,
          name: site.siteUrl.replace(/^sc-domain:/, '').replace(/^https?:\/\//, ''),
          type: 'GSC_ONLY',
          gbpData: null,
          gscUrl: site.siteUrl
        });
      }
    }

    return NextResponse.json(unifiedList);
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao buscar clientes' }, { status: 500 });
  }
}
