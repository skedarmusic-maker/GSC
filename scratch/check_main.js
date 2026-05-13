
import * as ftp from "basic-ftp";

async function checkMainSite() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });
        
        console.log("--- LENDO INDEX DO SITE PRINCIPAL ---");
        
        await client.cd("/public_html");
        const list = await client.list();
        
        if (list.some(i => i.name === 'index.php')) {
            console.log("Site principal parece ser WordPress (index.php encontrado).");
        } else if (list.some(i => i.name === 'index.html')) {
            console.log("Site principal parece ser estático (index.html encontrado).");
        } else {
            console.log("Nenhum index comum encontrado na raiz da public_html.");
            console.log("Conteúdo da public_html:");
            list.forEach(i => console.log(i.type === 2 ? "[DIR]" : "[FILE]", i.name));
        }

    } catch(err) {
        console.error("Erro:", err.message);
    } finally {
        client.close();
    }
}

checkMainSite();
