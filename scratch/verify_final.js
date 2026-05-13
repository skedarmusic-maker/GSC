
import * as ftp from "basic-ftp";

async function verifyFinalStructure() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });
        
        console.log("--- VERIFICANDO ESTRUTURA FINAL EM public_html/preview ---");
        
        await client.cd("/public_html/preview");
        const list = await client.list();
        list.forEach(i => console.log(i.type === 2 ? "[DIR]" : "[FILE]", i.name));
        
        if (list.some(i => i.name === 'protecao-de-farol')) {
            console.log("\nEntrando em protecao-de-farol...");
            await client.cd("protecao-de-farol");
            const sublist = await client.list();
            sublist.forEach(s => console.log(s.type === 2 ? "[DIR]" : "[FILE]", s.name));
        }

    } catch(err) {
        console.error("Erro:", err.message);
    } finally {
        client.close();
    }
}

verifyFinalStructure();
