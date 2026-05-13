'use client';
import { useState } from 'react';

interface Props {
  data: any;
  selectedClient: any;
}

type SortField = 'page' | 'clicks' | 'impressions' | 'ctr' | 'position';
type SortOrder = 'asc' | 'desc';

export default function TabSEOPages({ data, selectedClient }: Props) {
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: 'clicks',
    order: 'desc'
  });

  if (!data?.pages) return null;

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedPages = [...data.pages].sort((a: any, b: any) => {
    let valA, valB;

    switch (sortConfig.field) {
      case 'page':
        valA = a.keys[0].toLowerCase();
        valB = b.keys[0].toLowerCase();
        break;
      case 'clicks':
        valA = a.clicks;
        valB = b.clicks;
        break;
      case 'impressions':
        valA = a.impressions;
        valB = b.impressions;
        break;
      case 'ctr':
        valA = a.ctr;
        valB = b.ctr;
        break;
      case 'position':
        valA = a.position;
        valB = b.position;
        break;
      default:
        return 0;
    }

    if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return <span className="opacity-20 ml-1">⇅</span>;
    return <span className="text-[#00ff9d] ml-1">{sortConfig.order === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">📄 Top Páginas (Landing Pages)</h2>
      <div className="glass-card rounded-2xl border-[#00ff9d]/10 overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-[#161b22] text-gray-400 border-b border-gray-800">
            <tr>
              <th 
                className="px-6 py-4 font-bold cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('page')}
              >
                Página <SortIcon field="page" />
              </th>
              <th 
                className="px-6 py-4 font-bold cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('clicks')}
              >
                Cliques <SortIcon field="clicks" />
              </th>
              <th 
                className="px-6 py-4 font-bold cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('impressions')}
              >
                Impressões <SortIcon field="impressions" />
              </th>
              <th 
                className="px-6 py-4 font-bold cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('ctr')}
              >
                CTR <SortIcon field="ctr" />
              </th>
              <th 
                className="px-6 py-4 font-bold cursor-pointer hover:text-white transition-colors rounded-tr-xl"
                onClick={() => handleSort('position')}
              >
                Posição <SortIcon field="position" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {sortedPages.slice(0, 50).map((p: any, i: number) => (
              <tr key={i} className="hover:bg-[#161b22]/80 transition-colors group">
                <td className="px-6 py-4 max-w-sm lg:max-w-xl truncate">
                  <a href={p.keys[0]} target="_blank" className="text-[#00ff9d] hover:underline font-medium">
                    {p.keys[0].replace(selectedClient?.gscUrl || '', '') || '/'}
                  </a>
                </td>
                <td className="px-6 py-4 text-white font-bold">{p.clicks}</td>
                <td className="px-6 py-4 text-gray-400 group-hover:text-gray-200">{p.impressions.toLocaleString()}</td>
                <td className="px-6 py-4 text-gray-400 group-hover:text-gray-200">{(p.ctr * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 text-gray-400 group-hover:text-gray-200">{p.position.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

