
import * as ftp from "basic-ftp";

async function findPublic() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });
        
        console.log("--- PROCURANDO public_html ---");
        
        let list = await client.list();
        console.log("\nPastas na Raiz:");
        list.forEach(i => console.log(i.type === 2 ? "[DIR]" : "[FILE]", i.name));

        // Tentar entrar em pastas comuns da Hostinger
        const commonFolders = ["domains", "paganicustom.com.br", "public_html"];
        for (const folder of commonFolders) {
            if (list.some(i => i.name === folder)) {
                console.log(`\nEntrando em: ${folder}`);
                await client.cd(folder);
                list = await client.list();
                list.forEach(i => console.log(i.type === 2 ? "[DIR]" : "[FILE]", i.name));
            }
        }
        
    } catch(err) {
        console.error("Erro:", err);
    } finally {
        client.close();
    }
}

findPublic();
