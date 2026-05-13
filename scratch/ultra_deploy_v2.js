
import * as ftp from "basic-ftp";
import fs from "fs";
import path from "path";

async function ultraDeployV2() {
    const localOutPath = "c:/Users/Skedar/Desktop/IA - SITES/Pagani Custom/out";
    
    console.log("--- INICIANDO ULTRA DEPLOY V2 (CORREÇÃO DE DUPLICIDADE) ---");

    function walkAndFix(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                walkAndFix(fullPath);
            } else if (file.endsWith(".html")) {
                let content = fs.readFileSync(fullPath, "utf8");
                
                // Primeiro, removemos qualquer /preview/ que já exista para começar do zero
                content = content.replace(/href="\/preview\//g, 'href="/');
                content = content.replace(/src="\/preview\//g, 'src="/');
                
                // Agora, adicionamos o /preview/ da forma correta
                content = content.replace(/href="\//g, 'href="/preview/');
                content = content.replace(/src="\//g, 'src="/preview/');
                
                // Correção final de segurança para garantir que não haja duplicidade
                while (content.includes("/preview/preview/")) {
                    content = content.replace(/\/preview\/preview\//g, '/preview/');
                }
                
                fs.writeFileSync(fullPath, content);
            }
        }
    }

    try {
        walkAndFix(localOutPath);
        console.log("✅ HTMLs limpos e corrigidos sem duplicidade.");

        const client = new ftp.Client();
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });

        console.log("Fazendo upload limpo...");
        await client.cd("/");
        await client.ensureDir("preview");
        await client.clearWorkingDir();
        await client.uploadFromDir(localOutPath);

        console.log("\n🚀 AGORA É REAL! Layout carregado com sucesso.");
        console.log("LINK: https://paganicustomfloripa.com.br/preview/protecao-de-farol/");
    } catch (err) {
        console.error("Erro fatal:", err.message);
    } finally {
        client.close();
    }
}

ultraDeployV2();
