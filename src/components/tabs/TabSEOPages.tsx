'use client';

interface Props {
  data: any;
  selectedClient: any;
}

export default function TabSEOPages({ data, selectedClient }: Props) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">📄 Top Páginas (Landing Pages)</h2>
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-[#161b22] text-gray-400 border-b border-gray-800">
          <tr>
            <th className="px-6 py-4 font-bold rounded-tl-xl">Página</th>
            <th className="px-6 py-4 font-bold">Cliques</th>
            <th className="px-6 py-4 font-bold">CTR</th>
            <th className="px-6 py-4 font-bold rounded-tr-xl">Posição</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {data.pages.slice(0, 30).map((p: any, i: number) => (
            <tr key={i} className="hover:bg-[#161b22]/80 transition-colors">
              <td className="px-6 py-4 max-w-sm lg:max-w-xl truncate">
                <a href={p.keys[0]} target="_blank" className="text-[#00ff9d] hover:underline font-medium">
                  {p.keys[0].replace(selectedClient?.gscUrl || '', '') || '/'}
                </a>
              </td>
              <td className="px-6 py-4 text-white font-bold">{p.clicks}</td>
              <td className="px-6 py-4 text-gray-400">{(p.ctr * 100).toFixed(1)}%</td>
              <td className="px-6 py-4 text-gray-400">{p.position.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
