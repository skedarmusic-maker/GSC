
import os

file_path = r'c:\Users\Skedar\Desktop\IA - SITES\GSC\src\app\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Adicionar o item na sidebar
sidebar_search = "<span>🎯 Oportunidades IA</span>\n                    <span className=\"bg-[#00ff9d] text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_8px_#00ff9d]\">Novo</span>\n                  </button>\n                </li>\n              </ul>"
sidebar_replace = "<span>🎯 Oportunidades IA</span>\n                    <span className=\"bg-[#00ff9d] text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_8px_#00ff9d]\">Novo</span>\n                  </button>\n                </li>\n                <li className=\"pt-4\"><p className=\"text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider px-2\">Gestão do Cliente</p></li>\n                <li><button onClick={() => setActiveTab('client-config')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'client-config' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'text-gray-400 hover:text-white hover:bg-[#161b22]`}>⚙️ Configurações</button></li>\n              </ul>"

if sidebar_search in content:
    content = content.replace(sidebar_search, sidebar_replace)
    print("Sidebar atualizada!")
else:
    # Tenta uma versão mais flexível sem quebras de linha exatas
    print("Sidebar não encontrada com o padrão exato. Tentando padrão flexível...")
    import re
    pattern = re.compile(r'<span>🎯 Oportunidades IA</span>.*?</span>.*?<span.*?Novo.*?</span>.*?</button>.*?</li>.*?</ul>', re.DOTALL)
    replacement = r'<span>🎯 Oportunidades IA</span>\n                    <span className="bg-[#00ff9d] text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_8px_#00ff9d]">Novo</span>\n                  </button>\n                </li>\n                <li className="pt-4"><p className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider px-2">Gestão do Cliente</p></li>\n                <li><button onClick={() => setActiveTab(\'client-config\')} className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === \'client-config\' ? \'bg-[#00ff9d]/10 text-[#00ff9d]\' : \'text-gray-400 hover:text-white hover:bg-[#161b22]`}>⚙️ Configurações</button></li>\n              </ul>'
    content, count = pattern.subn(replacement, content)
    if count > 0:
        print(f"Sidebar atualizada via Regex! ({count} substituições)")

# 2. Adicionar o conteúdo da aba no final
content_search = "                )}\n              </div>\n            )\n          )}\n        </main>"
content_replace = """                )}

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
        </main>"""

if content_search in content:
    content = content.replace(content_search, content_replace)
    print("Área de conteúdo atualizada!")
else:
    print("Área de conteúdo não encontrada. Tentando padrão flexível...")
    pattern = re.compile(r'                \)}\s+</div>\s+\)\s+\)\s+</main>', re.DOTALL)
    content, count = pattern.subn(content_replace, content)
    if count > 0:
        print(f"Área de conteúdo atualizada via Regex! ({count} substituições)")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
