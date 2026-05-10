
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Skedar/Desktop/IA - SITES/GSC/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Modificar a assinatura do map
content = content.replace(
  ") : seoOpportunities.map((opp) => (",
  `) : seoOpportunities.map((opp) => {
                                                const liveMatch = data?.keywords?.find((k) => k.keys && k.keys[0] === opp.keyword);
                                                const displayImpressions = liveMatch ? liveMatch.impressions : opp.impressions;
                                                const displayCtr = liveMatch ? (liveMatch.ctr * 100).toFixed(1) : opp.ctr;
                                                const isLive = !!liveMatch;
                                                return (`
);

// 2. Modificar a exibição do Keyword e Data
content = content.replace(
  `<p className="font-bold text-white text-[15px]">{opp.keyword}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Identificado em {new Date(opp.created_at).toLocaleDateString()}</p>`,
  `<p className="font-bold text-white text-[15px]">{opp.keyword}</p>
                                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                            {isLive && <span className="bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">AO VIVO</span>}
                                                            <span>Identificado em {new Date(opp.created_at).toLocaleDateString()}</span>
                                                        </div>`
);

// 3. Modificar as métricas de Impressions e CTR
content = content.replace(
  `<p className="text-white font-bold\">{(opp.impressions || 0).toLocaleString()}</p>
                                                        <p className="text-xs text-red-400 font-medium mt-1">{(opp.ctr || 0)}% CTR</p>`,
  `<p className="text-white font-bold">{(displayImpressions || 0).toLocaleString()}</p>
                                                        <p className="text-xs text-red-400 font-medium mt-1">{displayCtr}% CTR</p>`
);

// 4. Fechar o Map corretamente
content = content.replace(
  `                                                </tr>
                                            ))}
                                        </tbody>`,
  `                                                </tr>
                                            );
                                        })}
                                        </tbody>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Modificação de Sincronização ao Vivo concluída!');
