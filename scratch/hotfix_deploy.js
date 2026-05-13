
import * as ftp from "basic-ftp";
import fs from "fs";
import path from "path";

async function hotFixAndDeploy() {
    const localOutPath = "c:/Users/Skedar/Desktop/IA - SITES/Pagani Custom/out";
    
    console.log("--- APLICANDO CORREÇÃO DE LAYOUT (MODO PREVIEW) ---");

    // Função para ajustar caminhos no HTML
    function fixPaths(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                fixPaths(fullPath);
            } else if (file.endsWith(".html")) {
                let content = fs.readFileSync(fullPath, "utf8");
                // Substitui caminhos absolutos da raiz por caminhos relativos ao /preview
                content = content.replace(/src="\//g, 'src="/preview/');
                content = content.replace(/href="\//g, 'href="/preview/');
                fs.writeFileSync(fullPath, content);
            }
        }
    }

    try {
        fixPaths(localOutPath);
        console.log("✅ Arquivos HTML corrigidos localmente.");

        const client = new ftp.Client();
        client.ftp.verbose = true;
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });

        console.log("Subindo arquivos para o servidor...");
        await client.cd("/");
        await client.ensureDir("preview");
        await client.clearWorkingDir();
        await client.uploadFromDir(localOutPath);

        console.log("\n🚀 TUDO PRONTO! O layout agora deve carregar perfeitamente.");
        console.log("LINK FINAL: https://paganicustomfloripa.com.br/preview/protecao-de-farol/");
    } catch (err) {
        console.error("Erro durante o processo:", err.message);
    }
}

hotFixAndDeploy();
