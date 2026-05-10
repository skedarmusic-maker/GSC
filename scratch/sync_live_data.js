
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Skedar/Desktop/IA - SITES/GSC/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- Iniciando Sincronização Ao Vivo nas Oportunidades ---');

const searchMap = ") : seoOpportunities.map((opp) => (";
const replacementMap = `) : seoOpportunities.map((opp) => {
                                                const liveMatch = data?.keywords?.find((k: any) => k.keys && k.keys[0] === opp.keyword);
                                                const displayImpressions = liveMatch ? liveMatch.impressions : opp.impressions;
                                                const displayCtr = liveMatch ? (liveMatch.ctr * 100).toFixed(1) : opp.ctr;
                                                const isLive = !!liveMatch;
                                                
                                                return (`;

const searchTdStart = `<td className="p-4">
                                                        <p className="font-bold text-white text-[15px]">{opp.keyword}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Identificado em {new Date(opp.created_at).toLocaleDateString()}</p>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <p className="text-white font-bold">{(opp.impressions || 0).toLocaleString()}</p>
                                                        <p className="text-xs text-red-400 font-medium mt-1">{(opp.ctr || 0)}% CTR</p>
                                                    </td>`;

const replacementTdStart = `<td className="p-4">
                                                        <p className="font-bold text-white text-[15px]">{opp.keyword}</p>
                                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                            {isLive && <span className="bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20 px-1 py-0.5 rounded text-[9px] font-bold">AO VIVO</span>}
                                                            Identificado em {new Date(opp.created_at).toLocaleDateString()}
                                                        </p>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <p className="text-white font-bold">{(displayImpressions || 0).toLocaleString()}</p>
                                                        <p className="text-xs text-red-400 font-medium mt-1">{displayCtr}% CTR</p>
                                                    </td>`;

// Procura o final do map que era "))}" e substitui por ")})}"
const mapEndSearch = `</td>
                                                </tr>
                                            ))}
                                        </tbody>`;

const mapEndReplacement = `</td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>`;

if (content.includes(searchMap) && content.includes(searchTdStart) && content.includes(mapEndSearch)) {
    content = content.replace(searchMap, replacementMap);
    content = content.replace(searchTdStart, replacementTdStart);
    content = content.replace(mapEndSearch, mapEndReplacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Sincronização ao vivo aplicada com sucesso!');
} else {
    console.log('❌ Não encontrou os blocos exatos para substituir.');
}
