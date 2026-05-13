
import * as ftp from "basic-ftp";

async function findRealSite() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });
        
        console.log("--- CAÇANDO A PASTA REAL DO SITE ---");
        
        // 1. Ver o que tem na raiz absoluta
        let list = await client.list("/");
        console.log("\nPastas na Raiz Absoluta:");
        list.forEach(i => console.log(i.type === 2 ? "[DIR]" : "[FILE]", i.name));

        // 2. Se tiver pasta 'domains', entrar nela
        if (list.some(i => i.name === 'domains')) {
            console.log("\nEntrando em /domains...");
            await client.cd("/domains");
            list = await client.list();
            list.forEach(i => console.log(i.type === 2 ? "[DIR]" : "[FILE]", i.name));
            
            for (const item of list) {
                if (item.type === 2) {
                    console.log(`\nEntrando em /domains/${item.name}/public_html...`);
                    try {
                        await client.cd(`${item.name}/public_html`);
                        const siteFiles = await client.list();
                        siteFiles.slice(0, 5).forEach(f => console.log(f.type === 2 ? "[DIR]" : "[FILE]", f.name));
                        console.log("... (mais arquivos encontrados)");
                        await client.cd("/domains");
                    } catch (e) {
                        console.log(`Pasta /public_html não encontrada em ${item.name}`);
                    }
                }
            }
        }
    } catch(err) {
        console.error("Erro:", err.message);
    } finally {
        client.close();
    }
}

findRealSite();
