
import * as ftp from "basic-ftp";
import path from "path";

async function hostingerFixDeploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "147.93.14.87",
            user: "u786839041.paganicustomsite",
            password: "1q2w3e4r@@@SK",
            port: 21,
            secure: false
        });

        console.log("--- INICIANDO DEPLOY PROFISSIONAL ---");

        // 1. Definir caminhos absolutos para evitar confusão
        const remotePreviewPath = "/public_html/preview";
        const localOutPath = "c:/Users/Skedar/Desktop/IA - SITES/Pagani Custom/out";

        // 2. Limpar a bagunça anterior (pastas duplicadas na raiz)
        console.log("Limpando pastas residuais na raiz...");
        try {
            await client.cd("/");
            await client.removeDir("preview").catch(() => {}); // Remove a 'preview' errada da raiz
            await client.removeDir("public_html/public_html").catch(() => {}); // Remove a 'public_html' duplicada
        } catch (e) {
            console.log("Nada para limpar na raiz ou erro ignorado.");
        }

        // 3. Criar a pasta correta dentro da public_html
        console.log(`\nCriando/Acessando: ${remotePreviewPath}`);
        await client.ensureDir(remotePreviewPath);
        
        // 4. Limpar o conteúdo da pasta preview para garantir deploy limpo
        await client.clearWorkingDir();
        
        // 5. Subir os arquivos
        console.log(`Subindo arquivos de: ${localOutPath}`);
        await client.uploadFromDir(localOutPath);

        console.log("\n✅ DEPLOY CONCLUÍDO COM SUCESSO!");
        console.log("LINK PARA O CLIENTE: https://paganicustom.com.br/preview/protecao-de-farol/");
    }
    catch(err) {
        console.error("\n❌ ERRO DURANTE O PROCESSO:", err.message);
    }
    finally {
        client.close();
    }
}

hostingerFixDeploy();
