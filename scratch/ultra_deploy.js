
import * as ftp from "basic-ftp";
import fs from "fs";
import path from "path";

async function ultraDeploy() {
    const localOutPath = "c:/Users/Skedar/Desktop/IA - SITES/Pagani Custom/out";
    
    console.log("--- INICIANDO ULTRA DEPLOY (CORREÇÃO FÍSICA DE LINKS) ---");

    function walkAndFix(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                walkAndFix(fullPath);
            } else if (file.endsWith(".html")) {
                let content = fs.readFileSync(fullPath, "utf8");
                // Troca links absolutos da raiz por links absolutos da subpasta preview
                content = content.replace(/href="\//g, 'href="/preview/');
                content = content.replace(/src="\//g, 'src="/preview/');
                // Garante que não duplicamos o /preview/preview
                content = content.replace(/\/preview\/preview\//g, '/preview/');
                fs.writeFileSync(fullPath, content);
            }
        }
    }

    try {
        walkAndFix(localOutPath);
        console.log("✅ Todos os arquivos HTML foram corrigidos fisicamente.");

        const client = new ftp.Client();
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });

        console.log("Limpando e subindo para /preview...");
        await client.cd("/");
        await client.ensureDir("preview");
        await client.clearWorkingDir();
        await client.uploadFromDir(localOutPath);

        console.log("\n🚀 AGORA VAI! O design Brutalista está online e corrigido.");
        console.log("LINK: https://paganicustomfloripa.com.br/preview/protecao-de-farol/");
    } catch (err) {
        console.error("Erro fatal:", err.message);
    } finally {
        client.close();
    }
}

ultraDeploy();
