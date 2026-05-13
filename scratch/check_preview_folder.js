
import * as ftp from "basic-ftp";

async function checkPreview() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });
        
        console.log("--- VERIFICANDO PASTAS NO SERVIDOR ---");
        
        // Tentar listar a raiz e ver se existe a public_html
        let list = await client.list();
        console.log("\nConteúdo da Raiz:");
        list.forEach(i => console.log(i.type === 2 ? "[DIR]" : "[FILE]", i.name));

        // Entrar na public_html se existir
        if (list.some(i => i.name === 'public_html')) {
            await client.cd("public_html");
            console.log("\nConteúdo de /public_html:");
            list = await client.list();
            list.forEach(i => console.log(i.type === 2 ? "[DIR]" : "[FILE]", i.name));
            
            if (list.some(i => i.name === 'preview')) {
                await client.cd("preview");
                console.log("\n✅ A pasta /preview existe! Conteúdo:");
                list = await client.list();
                list.forEach(i => console.log(i.type === 2 ? "[DIR]" : "[FILE]", i.name));
            } else {
                console.log("\n❌ A pasta /preview NÃO foi encontrada em /public_html");
            }
        }
        
    } catch(err) {
        console.error("Erro na inspeção:", err);
    } finally {
        client.close();
    }
}

checkPreview();
