
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Skedar/Desktop/IA - SITES/GSC/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- Iniciando Patch de Conteúdo Robusto via Node ---');

const insertPoint = content.lastIndexOf('</main>');
if (insertPoint === -1) {
    console.log('❌ </main> não encontrado!');
    process.exit(1);
}

// Vamos subir a partir do </main> para encontrar os fechamentos
const beforeMain = content.substring(0, insertPoint);
const match = beforeMain.match(/(\s+\)\s+\)\s+)$/);

if (match) {
    console.log('✅ Ponto de inserção encontrado via Regex reversa!');
    const newContent = `
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
`;
    
    // Inserir ANTES do fechamento das chaves do condicional anterior
    // Na verdade, vamos inserir antes do final do </main> mas mantendo a estrutura
    const finalContent = beforeMain.replace(/(\s+)\)\s+\)\s+$/, (m, s) => {
        return newContent + s + ') ) ';
    }) + content.substring(insertPoint);

    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log('--- Patch Finalizado ---');
} else {
    console.log('❌ Padrão de fechamento não encontrado.');
    // Tenta um último recurso: inserir antes do </main> diretamente
    const lastDitch = beforeMain + `
                {activeTab === 'client-config' && (
                    <div className="p-8">Configurações (Emergência)</div>
                )}
` + content.substring(insertPoint);
    fs.writeFileSync(filePath, lastDitch, 'utf8');
}
