
import * as ftp from "basic-ftp";

async function deepCheck() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });
        
        console.log("--- LISTANDO CONTEÚDO DA PASTA PREVIEW ---");
        
        if (await client.cd("preview")) {
            const list = await client.list();
            list.forEach(i => console.log(i.type === 2 ? "[DIR]" : "[FILE]", i.name));
            
            // Tentar entrar na pasta da página específica
            if (list.some(i => i.name === 'protecao-de-farol')) {
                console.log("\n--- CONTEÚDO DE protecao-de-farol ---");
                await client.cd("protecao-de-farol");
                const sublist = await client.list();
                sublist.forEach(s => console.log(s.type === 2 ? "[DIR]" : "[FILE]", s.name));
            }
        } else {
            console.log("❌ Não consegui entrar na pasta preview");
        }
        
    } catch(err) {
        console.error("Erro:", err);
    } finally {
        client.close();
    }
}

deepCheck();
