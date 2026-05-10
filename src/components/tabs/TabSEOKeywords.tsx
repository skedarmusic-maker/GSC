'use client';

interface Props {
  data: any;
}

export default function TabSEOKeywords({ data }: Props) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">📊 Palavras-chave que mais geram cliques</h2>
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-[#161b22] text-gray-400 border-b border-gray-800">
          <tr>
            <th className="px-6 py-4 font-bold rounded-tl-xl">Palavra-chave</th>
            <th className="px-6 py-4 font-bold">Cliques</th>
            <th className="px-6 py-4 font-bold">Impressões</th>
            <th className="px-6 py-4 font-bold">CTR</th>
            <th className="px-6 py-4 font-bold rounded-tr-xl">Posição</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {data.keywords.slice(0, 30).map((k: any, i: number) => (
            <tr key={i} className="hover:bg-[#161b22]/80 transition-colors">
              <td className="px-6 py-4 text-white font-medium">{k.keys[0]}</td>
              <td className="px-6 py-4 text-[#00ff9d] font-bold">{k.clicks}</td>
              <td className="px-6 py-4 text-gray-400">{k.impressions}</td>
              <td className="px-6 py-4 text-gray-400">{(k.ctr * 100).toFixed(1)}%</td>
              <td className="px-6 py-4 text-gray-400">{k.position.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
