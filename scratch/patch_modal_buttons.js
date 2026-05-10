
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Skedar/Desktop/IA - SITES/GSC/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- Patching Modal Buttons ---');

const search = '<button onClick={() => setViewingDraft(null)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-colors">Fechar</button>';
const replacement = `                                                <button onClick={() => setViewingDraft(null)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-colors">Fechar</button>
                                                <button 
                                                    onClick={() => {
                                                        const opp = seoOpportunities.find(o => o.id === viewingDraft.id);
                                                        handleViewLayout(opp);
                                                        setViewingDraft(null);
                                                    }}
                                                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-2.5 rounded-xl text-sm border border-white/20 transition-all flex items-center gap-2">
                                                    🎨 Gerar Layout (Stitch)
                                                </button>`;

if (content.includes(search)) {
    content = content.replace(search, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Botão de Layout adicionado ao Modal!');
} else {
    console.log('❌ Botão fechar não encontrado!');
}
