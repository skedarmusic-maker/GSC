'use client';
import { useState } from 'react';

interface Props {
  data: any;
}

type SortField = 'keyword' | 'clicks' | 'impressions' | 'ctr' | 'position';
type SortOrder = 'asc' | 'desc';

export default function TabSEOKeywords({ data }: Props) {
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: 'clicks',
    order: 'desc'
  });

  if (!data?.keywords) return null;

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedKeywords = [...data.keywords].sort((a: any, b: any) => {
    let valA, valB;

    switch (sortConfig.field) {
      case 'keyword':
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
      <h2 className="text-2xl font-bold mb-6">📊 Palavras-chave que mais geram cliques</h2>
      <div className="glass-card rounded-2xl border-[#00ff9d]/10 overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-[#161b22] text-gray-400 border-b border-gray-800">
            <tr>
              <th 
                className="px-6 py-4 font-bold cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('keyword')}
              >
                Palavra-chave <SortIcon field="keyword" />
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
            {sortedKeywords.slice(0, 50).map((k: any, i: number) => (
              <tr key={i} className="hover:bg-[#161b22]/80 transition-colors group">
                <td className="px-6 py-4 text-white font-medium">{k.keys[0]}</td>
                <td className="px-6 py-4 text-[#00ff9d] font-bold">{k.clicks}</td>
                <td className="px-6 py-4 text-gray-400 group-hover:text-gray-200">{k.impressions.toLocaleString()}</td>
                <td className="px-6 py-4 text-gray-400 group-hover:text-gray-200">{(k.ctr * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 text-gray-400 group-hover:text-gray-200">{k.position.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

