
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Skedar/Desktop/IA - SITES/GSC/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- Iniciando Patch via Node ---');

// 1. Sidebar
const sidebarSearch = /<span>🎯 Oportunidades IA<\/span>\s*<span className="bg-\[#00ff9d\] text-gray-900 text-\[10px\] font-bold px-1\.5 py-0\.5 rounded-full shadow-\[0_0_8px_#00ff9d\]">Novo<\/span>\s*<\/button>\s*<\/li>\s*<\/ul>/;
const sidebarReplace = `<span>🎯 Oportunidades IA</span>
                    <span className="bg-[#00ff9d] text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_8px_#00ff9d]">Novo</span>
                  </button>
                </li>
                <li className="pt-4"><p className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider px-2">Gestão do Cliente</p></li>
                <li><button onClick={() => setActiveTab('client-config')} className={\`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all \${activeTab === 'client-config' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-400 hover:text-white hover:bg-[#161b22]'}\`}>⚙️ Configurações</button></li>
              </ul>`;

if (sidebarSearch.test(content)) {
    content = content.replace(sidebarSearch, sidebarReplace);
    console.log('✅ Sidebar atualizada!');
} else {
    console.log('❌ Sidebar não encontrada com o padrão Regex.');
}

// 2. Content
const contentSearch = /\s+\)}\s+<\/div>\s+\)\s+\)\s+<\/main>/;
const contentReplace = `
                )}

                {/* ---------------- CONFIGURAÇÕES DO CLIENTE ---------------- */}
                {activeTab === 'client-config' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-8">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2">⚙️ Configurações do Projeto</h2>
                            <p className="text-gray-400">Gerencie onde este site está localizado no seu computador e como a IA deve se comportar.</p>
                        </div>

                        <div className="glass-card rounded-2xl p-8 border-white/5 space-y-8">
                            {/* CAMINHO LOCAL */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-[#00ff9d] uppercase tracking-widest">Caminho do Projeto no Windows</label>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        value={configLocalPath}
                                        onChange={(e) => setConfigLocalPath(e.target.value)}
                                        placeholder="Ex: C:\\\\Users\\\\Skedar\\\\Desktop\\\\IA - SITES\\\\Projeto-X"
                                        className="flex-1 bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff9d] transition-all"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 italic">Este caminho é usado pelo Antigravity para criar novas páginas e componentes diretamente na pasta do cliente.</p>
                            </div>

                            {/* PERFIL DE IA */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-[#00ff9d] uppercase tracking-widest">Perfil de Escrita IA (Treinamento)</label>
                                <textarea 
                                    value={configBusinessContext}
                                    onChange={(e) => setConfigBusinessContext(e.target.value)}
                                    rows={10}
                                    placeholder="Descreva o tom de voz, público-alvo, serviços principais e o 'estilo' que a IA deve seguir para este cliente..."
                                    className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff9d] transition-all font-sans leading-relaxed"
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button 
                                    onClick={handleSaveSettings}
                                    disabled={savingConfig}
                                    className="bg-[#00ff9d] text-gray-900 font-black px-10 py-4 rounded-xl shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_35px_rgba(0,255,157,0.5)] transition-all flex items-center gap-2">
                                    {savingConfig ? '⌛ Salvando...' : '💾 Salvar Configurações'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            )
          )}
        </main>`;

if (contentSearch.test(content)) {
    content = content.replace(contentSearch, contentReplace);
    console.log('✅ Área de conteúdo atualizada!');
} else {
    console.log('❌ Área de conteúdo não encontrada.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('--- Patch Finalizado ---');
